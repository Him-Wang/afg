# AFG MCP Server

让大模型（Claude / Cursor / Kimi Code / DeepSeek Harness 等）直接调用 `make_chart` 工具，生成 **AFG 高级金融图表链接**。

## 安装

```bash
cd mcp-server
npm install
```

## 配置到客户端

把下面的配置（`command` 用 `node` 的绝对路径、`args` 用本文件的绝对路径）加入对应客户端的 MCP 配置：

```json
{
  "mcpServers": {
    "afg-charts": {
      "command": "node",
      "args": ["/绝对路径/mcp-server/server.js"]
    }
  }
}
```

### 各客户端配置位置

- **Cursor**：`Settings → MCP → Add new MCP server`，Command 填 `node`，Args 填 server.js 绝对路径；或写 `.cursor/mcp.json`
- **Claude Code / VSCode 里的 Claude**：项目根目录建 `.mcp.json`，或运行 `claude mcp add afg-charts -- node /绝对路径/mcp-server/server.js`
- **Kimi Code**：在 MCP 设置里添加，格式同上
- **DeepSeek Harness**：在 MCP 配置里加入上述 JSON

> 绝对路径示例：`/Users/kunrongcai/Desktop/LLM-AI Agent/Deepseek/Skill研究/financial-charts/mcp-server/server.js`

## 使用

配置好之后，直接对大模型说：

> 画一张中国 GDP 同比增速的图，用黑金主题

大模型会自动调用 `make_chart`，返回一个图表链接，你点开即可查看。

### 工具参数

| 参数 | 说明 |
|---|---|
| `type` | line / area / bar / stacked / stackedBar / radar |
| `title` | 图表标题 |
| `labels` | 横轴标签数组，如 `["2020","2021","2022"]` |
| `series` | `[{name, values}]` 数据系列 |
| `theme` | 可选：midnight-gold(默认黑金) / tradingview-dark / paper / emerald / graphite |

### 自定义部署地址

如果你的 AFG 部署在别处，用环境变量覆盖：

```bash
AFG_BASE_URL=https://你的域名/ node server.js
```
