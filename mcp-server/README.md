# AFG MCP Server · 完整配置教程

让 AI（Cursor / Claude Code / Claude Desktop / Kimi / WorkBuddy / DeepSeek Harness 等）直接调用 `make_chart` 工具，生成 **AFG 高级金融图表链接**。

> **不想装东西？** 直接用「零安装」方式：把下面这段发给任意 AI，它自己就能拼出图表链接。
>
> ```
> 请用 AFG 帮我做图，直接输出可点击的图表链接。
> 链接格式：https://saviorbill.github.io/afg/?chart=<把 JSON 做 base64url 编码>
> JSON 示例：{"type":"area","title":"标题","theme":"paper","labels":["2021","2022"],
> "series":[{"name":"沪深300","values":[1,2]}]}
> type 可选：line/area/bar/stacked/stackedBar/radar/scatterMatrix/heatmap/donut/treemap
> theme 可选：paper/midnight-gold/tradingview-dark/emerald/graphite
> ```
>
> 下面是「配置 MCP」的完整流程（配一次，以后直接说「用 AFG 画图」）。

---

## 第 1 步 · 确认电脑有 Node.js

打开终端（Mac：启动台搜「终端」；Windows：开始菜单搜 PowerShell），输入：

```bash
node -v
```

- 显示类似 `v20.11.0` → 已装好，继续。
- 提示 `command not found` / `不是内部或外部命令` → 去 [nodejs.org](https://nodejs.org/) 下载 **LTS 版**安装，装完**重新开一个终端窗口**。

---

## 第 2 步 · 下载项目并安装依赖

**有 git：**

```bash
git clone https://github.com/saviorbill/afg.git
cd afg/mcp-server
npm install
```

**没有 git：**

1. 浏览器打开 https://github.com/saviorbill/afg
2. 点绿色 **Code** → **Download ZIP**
3. 解压，终端进入解压后的 `afg/mcp-server` 文件夹
4. 执行 `npm install`

看到 `added N packages` 就成功了。

---

## 第 3 步 · 拿到 server.js 的完整路径

仍然在 `mcp-server` 文件夹里，执行：

```bash
pwd
```

把输出路径后面接上 `/server.js`。例如输出是 `/Users/xiaoming/afg/mcp-server`，完整路径就是：

```
/Users/xiaoming/afg/mcp-server/server.js
```

Windows 路径长这样（反斜杠）：

```
C:\Users\xiaoming\afg\mcp-server\server.js
```

> 小技巧：可以把 `server.js` 文件从访达/资源管理器**拖进终端**，它会自动补出完整路径。

---

## 第 4 步 · 把配置写进 AI 客户端

### 通用配置（几乎所有客户端都适用）

```json
{
  "mcpServers": {
    "afg-charts": {
      "command": "node",
      "args": ["/Users/xiaoming/afg/mcp-server/server.js"]
    }
  }
}
```

### 各客户端具体位置

| 客户端 | 怎么配 |
|---|---|
| **Cursor** | 设置 → **Features** → **MCP** → **+ Add new MCP server**：Name 填 `afg-charts`，Type 选 `command`，Command 填 `node /完整路径/mcp-server/server.js`。<br>或在项目根目录新建 `.cursor/mcp.json`，粘贴上面 JSON。 |
| **Claude Code** | 终端执行一行：<br>`claude mcp add afg-charts -- node /完整路径/mcp-server/server.js` |
| **Claude Desktop** | 编辑后**完全退出**（Cmd+Q）再打开：<br>Mac：`~/Library/Application Support/Claude/claude_desktop_config.json`<br>Windows：`%APPDATA%\Claude\claude_desktop_config.json` |
| **Kimi / WorkBuddy** | 设置里的 **MCP**（或「工具」）页面 → 添加服务器 → 类型 `stdio` → 命令 `node` → 参数填 `/完整路径/mcp-server/server.js` |
| **DeepSeek Harness** | MCP 配置里加入上面的 JSON |

> 找不到入口？直接在客户端里问 AI：「怎么在你这配置 MCP 服务器？」它会告诉你具体位置。

---

## 第 5 步 · 重启并验证

**完全退出**客户端再打开（不是关窗口，要退出程序；Mac 用 Cmd+Q）。然后问 AI：

```
你现在有哪些工具？有没有 make_chart？
```

如果它列出 `make_chart`，就配置成功了。之后直接用自然语言：

```
用 AFG 画一张近 5 年沪深300和中证500的对比折线图，用象牙白主题
```

AI 会返回 `https://saviorbill.github.io/afg/?chart=...` 链接，点开就是图。

---

## 配置不成功？逐条排查

| 现象 | 原因 / 解决 |
|---|---|
| `node: command not found` | Node.js 没装好或没进 PATH。重装 Node.js，**重启终端**。Windows 试 `where node`。 |
| 路径里有空格 | JSON 里直接写不用转义；终端命令里要加引号：`"node" "/My Folder/afg/mcp-server/server.js"` |
| 客户端列表里没有 afg-charts | JSON 格式错（逗号/引号）。贴到 [jsonlint.com](https://jsonlint.com/) 校验。 |
| 想确认服务器本身能跑 | 终端执行 `node /完整路径/mcp-server/server.js`，光标停住不返回、无报错 = 正常（stdio 服务）。 |
| 改了配置还是不行 | **完全退出**客户端再启动（Mac：活动监视器确认进程已结束）。 |

---

## 工具参数（给 AI 读的）

| 参数 | 说明 |
|---|---|
| `type` | `line` / `area` / `bar` / `stacked` / `stackedBar` / `radar` |
| `title` | 图表标题 |
| `labels` | 横轴标签数组，如 `["2020","2021","2022"]` |
| `series` | `[{name, values}]`，每条 values 与 labels 等长 |
| `theme` | `midnight-gold`(默认) / `tradingview-dark` / `paper` / `emerald` / `graphite` |

### 输出链接格式

```
https://saviorbill.github.io/afg/?chart=<base64url(JSON)>
```

JSON 示例：

```json
{
  "type": "scatterMatrix",
  "title": "资产相关系数矩阵",
  "theme": "paper",
  "series": [
    { "name": "沪深300", "values": [1,2,3,4,5,6,7,8,9,10] },
    { "name": "中证500", "values": [1.2,2.1,3.3,4.1,5.2,6.1,7.3,8.1,9.2,10.1] },
    { "name": "黄金",     "values": [2,1,4,3,6,5,8,7,10,9] }
  ]
}
```

---

## 自定义部署地址

如果 AFG 部署在别处，用环境变量覆盖：

```bash
AFG_BASE_URL=https://你的域名/ node server.js
```
