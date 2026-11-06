# AFG MCP Server · 让 AI 帮你画图

让大模型（Claude / Cursor / Kimi / WorkBuddy / DeepSeek Harness 等）直接调用 `make_chart` 工具，生成 **AFG 高级金融图表链接**。

> 你只需要用日常语言说需求，AI 会自动整理数据并调用 AFG 出图，返回一个链接，点开就能看、能导出、能分享。

---

## 🚀 小白快速上手（3 步）

### 第 1 步：安装一次（只需做一次）

```bash
cd mcp-server
npm install
```

### 第 2 步：在你的 AI 客户端里添加 MCP

把下面这段 JSON 加到客户端的 MCP 配置里（把 `<项目路径>` 换成你电脑上的真实路径）：

```json
{
  "mcpServers": {
    "afg-charts": {
      "command": "node",
      "args": ["<项目路径>/mcp-server/server.js"]
    }
  }
}
```

### 第 3 步：直接对 AI 说话

配置好后，不用记任何语法，直接说：

- 「用近 5 年沪深300和中证500做一张对比折线图」
- 「画一张全球主要经济体近 6 年 GDP 增速的热力图」
- 「把这几个月的中美 CPI 画成面积图，用黑金主题」

AI 会自动调用 `make_chart`，返回一个链接，点开即可查看。

---

## 各客户端配置位置

| 客户端 | 怎么加 |
|---|---|
| **Cursor** | Settings → MCP → Add new MCP server；或写 `.cursor/mcp.json` |
| **Claude Code** | 项目根目录建 `.mcp.json`，或运行 `claude mcp add afg-charts -- node /绝对路径/mcp-server/server.js` |
| **Kimi Code / WorkBuddy** | 在 MCP 设置里添加，格式同上 |
| **DeepSeek Harness** | 在 MCP 配置里加入上述 JSON |

> 绝对路径示例：`/Users/你的用户名/.../financial-charts/mcp-server/server.js`

---

## 没有 MCP 支持？也能用

如果你的 AI 客户端不支持 MCP，可以：

1. **让 AI 直接生成图表链接**：给 AI 数据并说「生成 AFG 图表链接」，它会按下方格式拼出 `?chart=<base64>` 链接。
2. **上传到 AFG 网页**：打开 AFG → 上传数据 → 自动出图（完全在浏览器本地，数据不上传）。

---

## 工具参数（给 AI 读的）

| 参数 | 说明 |
|---|---|
| `type` | line / area / bar / stacked / stackedBar / radar |
| `title` | 图表标题 |
| `labels` | 横轴标签数组，如 `["2020","2021","2022"]` |
| `series` | `[{name, values}]` 数据系列（每条的 values 与 labels 等长） |
| `theme` | 可选：midnight-gold(默认黑金) / tradingview-dark / paper / emerald / graphite |

### 输出链接的格式

```
https://saviorbill.github.io/afg/?chart=<base64url(JSON)>
```

其中 JSON 形如：

```json
{
  "type": "area",
  "title": "全球 GDP 增速",
  "labels": ["2020", "2021", "2022"],
  "series": [
    { "name": "中国", "values": [2.2, 8.4, 3.0] },
    { "name": "美国", "values": [-2.2, 5.7, 2.1] }
  ]
}
```

---

## 自定义部署地址

如果你的 AFG 部署在别处，用环境变量覆盖：

```bash
AFG_BASE_URL=https://你的域名/ node server.js
```
