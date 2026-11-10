import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// ADV 部署地址（可用环境变量覆盖）
const ADV_BASE = (process.env.ADV_BASE_URL || "https://saviorbill.github.io/adv/").replace(/\/?$/, "/");

const BASE64URL = {
  encode(str) {
    return Buffer.from(str, "utf8").toString("base64url");
  }
};

const server = new McpServer({ name: "adv-charts", version: "1.1.0" });

server.tool(
  "make_chart",
  "根据数据生成一张高级金融图表（ADV），返回一个可直接打开/分享的图表链接。" +
  "传入图表类型、标题、横轴标签和若干数据系列；可选配色模板。" +
  "默认使用「麦肯锡深蓝」配色，适合报告与路演。",
  {
    type: z.enum(["line", "area", "bar", "stacked", "stackedBar", "stackedLine", "step", "dual", "waterfall"])
      .describe("图表类型：line=折线，area=面积(推荐)，bar=柱状，stacked=堆叠面积，stackedBar=堆叠柱状，stackedLine=堆叠折线，step=阶梯线，dual=双轴对比，waterfall=瀑布图"),
    title: z.string().describe("图表标题（会显示在图上）"),
    labels: z.array(z.string()).describe("横轴标签，如年份或月份数组，例如 ['2020','2021','2022']"),
    series: z.array(z.object({
      name: z.string().describe("这条线的名称/指标名"),
      values: z.array(z.number()).describe("与 labels 一一对应的数值数组")
    })).describe("数据系列数组（柱/线可多条）"),
    palette: z.enum(["consult", "contrast", "burgundy", "forest"])
      .optional()
      .describe("配色模板（可选，默认 consult）：consult=麦肯锡深蓝，contrast=编辑多彩，burgundy=投行酒红，forest=期刊墨绿")
  },
  async ({ type, title, labels, series, palette }) => {
    const config = { type, title, labels, series };
    if (palette) config.palette = palette;
    // 瀑布图需要 {labels, values} 结构
    if (type === "waterfall" && series.length) config.values = series[0].values;
    const b64 = BASE64URL.encode(JSON.stringify(config));
    const url = ADV_BASE + "?chart=" + b64;
    return {
      content: [{
        type: "text",
        text: "图表已生成，链接如下（在浏览器打开即可查看，可直接分享）：\n" + url
      }]
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
