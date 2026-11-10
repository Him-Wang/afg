import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// AFG 部署地址（可用环境变量覆盖）
const AFG_BASE = (process.env.AFG_BASE_URL || "https://saviorbill.github.io/adv/").replace(/\/?$/, "/");

const server = new McpServer({ name: "afg-charts", version: "1.0.0" });

server.tool(
  "make_chart",
  "根据数据生成一张高级金融图表（AFG），返回一个可直接打开/分享的图表链接。" +
  "传入图表类型、标题、横轴标签和若干数据系列；可选配色主题。" +
  "当用户没有指定主题时，默认用 midnight-gold（黑金，适合路演/深色演示）。",
  {
    type: z.enum(["line", "area", "bar", "stacked", "stackedBar", "radar"])
      .describe("图表类型：line=折线，area=面积(默认推荐)，bar=柱状，stacked=堆叠面积，stackedBar=堆叠柱状，radar=雷达(需用 indicators+series)"),
    title: z.string().describe("图表标题（会显示在图上）"),
    labels: z.array(z.string()).describe("横轴标签，如年份或月份数组，例如 ['2020','2021','2022']"),
    series: z.array(z.object({
      name: z.string().describe("这条线的名称/指标名"),
      values: z.array(z.number()).describe("与 labels 一一对应的数值数组")
    })).describe("数据系列数组"),
    theme: z.enum(["midnight-gold", "tradingview-dark", "paper", "emerald", "graphite"])
      .optional()
      .describe("配色主题（可选，默认 midnight-gold）：midnight-gold=黑金(路演/深色)，tradingview-dark=深蓝，paper=象牙白(打印/PDF)，emerald=墨绿，graphite=石墨")
  },
  async ({ type, title, labels, series, theme }) => {
    const config = { type, title, labels, series };
    if (theme) config.theme = theme;
    const b64 = Buffer.from(JSON.stringify(config), "utf8").toString("base64url");
    const url = AFG_BASE + "?chart=" + b64;
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
