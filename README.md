<div align="center">

# ADV · Advanced Financial Graph

**上传数据，直接出图 —— 专业级金融图表，纯前端运行**

[🌐 在线使用](https://saviorbill.github.io/adv/) · [中文](#中文) · [English](#english)

</div>

---

## 中文

### 这是什么

ADV 是一个**纯静态的金融图表工具**：上传 Excel / CSV / JSON，自动识别数据结构并推荐图表，无需登录、无需服务器，**数据全程在本地浏览器处理、不上传**。

适合：研究报告配图、路演材料、财报分析、宏观数据可视化。

**在线地址**：https://saviorbill.github.io/adv/

---

### 三种用法

#### ① 最简：直接上传（推荐小白）

1. 打开 https://saviorbill.github.io/adv/
2. 点击「**＋ 上传数据出图**」
3. 选择 Excel / CSV / JSON 文件 → 图表自动生成

支持多工作表 Excel、多列时间序列、截面数据，自动识别日期列与数值列。

#### ② 零安装：让 AI 帮你画

复制首页「📋 复制这段话给 AI（自动配置）」的提示词，粘给 **WorkBuddy / Kimi / Cursor / Claude**，然后直接说：

> 帮我画一张近 5 年沪深300和中证500的对比折线图，象牙白主题

AI 会返回一个 `?chart=` 链接，点开即图，可导出、可分享。**不需要安装任何东西。**

#### ③ 配置 MCP（一次配置，长期省事）

如果你常用 Cursor / Claude Code 等支持 MCP 的客户端，配置一次后可以直接说「用 ADV 画图」。

```bash
cd mcp-server && npm install
```

在客户端 MCP 配置中加入：

```json
{
  "mcpServers": {
    "afg-charts": {
      "command": "node",
      "args": ["/完整路径/adv/mcp-server/server.js"]
    }
  }
}
```

详见 [mcp-server/README.md](mcp-server/README.md)（含 5 步完整教程 + 排错）。

---

### 内置数据（全部真实、持续更新）

| 板块 | 内容 | 指标数 | 数据来源 |
|---|---|---|---|
| **中国宏观** | GDP、PMI、CPI、PPI、社融、M1/M2、LPR、SHIBOR 等 | 24 | 国家统计局 / 央行 / akshare |
| **国际宏观** | 8 国政策利率、CPI、GDP、PPI、PMI、就业、货币供应 | 37 | FRED / BIS / Eurostat / akshare |
| **金融数据** | A股指数、全球股指、国债收益率、商品、汇率、VIX | 31 | 交易所 / Wind 整理 |
| **公司财务** | 阳光电源、苹果（产品营收拆解）等 | 6 套 | 公司财报 |
| **行业数据** | 31 个申万一级行业涨跌幅、市值、成交额 | 5 套 | akshare |

当前数据更新至 **2026-11-06**。

---

### 图表能力

**27 个内置模板** + 可自由切换的图表类型：

- 折线 / 面积 / 柱状 / 堆叠面积 / 堆叠柱状 / 阶梯线
- 双轴组合（柱+线）
- 热力矩阵 / 相关系数矩阵 / 散点矩阵
- 雷达图 / 气泡图 / 矩形树图 / 横向排名
- 桑基图 / 环形图 / 瀑布图
- 世界地图 / 季节性折线 / 业绩评估 / 指标卡

**交互功能**：

| 功能 | 说明 |
|---|---|
| 🔍 时间区间 | 全部 / 近 1 年 / 近 5 年 / 近 10 年 |
| ➕ 叠加指标 | 最多叠加 6 个指标对比，自动双轴 |
| ◈ 事件标注 | 中国宏观图自动标注 10 个重大历史事件（区间色带 ①-⑩） |
| 📍 极值标注 | 自动标注最高/最低/最新值，智能避让不重叠 |
| 🖱 悬停聚焦 | 悬停某条线，其余变暗（含数据标签） |
| 🎨 单条配色 | 每个系列单独设置颜色 |
| ⇩ 导出图片 | 2 倍分辨率 PNG，含标题/单位/事件说明 |
| 🔗 复制链接 | 生成可分享的图表链接 |

### 视觉主题

默认 **象牙白 Paper**（适合文档、打印），另有 4 套：

`黑金 Midnight Gold` · `交易员暗色 TradingView` · `墨绿 Emerald` · `石墨 Graphite`

### 双语支持

点击右上角语言按钮切换 **中文 / English**，界面文案、导航、按钮全部翻译，支持 `?lang=en` 参数。

### 问题反馈

首页右侧「🐞 帮它变得更好」——遇到 bug、想要新功能、觉得哪里难用，都可以直接提交（自动生成 GitHub Issue）。

---

### 本地运行

```bash
git clone https://github.com/saviorbill/adv.git
cd adv
# 任选一种方式启动静态服务
python3 -m http.server 8000
# 或 npx serve .
```

浏览器打开 http://localhost:8000

### 更新数据

```bash
python3 update_data.py --macro      # 中国宏观
python3 update_data.py --intl       # 国际宏观
python3 update_data.py --finance    # 金融数据
python3 update_fred_us.py           # 美国就业（FRED）
python3 update_cn_corridor.py       # 中国利率走廊
```

### 技术栈

纯前端，无后端：HTML + CSS + 原生 JS · [Apache ECharts 5](https://echarts.apache.org/) · [SheetJS](https://sheetjs.com/) · 数据以 JS 文件形式内嵌

---

## English

### What is ADV

ADV is a **fully static financial charting tool**. Upload Excel / CSV / JSON, and it automatically detects the data structure and suggests a chart. No login, no server — **everything runs in your browser, your data never leaves your machine.**

Built for research reports, pitch decks, earnings analysis, and macro data visualization.

**Live demo**: https://saviorbill.github.io/adv/

---

### Three ways to use it

#### ① Simplest: just upload (recommended)

1. Open https://saviorbill.github.io/adv/
2. Click **"＋ Upload data"**
3. Pick your Excel / CSV / JSON → chart appears

Supports multi-sheet Excel, multi-column time series and cross-sectional data; date and value columns are detected automatically.

#### ② Zero install: let an AI draw it

Copy the prompt from the homepage ("📋 Copy setup prompt"), paste it into **WorkBuddy / Kimi / Cursor / Claude**, then say:

> Chart CSI300 vs CSI500 over the last 5 years, paper theme

The AI returns a `?chart=` link. Open it, export it, share it. **Nothing to install.**

#### ③ Configure MCP (one-time setup)

For Cursor / Claude Code and other MCP-capable clients, configure once and just say "chart it with ADV".

```bash
cd mcp-server && npm install
```

Add to your MCP config:

```json
{
  "mcpServers": {
    "afg-charts": {
      "command": "node",
      "args": ["/absolute/path/to/adv/mcp-server/server.js"]
    }
  }
}
```

See [mcp-server/README.md](mcp-server/README.md) for the full 5-step guide and troubleshooting.

---

### Built-in datasets (real, continuously updated)

| Section | Contents | Series | Sources |
|---|---|---|---|
| **China Macro** | GDP, PMI, CPI, PPI, credit, M1/M2, LPR, SHIBOR | 24 | NBS / PBoC / akshare |
| **Global Macro** | Policy rates (8 economies), CPI, GDP, PPI, PMI, employment | 37 | FRED / BIS / Eurostat / akshare |
| **Markets** | A-share indices, global indices, sovereign yields, commodities, FX, VIX | 31 | Exchanges / Wind |
| **Company** | Sungrow, Apple product revenue breakdown | 6 sets | Company filings |
| **Sectors** | 31 SW level-1 industry returns, market cap, turnover | 5 sets | akshare |

Data currently updated through **2026-11-06**.

---

### Chart capabilities

**27 built-in templates** plus free chart-type switching:

- Line / Area / Bar / Stacked area / Stacked bar / Step
- Dual axis (bar + line)
- Heatmap / Correlation matrix / Scatter matrix
- Radar / Bubble / Treemap / Horizontal rank
- Sankey / Donut / Waterfall
- World map / Seasonal / Performance / KPI cards

**Interactions**:

| Feature | Description |
|---|---|
| 🔍 Time range | All / 1Y / 5Y / 10Y |
| ➕ Overlay series | Up to 6 indicators, auto dual-axis |
| ◈ Event bands | 10 key China macro events marked as ranges (①–⑩) |
| 📍 Extreme labels | Max / min / latest, auto-arranged without overlap |
| 🖱 Hover focus | Hover a line to dim the rest (including data labels) |
| 🎨 Per-series color | Set a color for each series |
| ⇩ Export PNG | 2× resolution with title, unit and event legend |
| 🔗 Share link | Generates a reproducible chart URL |

### Themes

Default **Paper (ivory)** for documents and print, plus four dark themes:

`Midnight Gold` · `TradingView Dark` · `Emerald` · `Graphite`

### Bilingual UI

Toggle **中文 / English** from the header — navigation, buttons and labels are all translated. URL parameter `?lang=en` is also supported.

### Feedback

Use "🐞 Help make it better" on the homepage — report bugs, request features, or flag anything confusing. It opens a pre-filled GitHub issue.

---

### Run locally

```bash
git clone https://github.com/saviorbill/adv.git
cd adv
python3 -m http.server 8000     # or: npx serve .
```

Open http://localhost:8000

### Updating data

```bash
python3 update_data.py --macro      # China macro
python3 update_data.py --intl       # Global macro
python3 update_data.py --finance    # Markets
python3 update_fred_us.py           # US employment (FRED)
python3 update_cn_corridor.py       # China rate corridor
```

### Tech stack

Pure frontend, no backend: HTML + CSS + vanilla JS · [Apache ECharts 5](https://echarts.apache.org/) · [SheetJS](https://sheetjs.com/) · data embedded as JS files

---

<div align="center">

Made for people who need charts, not chart software.

</div>
