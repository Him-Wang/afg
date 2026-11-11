import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ADV 部署地址（可用环境变量覆盖）
const ADV_BASE = (process.env.ADV_BASE_URL || "https://saviorbill.github.io/adv/").replace(/\/?$/, "/");
const MAX_URL = 7800;     // 超长链接容易被聊天客户端截断
const MAX_POINTS = 60;    // 单图数据点上限（超过请先降采样）

const TYPES = [
  "line", "area", "bar", "stacked", "stackedBar", "stackedLine", "step", "dual", "waterfall",
  "rank", "pie", "donut", "funnel", "heatmap", "kpi"
];

function buildConfig({ type, title, labels, series, palette, unit }) {
  const base = { type, title };
  if (palette) base.palette = palette;
  if (unit) base.unit = unit;

  if (type === "heatmap") {
    // 每个 series 作为一行（yLabels），values 为各列数值 → 行优先矩阵
    return Object.assign(base, {
      xLabels: labels,
      yLabels: series.map((s) => s.name),
      values: series.map((s) => s.values)
    });
  }
  if (type === "funnel") {
    return Object.assign(base, {
      labels,
      steps: labels.map((name, i) => ({ name, value: (series[0]?.values?.[i]) ?? 0 }))
    });
  }
  if (type === "pie" || type === "donut") {
    return Object.assign(base, {
      data: { data: labels.map((name, i) => ({ name, value: (series[0]?.values?.[i]) ?? 0 })) }
    });
  }
  if (type === "rank") {
    return Object.assign(base, {
      labels,
      series: series.slice(0, 1),
      unit: unit || "次"
    });
  }
  if (type === "kpi") {
    const cards = series.map((s) => {
      const vals = (s.values || []).filter((v) => typeof v === "number" && isFinite(v));
      const last = vals.length ? vals[vals.length - 1] : null;
      const prev = vals.length > 1 ? vals[vals.length - 2] : null;
      const delta = last !== null && prev !== null && prev !== 0 ? ((last - prev) / Math.abs(prev)) * 100 : null;
      return {
        label: s.name,
        value: last === null ? "—" : String(last),
        delta: delta === null ? "" : (delta >= 0 ? "+" : "") + delta.toFixed(1) + "%",
        dir: delta !== null && delta < 0 ? "neg" : "pos",
        spark: vals.slice(-12)
      };
    });
    return Object.assign(base, { data: { cards } });
  }
  if (type === "waterfall") {
    return Object.assign(base, { labels, values: series[0]?.values || [] });
  }
  return Object.assign(base, { labels, series });
}

const server = new McpServer({ name: "adv-charts", version: "1.2.0" });

server.tool(
  "make_chart",
  "根据数据生成一张高级金融图表（ADV），返回一个可直接打开/分享的图表链接。" +
  "行内数据用 series；可选配色模板。默认「麦肯锡深蓝」，适合报告与路演。",
  {
    type: z.enum(TYPES).describe(
      "图表类型：line=折线，area=面积(推荐)，bar=柱状，stacked=堆叠面积，stackedBar=堆叠柱状，" +
      "stackedLine=堆叠折线，step=阶梯线，dual=双轴对比，waterfall=瀑布图，rank=横向排名，" +
      "pie=饼图，donut=环形，funnel=漏斗，heatmap=热力图(series 每项是一行)，kpi=KPI 卡片"
    ),
    title: z.string().describe("图表标题（显示在图上）"),
    labels: z.array(z.string()).describe("横轴标签 / 分类名，如 ['2020','2021','2022'] 或行业名"),
    series: z.array(z.object({
      name: z.string().describe("指标名；heatmap 时作为行名"),
      values: z.array(z.number()).describe("与 labels 一一对应的数值")
    })).describe("数据系列数组（可多条）"),
    palette: z.enum(["consult", "contrast", "burgundy", "forest"])
      .optional()
      .describe("配色模板：consult=麦肯锡深蓝(默认)，contrast=编辑多彩，burgundy=投行酒红，forest=期刊墨绿"),
    unit: z.string().optional().describe("单位（rank / kpi 等图表使用），如 '次'、'亿元'、'%'")
  },
  async ({ type, title, labels, series, palette, unit }) => {
    /* 数据点上限：链接太长会被客户端截断，先限制点数而不是做短链 */
    const isHeat = type === "heatmap";
    if (isHeat) {
      const cells = labels.length * series.length;
      if (cells > 400) {
        return { content: [{ type: "text", text:
          `热力图单元格过多：${labels.length} 列 × ${series.length} 行 = ${cells}，上限 400。请先聚合或减少行列。` }], isError: true };
      }
    } else if (labels.length > MAX_POINTS) {
      return { content: [{ type: "text", text:
        `数据点过多：${labels.length} 个，上限 ${MAX_POINTS} 个（链接过长会被聊天客户端截断）。` +
        `请先降采样，例如按周/月聚合，或每 ${Math.ceil(labels.length / MAX_POINTS)} 个点取 1 个。` }], isError: true };
    }

    for (const s of series) {
      if (s.values.length !== labels.length) {
        return {
          content: [{
            type: "text",
            text: `数据长度不一致：labels 有 ${labels.length} 项，series「${s.name}」有 ${s.values.length} 项。请让两者一一对应。`
          }],
          isError: true
        };
      }
    }
    const cfg = buildConfig({ type, title, labels, series, palette, unit });
    const b64 = Buffer.from(JSON.stringify(cfg), "utf8").toString("base64url");
    const url = ADV_BASE + "?chart=" + b64;
    if (url.length > MAX_URL) {
      return { content: [{ type: "text", text:
        `链接过长（${url.length} 字符，上限 ${MAX_URL}）。请减少数据点或缩短标题/系列名后重试。` }], isError: true };
    }
    const longNote = url.length > 3000
      ? `\n\n⚠️ 链接 ${url.length} 字符，个别客户端可能截断；建议把数据点压到 30 个以内。`
      : "";
    return {
      content: [{
        type: "text",
        text: `图表已生成，链接如下（在浏览器打开即可查看，可直接分享）：\n${url}${longNote}`
      }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
