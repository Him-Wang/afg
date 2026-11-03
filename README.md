# AFG · Advanced-Financial-Graph

高级金融图表工具（Bloomberg / TradingView 风格），**纯前端、离线可用**，数据仅在本地浏览器处理、不上传。

## 核心能力

- **智能制图**：上传 Excel（多工作表）/ CSV / JSON / 图片描点，自动识别时间列、数值列、OHLC、行列方向，并推荐图表类型
- **图表类型**：折线 / 面积 / 柱状 / 堆叠 / 雷达 / K线 / 热力矩阵 / 瀑布 / 环形 / 散点矩阵 / 世界地图 等 20+ 种
- **宏观工具**：变频（月→季/季→年）、同比 / 环比 / 年内累计、指标运算（下拉选 A 指标 ±×÷ B 指标）
- **机器学习**：线性回归+置信带、时间序列预测扇面、K-Means 聚类、相关性矩阵、收益分布 KDE
- **业绩评估**：年化收益 / 年化波动 / 最大回撤 / 夏普比率 / VaR，随缩放区间更新
- **交互**：时间轴缩放、悬停高亮、图上标注/说明、数据标注（全部/单点）、事件标注、5 套配色、水印开关
- **分析板块**：各指标最新值 · 环比 · 同比，PMI 分项按「需求/生产/采购库存/就业/供应商」分组

## 本地使用

双击 `index.html` 即可，无需安装、无需联网（三个图表库已本地化）。

## 部署到 GitHub Pages（免费）

1. 在 GitHub 新建仓库（如 `afg`），不要勾选 README。
2. 把本文件夹的内容推到仓库根目录（`index.html` 需在根目录）：

```bash
cd financial-charts
git init
git add .
git commit -m "init"
git branch -M main
git remote add origin https://github.com/<你的用户名>/afg.git
git push -u origin main
```

3. 打开仓库 → Settings → Pages → Source 选 `Deploy from a branch` → 分支选 `main`、目录选 `/ (root)` → Save。
4. 几分钟后访问 `https://<你的用户名>.github.io/afg/` 即可。

> 也可用 Vercel / Netlify：直接拖拽本文件夹上传即可，无需 git。

## 大模型接入做图（方案 C）

部署上线后，让大模型输出**图表配置 JSON**，粘贴到「导入数据 → 粘贴数据」即可出图；也可做成 URL 参数直接打开。

```json
{
  "type": "area",
  "title": "中国 GDP 同比增速",
  "labels": ["2019", "2020", "2021", "2022", "2023"],
  "series": [{ "name": "GDP增速", "values": [6.0, 2.2, 8.4, 3.0, 5.2] }]
}
```

给大模型的提示词示例：

> 请把下面的分析结论整理成 JSON 图表数据，格式：`{"type":"area","title":"...","labels":["..."],"series":[{"name":"...","values":[...]}]}`，type 可选 line/area/bar/radar。

## 目录结构

```
index.html         入口
css/style.css      设计系统
js/                业务模块（themes/data-loader/ml/chart-factory/price-chart/app）
vendor/            本地化依赖库（ECharts / Lightweight Charts / SheetJS / 世界地图）
fonts/             本地 Inter 字体
```
