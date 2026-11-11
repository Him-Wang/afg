/* ADV 图表分类目录：9 大用途分类 + 图表定义 + 演示数据生成器 */
(function (global) {
  'use strict';

  /* 确定性伪随机（保证每次进入案例一致） */
  function seedRand(seed) {
    var s = (seed * 2654435761 + 12345) % 2147483647;   // 先做一次哈希打散
    if (s <= 0) s += 2147483646;
    for (var w = 0; w < 3; w++) s = s * 16807 % 2147483647;   // 预热
    return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  }
  function rnd(seed, min, max) { return min + seedRand(seed)() * (max - min); }
  function rndArr(seed, n, min, max) {
    var out = [], r = seedRand(seed);
    for (var i = 0; i < n; i++) out.push(Math.round((min + r() * (max - min)) * 100) / 100);
    return out;
  }
  function months(n) {
    var out = [], d = new Date(2020, 0, 1);
    for (var i = 0; i < n; i++) { out.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')); d.setMonth(d.getMonth() + 1); }
    return out;
  }


  /* 演示数据的中英对照（英文模式下整体替换） */
  var DEMO_EN = {
    '华东':'East China','华南':'South China','华北':'North China','西南':'Southwest','东北':'Northeast',
    '研发':'R&D','销售':'Sales','管理':'Admin','生产':'Production','客服':'Support',
    '客户留存':'Retention','毛利完成率':'Gross margin','营收完成率':'Revenue',
    '消费':'Consumer','科技':'Tech','医药':'Healthcare','金融':'Financials','制造':'Industrials','能源':'Energy',
    'A 公司':'Company A','B 公司':'Company B','公司 A':'Company A','公司 B':'Company B',
    '公司 C':'Company C','公司 D':'Company D',
    '指标 A':'Series A','指标 B':'Series B','业务 A':'Business A','业务 B':'Business B','业务 C':'Business C',
    '产品 A':'Product A','产品 B':'Product B','产品 C':'Product C','产品 D':'Product D',
    '客单价 <50':'AOV <50','50–100':'50–100','100–300':'100–300','>300':'>300',
    '新客':'New','老客':'Returning','会员':'Members','家电':'Appliances','食品':'Food','服饰':'Apparel',
    '半导体':'Semiconductors','软件':'Software','硬件':'Hardware','创新药':'Innovative drugs','器械':'Devices',
    '境内':'Domestic','境外':'Overseas','北美':'N. America','欧洲':'Europe','亚太':'APAC',
    '期初':'Opening','新增':'Additions','流失':'Churn','提价':'Price hike','成本':'Cost','期末':'Closing',
    '广告投入':'Ad spend','销售额':'Sales','增速':'Growth','利润率':'Margin','出口':'Exports','投资':'Investment',
    '功能 A':'Feature A','功能 B':'Feature B','功能 C':'Feature C',
    '采购':'Procurement','生产':'Production','仓储':'Warehouse','物流':'Logistics','门店':'Store','客户':'Customer',
    '总流量':'Total traffic','自然搜索':'Organic','付费广告':'Paid ads','社交':'Social','成交':'Converted',
    '曝光':'Impressions','点击':'Clicks','加购':'Add to cart','下单':'Orders','支付':'Payment',
    '提交申请':'Submit','材料审核':'Review','是否齐全':'Complete?','补充材料':'Resubmit','通过':'Approve',
    '提交需求':'Request','需求确认':'Confirm','资信评估':'Credit check','授信审批':'Approval','签约放款':'Disburse',
    '客户':'Customer','风控':'Risk','财务':'Finance','集团':'Group',
    '消费事业群':'Consumer BU','科技事业群':'Tech BU','医药事业群':'Healthcare BU',
    '研发部':'R&D','平台部':'Platform','财务部':'Finance Dept','审计部':'Audit','运营部':'Operations','供应链':'Supply chain',
    '本月营收':'Revenue MTD','回款率':'Collection rate','毛利率':'Gross margin','现金流':'Cash flow','负债率':'Leverage','估值':'Valuation',
    '盈利':'Profitability','成长':'Growth','运营':'Operation','偿债':'Solvency',
    '主题 A':'Topic A','主题 B':'Topic B','主题 C':'Topic C','主题 D':'Topic D',
    '公司':'Company','算出':'','半导体':'Semiconductors','算力':'Compute','出海':'Going global','降本':'Cost cutting',
    '库存':'Inventory','分红':'Dividends','并购':'M&A','汇率':'FX','产能':'Capacity','新能源':'New energy',
    'A 组':'Group A','B 组':'Group B','C 组':'Group C','D 组':'Group D',
    '其他':'Other','直销':'Direct','经销':'Dealer','电商':'E-commerce','渠道结构':'Channel mix',
    '2024':'2024','2025':'2025'
  };

  var CATS = [];
  CATS.push({
    id: 'compare', name: '比较与排序', icon: '⇄',
    desc: '谁高谁低、谁多谁少、排名先后、个体之间或个体与基准之间的差异。',
    charts: [
      { id: 'groupedBar', name: '多期对比条形图', type: 'groupedBar', unit: '增速 %', desc: '8 个行业 5 年增速对比，含行业基准线',
        data: function () {
          var cats = ['消费', '科技', '医药', '金融', '制造', '能源', '地产', '材料'];
          var years = ['2021', '2022', '2023', '2024', '2025'];
          var base = [14, 22, 18, 6, 11, 9, -4, 16];
          var series = years.map(function (y, yi) {
            return { name: y, values: cats.map(function (_, ci) {
              return Math.round((base[ci] + (rnd(ci * 17 + yi * 31 + 7, -9, 9)) - yi * 1.6) * 10) / 10;
            }) };
          });
          return { labels: cats, series: series, unit: '' };
        } },
      { id: 'dumbbell', name: '哑铃图', type: 'dumbbell', desc: '2021→2025 五年变化：谁在拉开差距、谁在追赶',
        data: function () {
          var names = ['新能源', '半导体', '高端制造', '医药', '消费', '金融', '地产', '传统能源'];
          var from = [28, 35, 42, 48, 55, 38, 62, 44];
          var to = [76, 68, 64, 58, 51, 41, 33, 39];
          return { rows: names.map(function (n, i) { return { name: n, from: from[i], to: to[i] }; }),
            fromLabel: '2021', toLabel: '2025', pct: false };
        } },
      { id: 'pmiRadar', name: '制造业 PMI 雷达 · 13 项', type: 'radar', desc: '13 项景气指标近 3 个月对比，点出波动最大的指标',
        data: function () {
          var names = ['制造业 PMI', '服务业 PMI', '工业增加值', '固定资产投资', '社会消费品零售',
            '出口', '进口', 'PPI', 'CPI', 'M1', 'M2', '新增贷款', '贷款余额'];
          var aug = [49.1, 50.2, 52.0, 41.5, 51.8, 56.2, 52.4, 43.0, 50.8, 53.2, 55.6, 54.1, 54.8];
          var sep = [49.8, 50.0, 53.0, 39.8, 52.6, 51.4, 54.8, 41.6, 51.2, 55.0, 56.4, 52.8, 54.6];
          var oct = [48.4, 50.4, 54.2, 38.0, 53.4, 58.6, 50.2, 42.2, 51.0, 57.8, 57.0, 56.2, 54.4];
          return {
            indicators: names.map(function (x) { return { name: x }; }),
            series: [
              { name: '2026-08', values: aug },
              { name: '2026-09', values: sep },
              { name: '2026-10', values: oct }
            ]
          };
        } }
    ]
  });

  CATS.push({
    id: 'trend', name: '趋势与时间', icon: '↗',
    desc: '数据随时间怎么变、变化的节奏、拐点、周期、累计过程。',
    charts: [
      { id: 'season', name: '季节性折线', type: 'season', desc: '近 4 年同月对比：看季节性规律与同比变化',
        data: function () {
          var labels = months(60);
          var out = [], base = 120;
          for (var i = 0; i < 60; i++) {
            var mth = (i % 12) + 1;
            var season = [0.78, 0.72, 1.06, 1.02, 1.0, 1.08, 1.04, 0.98, 1.12, 1.18, 1.24, 1.32][mth - 1];
            base += 0.9;
            out.push(Math.round((base * season + rnd(i + 3, -5, 5)) * 10) / 10);
          }
          return { labels: labels, series: [{ name: '月度营收', values: out }], maxYears: 4 };
        } },
      { id: 'stacked', name: '结构演变', type: 'stacked', desc: '5 年营收结构：四条业务线的此消彼长',
        data: function () {
          var labels = months(60);
          var parts = [
            { name: '硬件', base: 120, grow: 0.6 },
            { name: '软件', base: 60, grow: 1.8 },
            { name: '服务', base: 35, grow: 2.6 },
            { name: '其他', base: 25, grow: 0.2 }
          ];
          return { labels: labels, series: parts.map(function (pt, pi) {
            return { name: pt.name, values: labels.map(function (_, i) {
              return Math.round((pt.base + pt.grow * i + rnd(pi * 77 + i, -6, 6)) * 10) / 10;
            }) };
          }) };
        } },
      { id: 'waterfall', name: '归因瀑布', type: 'waterfall', desc: '从收入到净利：每一笔增减的贡献拆解',
        data: function () { return {
          labels: ['营业收入', '营业成本', '销售费用', '管理费用', '研发费用', '其他', '净利润'],
          values: [1200, -760, -110, -75, -140, -15, 100],
          bridge: true }; } },
      { id: 'dual', name: '双轴趋势', type: 'line', desc: '指数点位（左）对比利率水平（右），看背离与联动',
        data: function () {
          var labels = months(60);
          var index = [], rate = [];
          var iv = 3600, rv = 3.2;
          for (var i = 0; i < 60; i++) {
            iv += Math.sin(i / 6) * 60 + rnd(i + 7, -40, 40) + 6;
            rv += Math.cos(i / 9) * 0.05 + rnd(i + 91, -0.04, 0.04) - 0.012;
            index.push(Math.round(iv));
            rate.push(Math.round(rv * 100) / 100);
          }
          return { labels: labels, series: [
            { name: '沪深300', values: index, yAxis: 0 },
            { name: '10年国债收益率', values: rate, yAxis: 1 }
          ], dual: true };
        } }
    ]
  });

  CATS.push({
    id: 'composition', name: '构成与占比', icon: '◕',
    desc: '整体由哪些部分组成、各部分占多少、层级构成如何。',
    charts: [
      { id: 'pie', name: '饼图', type: 'pie', desc: '最少分块的占比展示，适合 3–5 类',
        data: function () { return { data: [
          { name: '产品 A', value: 42 }, { name: '产品 B', value: 27 }, { name: '产品 C', value: 18 }, { name: '其他', value: 13 }] }; } },
      { id: 'donut', name: '环形图', type: 'donut', desc: '中心可放总量或关键指标，比饼图信息密度更高',
        data: function () { return { data: [
          { name: '直销', value: 48 }, { name: '经销', value: 32 }, { name: '电商', value: 20 }], unit: '%', centerLabel: '渠道结构' }; } },

      { id: 'percentBar', name: '百分比堆叠条形图', type: 'percentBar', desc: '只比结构不比总量，跨组比较最公平',
        data: function () { return { labels: ['客单价 <50', '50–100', '100–300', '>300'], series: [
          { name: '新客', values: [1240, 890, 520, 210] }, { name: '老客', values: [680, 970, 1150, 1080] },
          { name: '会员', values: [210, 250, 410, 480] }] }; } },
      { id: 'treemap', name: '矩形树图', type: 'treemap', desc: '板块面积即规模：二级结构 + 占比一眼可读',
        data: function () { return {
          data: [
            { name: '境内', children: [{ name: '华东', value: 32 }, { name: '华南', value: 25 }, { name: '华北', value: 15 }] },
            { name: '境外', children: [{ name: '北美', value: 14 }, { name: '欧洲', value: 9 }, { name: '亚太', value: 5 }] }
          ] }; } }
    ]
  });

  CATS.push({
    id: 'distribution', name: '分布与离散', icon: '▤',
    desc: '数据怎么分布、集中在哪、尾部和离群点有多长、组间差异多大。',
    charts: [
      { id: 'histogram', name: '直方图', type: 'histogram', desc: '看数据分布形状、集中区间与长尾',
        data: function () { return { values: rndArr(41, 160, 20, 100) }; } },
      { id: 'boxplot', name: '分布条带图', type: 'boxplot', desc: 'P10–P90 全距 + IQR 实心 + 中位刻度，组间差异一眼可比',
        data: function () { return { categories: ['A 组 · 一线', 'B 组 · 新一线', 'C 组 · 二线', 'D 组 · 三线'], boxes: [
          [22, 48, 61, 74, 95], [30, 55, 68, 80, 99], [15, 38, 52, 63, 88], [40, 62, 75, 88, 105]] }; } },
      { id: 'ridge', name: '山脊图', type: 'ridge', desc: '多组密度曲线错位堆叠，看分布形态与位移',
        data: function () { return { labels: ['2022', '2023', '2024', '2025', '2026'], groups: [
          rndArr(61, 80, 22, 66), rndArr(62, 80, 26, 72), rndArr(63, 80, 30, 78), rndArr(64, 80, 34, 84), rndArr(65, 80, 38, 92)] }; } },

      { id: 'matrixHeat', name: '二维热力图', type: 'matrixHeat', desc: '两个维度交叉的热力矩阵，找聚集区',
        data: function () { var names = ['0–20', '20–40', '40–60', '60–80', '80–100'];
          return { names: names, matrix: names.map(function (_, i) { return names.map(function (_, j) { return Math.round((rnd(i * 10 + j + 1, 20, 95) / 100) * 100) / 100; }); }) }; } },
      { id: 'ecdf', name: 'Q-Q 图 / ECDF', type: 'ecdf', desc: '经验分布与理论分位对照，检验分布假设',
        data: function () { return { samples: rndArr(81, 120, 10, 95) }; } }
    ]
  });

  CATS.push({
    id: 'relation', name: '关系与相关', icon: '⌘',
    desc: '变量之间有没有关系、关系强弱与方向、资产之间的联动结构。',
    charts: [
      { id: 'scatter', name: '两资产散点 + 拟合线', type: 'scatter', desc: '沪深300 与 标普500 日收益率：线性拟合与 R²',
        data: function () {
          var pts = [];
          for (var i = 0; i < 90; i++) {
            var x = rnd(i * 13 + 5, -320, 320) / 100;            // 沪深300 日收益率 %
            var y = 0.62 * x + rnd(i * 29 + 7, -120, 120) / 100; // 标普500，带噪声
            pts.push([Math.round(x * 100) / 100, Math.round(y * 100) / 100]);
          }
          return { xName: '沪深300 日收益率（%）', yName: '标普500 日收益率（%）', points: pts, seriesName: '交易日', fit: true };
        } },
      { id: 'corrMatrix', name: '相关性矩阵', type: 'corrMatrix', desc: '10 类金融资产日收益率相关性 · 红正蓝负',
        data: function () { return {
          names: ['沪深300', '标普500', '纳斯达克', '中债10Y', '美债10Y', 'COMEX黄金', 'WTI原油', '美元指数', 'LME铜', '日经225'],
          matrix: [
            [1, 0.32, 0.34, 0.28, -0.02, 0.19, 0.12, -0.21, 0.36, 0.31],
            [0.32, 1, 0.95, 0.05, 0.23, 0.11, 0.17, -0.18, 0.2, 0.2],
            [0.34, 0.95, 1, 0.04, 0.15, 0.11, 0.13, -0.17, 0.17, 0.18],
            [0.28, 0.05, 0.04, 1, 0.14, -0.02, 0.08, 0, 0.11, 0.09],
            [-0.02, 0.23, 0.15, 0.14, 1, -0.18, 0.18, 0.19, 0.13, 0.12],
            [0.19, 0.11, 0.11, -0.02, -0.18, 1, 0.04, -0.35, 0.17, 0.1],
            [0.12, 0.17, 0.13, 0.08, 0.18, 0.04, 1, 0.02, 0.13, 0.06],
            [-0.21, -0.18, -0.17, 0, 0.19, -0.35, 0.02, 1, -0.18, -0.06],
            [0.36, 0.2, 0.17, 0.11, 0.13, 0.17, 0.13, -0.18, 1, 0.3],
            [0.31, 0.2, 0.18, 0.09, 0.12, 0.1, 0.06, -0.06, 0.3, 1]
          ] }; } },
      { id: 'corrNetwork', name: '关联网络 + 矩阵', type: 'corrNetwork', desc: '左网络右矩阵：一眼看出谁与谁同涨同跌',
        data: function () { return {
          names: ['沪深300', '标普500', '纳斯达克', '中债10Y', '美债10Y', 'COMEX黄金', 'WTI原油', '美元指数', 'LME铜', '日经225'],
          matrix: [
            [1, 0.32, 0.34, 0.28, -0.02, 0.19, 0.12, -0.21, 0.36, 0.31],
            [0.32, 1, 0.95, 0.05, 0.23, 0.11, 0.17, -0.18, 0.2, 0.2],
            [0.34, 0.95, 1, 0.04, 0.15, 0.11, 0.13, -0.17, 0.17, 0.18],
            [0.28, 0.05, 0.04, 1, 0.14, -0.02, 0.08, 0, 0.11, 0.09],
            [-0.02, 0.23, 0.15, 0.14, 1, -0.18, 0.18, 0.19, 0.13, 0.12],
            [0.19, 0.11, 0.11, -0.02, -0.18, 1, 0.04, -0.35, 0.17, 0.1],
            [0.12, 0.17, 0.13, 0.08, 0.18, 0.04, 1, 0.02, 0.13, 0.06],
            [-0.21, -0.18, -0.17, 0, 0.19, -0.35, 0.02, 1, -0.18, -0.06],
            [0.36, 0.2, 0.17, 0.11, 0.13, 0.17, 0.13, -0.18, 1, 0.3],
            [0.31, 0.2, 0.18, 0.09, 0.12, 0.1, 0.06, -0.06, 0.3, 1]
          ] }; } }
    ]
  });

  CATS.push({
    id: 'flow', name: '流动与转化', icon: '⇢',
    desc: '数据/资源/用户从哪来到哪去、流量大小、环节转化与流失。',
    charts: [
      { id: 'funnel', name: '漏斗图', type: 'funnel', desc: '逐级转化与流失，定位瓶颈环节',
        data: function () { return { steps: [
          { name: '曝光', value: 480000 }, { name: '点击', value: 96500 }, { name: '加购', value: 31200 },
          { name: '下单', value: 12400 }, { name: '支付', value: 8600 }] }; } },
      { id: 'sankey', name: '桑基图', type: 'sankey', desc: '多级流向与分流比例，看资源如何在环节间流动',
        data: function () { return {
          nodes: [{ name: '新客' }, { name: '老客' },
                  { name: '自然搜索' }, { name: '付费广告' }, { name: '社交内容' },
                  { name: '成交' }, { name: '加购未付' }, { name: '流失' }],
          links: [
            { source: '新客', target: '自然搜索', value: 24 }, { source: '新客', target: '付费广告', value: 26 }, { source: '新客', target: '社交内容', value: 15 },
            { source: '老客', target: '自然搜索', value: 22 }, { source: '老客', target: '付费广告', value: 6 }, { source: '老客', target: '社交内容', value: 7 },
            { source: '自然搜索', target: '成交', value: 30 }, { source: '自然搜索', target: '加购未付', value: 9 }, { source: '自然搜索', target: '流失', value: 7 },
            { source: '付费广告', target: '成交', value: 17 }, { source: '付费广告', target: '加购未付', value: 8 }, { source: '付费广告', target: '流失', value: 7 },
            { source: '社交内容', target: '成交', value: 8 }, { source: '社交内容', target: '加购未付', value: 4 }, { source: '社交内容', target: '流失', value: 10 }
          ], total: 100 }; } },
      { id: 'chord', name: '和弦图', type: 'chord', desc: '两两之间的双向流量，看环形网络关系',
        data: function () { return { names: ['华东', '华南', '华北', '西南', '境外'],
          matrix: [[0, 32, 18, 9, 12], [28, 0, 14, 7, 16], [15, 11, 0, 5, 9], [8, 6, 4, 0, 3], [11, 14, 8, 2, 0]] }; } },
      { id: 'flowMap', name: '流向地图', type: 'flowMap', desc: '地理上的资源流动，带方向与强度',
        data: function () { return { hubs: [{ name: 'Shanghai', coord: [121.47, 31.23] }, { name: 'Singapore', coord: [103.82, 1.35] }, { name: 'Dubai', coord: [55.27, 25.20] }, { name: 'London', coord: [-0.13, 51.51] }],
          flows: [{ from: [121.47, 31.23], to: [103.82, 1.35], value: 82 }, { from: [121.47, 31.23], to: [55.27, 25.20], value: 64 },
            { from: [55.27, 25.20], to: [-0.13, 51.51], value: 41 }, { from: [103.82, 1.35], to: [-74.01, 40.71], value: 33 }] }; } }
    ]
  });

  CATS.push({
    id: 'geo', name: '地理空间', icon: '◍',
    desc: '在哪里、区域差异、空间密度、位置分布。',
    charts: [
      { id: 'choropleth', name: '分级统计图', type: 'choropleth', desc: '按行政区着色，看区域指标高低',
        data: function () { return { metric: '人均 GDP（万元）' }; } },

      { id: 'heatMapGeo', name: '热力地图', type: 'heatMapGeo', desc: '空间密度热力，找聚集热点',
        data: function () { return { metric: '门店密度' }; } },
      { id: 'trajectory', name: '轨迹图', type: 'trajectory', desc: '路径与轨迹，看移动规律与线路',
        data: function () { return { path: [[121.47, 31.23], [103.82, 1.35], [55.27, 25.20], [-0.13, 51.51], [-74.01, 40.71]] }; } },
      { id: 'migration', name: '迁徙图', type: 'migration', desc: '人口/资源迁移方向与规模',
        data: function () { return { flows: [
          { from: [121.47, 31.23], to: [-74.01, 40.71], value: 62 }, { from: [103.82, 1.35], to: [-0.13, 51.51], value: 48 },
          { from: [139.69, 35.69], to: [151.21, -33.87], value: 35 }, { from: [55.27, 25.20], to: [-46.63, -23.55], value: 29 }] }; } },
]
  });

  CATS.push({
    id: 'hierarchy', name: '层级与流程', icon: '⌗',
    desc: '组织/分类的层级结构，任务/审批/协作的先后与责任归属。',
    charts: [
      { id: 'tree', name: '树形图', type: 'tree', desc: '层级结构的展开，看分类归属',
        data: function () { return { tree: { name: '集团', children: [
          { name: '消费事业群', children: [{ name: '家电' }, { name: '食品' }, { name: '服饰' }] },
          { name: '科技事业群', children: [{ name: '半导体' }, { name: '软件' }, { name: '硬件' }] },
          { name: '医药事业群', children: [{ name: '创新药' }, { name: '器械' }] }] } }; } },
      { id: 'orgChart', name: '组织架构图', type: 'orgChart', desc: '上下级汇报关系，横向排布',
        data: function () { return { tree: { name: 'CEO', children: [
          { name: 'CTO', children: [{ name: '研发部' }, { name: '平台部' }] },
          { name: 'CFO', children: [{ name: '财务部' }, { name: '审计部' }] },
          { name: 'COO', children: [{ name: '运营部' }, { name: '供应链' }] }] } }; } },

      { id: 'archDiagram', name: '系统架构图', type: 'archDiagram', desc: '分区分组 + 正交连线 + 线上标注，改配色只换边框',
        data: function () { return {
          groups: [
            { label: '边缘接入', x: 20, y: 20, w: 280, h: 320 },
            { label: '核心服务', x: 330, y: 20, w: 830, h: 320 },
            { label: '数据层', x: 330, y: 370, w: 830, h: 180 }
          ],
          nodes: [
            { id: 'web', label: 'Web App', x: 160, y: 120, w: 220, h: 88 },
            { id: 'mob', label: 'Mobile App', x: 160, y: 250, w: 220, h: 88 },
            { id: 'gw', label: 'API Gateway', sub: '单点入口', accent: true, x: 560, y: 185, w: 265, h: 92 },
            { id: 'auth', label: 'Auth Service', sub: '令牌校验', x: 990, y: 110, w: 275, h: 88 },
            { id: 'orders', label: 'Orders Service', sub: '订单写入', x: 990, y: 265, w: 275, h: 92 },
            { id: 'pg', label: 'Postgres', sub: '订单库', x: 520, y: 470, w: 230, h: 88 },
            { id: 'obj', label: 'Object Store', sub: '归档', x: 800, y: 470, w: 230, h: 88 },
            { id: 'redis', label: 'Redis', sub: '会话', x: 1045, y: 470, w: 190, h: 88 }
          ],
          edges: [
            { from: 'web', to: 'gw', label: 'HTTPS', labelAt: [300, 112],
              pts: [[270, 120], [340, 120], [340, 165], [427, 165]] },
            { from: 'mob', to: 'gw', label: 'HTTPS', labelAt: [300, 242],
              pts: [[270, 250], [310, 250], [310, 205], [427, 205]] },
            { from: 'gw', to: 'auth', label: 'VERIFY', labelAt: [760, 152],
              pts: [[692, 160], [830, 160], [830, 110], [852, 110]] },
            { from: 'gw', to: 'orders', label: 'ROUTE', labelAt: [740, 202],
              pts: [[692, 210], [780, 210], [780, 265], [852, 265]] },
            { from: 'auth', to: 'redis', label: 'CACHE', labelAt: [1183, 300], dashed: true, muted: true,
              pts: [[1128, 110], [1183, 110], [1183, 470], [1144, 470]] },
            { from: 'orders', to: 'obj', label: 'ARCHIVE', labelAt: [920, 364], dashed: true, muted: true,
              pts: [[1030, 311], [1030, 372], [800, 372], [800, 426]] },
            { from: 'orders', to: 'pg', label: 'SQL', labelAt: [700, 332],
              pts: [[880, 311], [880, 340], [520, 340], [520, 426]] }
          ]
        }; } },
      { id: 'swimlane', name: '泳道图', type: 'swimlane', desc: '按责任方分泳道，看跨部门协作流程',
        data: function () { return { lanes: ['客户', '销售', '风控', '财务'],
          tasks: [
            { name: '提交需求', lane: 0, start: 0, span: 1 }, { name: '需求确认', lane: 1, start: 1, span: 1 },
            { name: '资信评估', lane: 2, start: 2, span: 2 }, { name: '授信审批', lane: 3, start: 3, span: 1 },
            { name: '签约放款', lane: 3, start: 4, span: 1 }] }; } }
    ]
  });

  CATS.push({
    id: 'special', name: '特殊', icon: '✳',
    desc: '领域专用图形，或承担"状态/区间/诊断"等非通用表达任务的图表。',
    charts: [
      

      { id: 'control', name: '控制图', type: 'control', desc: '过程监控：均值线 + 上下控制限，识别异常',
        data: function () { var v = rndArr(111, 40, 88, 112); v[17] = 128; v[28] = 72;
          return { labels: months(40), values: v, mean: 100, ucl: 118, lcl: 82 }; } },
      { id: 'parallel', name: '平行坐标', type: 'parallel', desc: '多维样本连线，找多维模式与离群样本',
        data: function () { return { dims: ['增速', '毛利', '负债率', 'ROE', '现金流'], rows: [
          { name: '公司 A', values: [18, 42, 55, 14, 82] }, { name: '公司 B', values: [9, 68, 32, 22, 65] },
          { name: '公司 C', values: [26, 31, 71, 8, 45] }, { name: '公司 D', values: [4, 55, 28, 18, 90] }] }; } },
      { id: 'streamgraph', name: '主题河流图', type: 'streamgraph', desc: '多主题随时间的此消彼长，看结构演变',
        data: function () { return { labels: months(30), topics: [
          { name: '主题 A', values: rndArr(121, 30, 30, 90) }, { name: '主题 B', values: rndArr(122, 30, 25, 80) },
          { name: '主题 C', values: rndArr(123, 30, 15, 70) }, { name: '主题 D', values: rndArr(124, 30, 10, 55) }] }; } }
    ]
  });


  CATS.push({
    id: 'showcase', name: '高级案例', icon: '✦',
    desc: '与常规图表不一样的定制可视化：D3.js 手工绘制，强调视觉表达与叙事张力。',
    charts: [
      { id: 'scForce', name: '关系网络图', type: 'scForce', desc: '力导向布局 · 节点大小代表权重，连线代表关联强度',
        data: function () { return { nodes: [
          { id: 'a', name: '算力', value: 92, group: 0 }, { id: 'b', name: '芯片', value: 78, group: 0 },
          { id: 'c', name: '云服务', value: 66, group: 1 }, { id: 'd', name: '大模型', value: 88, group: 1 },
          { id: 'e', name: '数据', value: 71, group: 2 }, { id: 'f', name: '电力', value: 54, group: 0 },
          { id: 'g', name: '应用', value: 48, group: 1 }, { id: 'h', name: '监管', value: 32, group: 3 },
          { id: 'i', name: '资本', value: 45, group: 3 }],
          links: [
            { source: 'a', target: 'b', value: 9 }, { source: 'a', target: 'f', value: 6 }, { source: 'b', target: 'c', value: 5 },
            { source: 'd', target: 'a', value: 8 }, { source: 'd', target: 'e', value: 7 }, { source: 'c', target: 'g', value: 4 },
            { source: 'e', target: 'd', value: 6 }, { source: 'i', target: 'd', value: 3 }, { source: 'h', target: 'd', value: 2 },
            { source: 'g', target: 'h', value: 2 }, { source: 'b', target: 'e', value: 3 }] }; } },
      { id: 'scChord', name: '和弦图', type: 'scChord', desc: '环形双向流量 · 渐变丝带展示区域间资金往来',
        data: function () { return { names: ['华东', '华南', '华北', '西南', '境外'],
          matrix: [[0, 32, 18, 9, 12], [28, 0, 14, 7, 16], [15, 11, 0, 5, 9], [8, 6, 4, 0, 3], [11, 14, 8, 2, 0]] }; } },
      { id: 'scRadialTree', name: '径向树', type: 'scRadialTree', desc: '环形层级展开 · 适合多级分类结构',
        data: function () { return { tree: { name: '业务版图', children: [
          { name: '消费', children: [{ name: '家电' }, { name: '食品' }, { name: '服饰' }] },
          { name: '科技', children: [{ name: '半导体', children: [{ name: '设计' }, { name: '制造' }] }, { name: '软件' }, { name: '硬件' }] },
          { name: '医药', children: [{ name: '创新药' }, { name: '器械' }] },
          { name: '能源', children: [{ name: '光伏' }, { name: '储能' }] }] } }; } },
      { id: 'scHexbin', name: '六边形密度图', type: 'scHexbin', desc: '二维数据密度聚合 · 避免散点过度重叠',
        data: function () {
          var pts = [], i;
          for (i = 0; i < 260; i++) {
            var cx = [30, 55, 75][i % 3], cy = [40, 62, 30][i % 3];
            pts.push([cx + (Math.sin(i * 1.7) * 12), cy + (Math.cos(i * 2.3) * 14)]);
          }
          for (i = 0; i < 140; i++) pts.push([50 + Math.sin(i * 3.1) * 30, 55 + Math.cos(i * 1.9) * 26]);
          return { points: pts }; } },
      { id: 'scGlowLine', name: '发光趋势线', type: 'scGlowLine', desc: '终端式单曲线 · 渐变发光 + 末端强调',
        data: function () {
          var labels = [], vals = [], v = 120;
          for (var i = 0; i < 48; i++) {
            labels.push('M' + (i + 1));
            v += Math.sin(i / 3.2) * 6 + Math.cos(i / 1.7) * 3 + 0.6;
            vals.push(Math.round(v * 100) / 100);
          }
          return { labels: labels, series: [{ name: '指数', values: vals }] }; } },
      { id: 'scWaterfall', name: '动画瀑布图', type: 'scWaterfall', desc: '逐条生长的增减拆解 · 节奏感更强',
        data: function () { return { labels: ['期初', '新增', '流失', '提价', '成本', '期末'], values: [500, 120, -80, 60, -45, 555] }; } }
    ]
  });


  /* ---- 机构级精选：每类保留 2–3 张代表作，D3 高级图嵌入对应分类 ---- */
  (function () {
    var SHOW = {};
    var sc = null;
    for (var i = 0; i < CATS.length; i++) {
      if (CATS[i].id === 'showcase') { sc = CATS[i]; break; }
    }
    if (sc) { sc.charts.forEach(function (ch) { SHOW[ch.id] = ch; }); }
    var keep = {
      compare: ['groupedBar', 'dumbbell', 'pmiRadar'],
      trend: ['season', 'stacked', 'waterfall', 'dual'],
      composition: ['donut', 'percentBar', 'treemap'],
      distribution: ['histogram', 'boxplot', 'ridge'],
      relation: ['scatter', 'corrMatrix', 'corrNetwork'],
      flow: ['funnel', 'sankey'],
      geo: ['choropleth', 'heatMapGeo'],
      hierarchy: ['tree', 'archDiagram', 'swimlane'],
      special: ['control', 'streamgraph', 'parallel']
    };
    var next = [];
    CATS.forEach(function (c) {
      if (!keep[c.id]) return;                          // 丢掉 showcase 分类
      c.charts = c.charts.filter(function (ch) { return keep[c.id].indexOf(ch.id) >= 0; });
      next.push(c);
    });
    CATS = next;
    /* 把 D3 代表作放进对应分类 */
    function pushTo(catId, chId) {
      if (!SHOW[chId]) return;
      for (var k = 0; k < CATS.length; k++) {
        if (CATS[k].id === catId) { CATS[k].charts.push(SHOW[chId]); return; }
      }
    }
    pushTo('flow', 'scChord');           // 和弦图（渐变丝带）
    pushTo('hierarchy', 'scRadialTree'); // 径向树
  })();


  /* 全量英文对照（整句优先匹配） */
  var FULL_EN = {
'比较与排序': 'Comparison & Ranking',
'谁高谁低、谁多谁少、排名先后、个体之间或个体与基准之间的差异。': 'Who is higher or lower, how much more, ranking, and gaps versus a benchmark.',
'多期对比条形图': 'Multi-period bars',
'8 个行业 5 年增速对比，含行业基准线': '8 industries over 5 years, with benchmark line',
'哑铃图': 'Dumbbell',
'2021→2025 五年变化：谁在拉开差距、谁在追赶': '2021→2025: who is pulling ahead, who is catching up',
'新能源': 'New energy',
'高端制造': 'Advanced manufacturing',
'传统能源': 'Traditional energy',
'制造业 PMI 雷达 · 13 项': 'Manufacturing PMI radar · 13 items',
'13 项景气指标近 3 个月对比，点出波动最大的指标': '13 activity indicators over the last 3 months, with the most volatile item called out',
'制造业 PMI': 'Manufacturing PMI',
'服务业 PMI': 'Services PMI',
'工业增加值': 'Industrial output',
'固定资产投资': 'Fixed-asset investment',
'社会消费品零售': 'Retail sales',
'出口': 'Exports',
'进口': 'Imports',
'新增贷款': 'New loans',
'贷款余额': 'Loan balance',
'趋势与时间': 'Trend & Time',
'数据随时间怎么变、变化的节奏、拐点、周期、累计过程。': 'How values change over time — pace, turning points, cycles and accumulation.',
'季节性折线': 'Seasonal line',
'近 4 年同月对比：看季节性规律与同比变化': 'Same months across 4 years: seasonality and YoY change',
'月度营收': 'Monthly revenue',
'结构演变': 'Structure shift',
'5 年营收结构：四条业务线的此消彼长': '5-year revenue mix: four business lines rising and falling',
'硬件': 'Hardware',
'软件': 'Software',
'服务': 'Services',
'其他': 'Other',
'归因瀑布': 'Attribution waterfall',
"从收入到净利：每一笔增减的贡献拆解": "Revenue to net profit: each driver's contribution",
'营业收入': 'Revenue',
'营业成本': 'COGS',
'销售费用': 'Selling expense',
'管理费用': 'Admin expense',
'研发费用': 'R&D expense',
'净利润': 'Net profit',
'双轴趋势': 'Dual-axis trend',
'指数点位（左）对比利率水平（右），看背离与联动': 'Index level (left) vs yield (right): divergence and linkage',
'沪深300': 'CSI 300',
'10年国债收益率': '10Y CGB yield',
'构成与占比': 'Composition & Share',
'整体由哪些部分组成、各部分占多少、层级构成如何。': 'What the whole consists of, how much each part contributes, and the hierarchy.',
'环形图': 'Donut',
'中心可放总量或关键指标，比饼图信息密度更高': 'Centre holds a total or KPI — denser than a pie',
'直销': 'Direct',
'经销': 'Distributor',
'电商': 'E-commerce',
'渠道结构': 'Channel mix',
'百分比堆叠条形图': '100% stacked bar',
'只比结构不比总量，跨组比较最公平': 'Structure only, the fairest cross-group comparison',
'客单价 <50': 'AOV <50',
'新客': 'New',
'老客': 'Returning',
'会员': 'Members',
'矩形树图': 'Treemap',
'板块面积即规模：二级结构 + 占比一眼可读': 'Area equals size: two-level structure and share at a glance',
'境内': 'Domestic',
'华东': 'East China',
'华南': 'South China',
'华北': 'North China',
'境外': 'Overseas',
'北美': 'N. America',
'欧洲': 'Europe',
'亚太': 'APAC',
'分布与离散': 'Distribution & Spread',
'数据怎么分布、集中在哪、尾部和离群点有多长、组间差异多大。': 'Where values concentrate, how long the tails are, and how groups differ.',
'直方图': 'Histogram',
'看数据分布形状、集中区间与长尾': 'Distribution shape, concentration and tails',
'分布条带图': 'Distribution ribbon',
'P10–P90 全距 + IQR 实心 + 中位刻度，组间差异一眼可比': 'P10–P90 range + solid IQR + median tick — comparable across groups',
'A 组 · 一线': 'Group A · Tier 1',
'B 组 · 新一线': 'Group B · New Tier 1',
'C 组 · 二线': 'Group C · Tier 2',
'D 组 · 三线': 'Group D · Tier 3',
'山脊图': 'Ridgeline',
'多组密度曲线错位堆叠，看分布形态与位移': 'Offset densities to compare shape and drift',
'关系与相关': 'Relationship & Correlation',
'变量之间有没有关系、关系强弱与方向、资产之间的联动结构。': 'Whether variables are related, strength and direction, and how assets move together.',
'两资产散点 + 拟合线': 'Two-asset scatter + fit',
'沪深300 与 标普500 日收益率：线性拟合与 R²': 'CSI 300 vs S&P 500 daily returns: OLS fit and R²',
'沪深300 日收益率（%）': 'CSI 300 daily return (%)',
'标普500 日收益率（%）': 'S&P 500 daily return (%)',
'交易日': 'Trading days',
'相关性矩阵': 'Correlation matrix',
'10 类金融资产日收益率相关性 · 红正蓝负': 'Daily-return correlations across 10 assets · red positive, blue negative',
'标普500': 'S&P 500',
'纳斯达克': 'Nasdaq',
'中债10Y': 'CGB 10Y',
'美债10Y': 'UST 10Y',
'COMEX黄金': 'COMEX Gold',
'WTI原油': 'WTI Crude',
'美元指数': 'Dollar Index',
'LME铜': 'LME Copper',
'日经225': 'Nikkei 225',
'关联网络 + 矩阵': 'Correlation network + matrix',
'左网络右矩阵：一眼看出谁与谁同涨同跌': 'Network on the left, matrix on the right: see who moves with whom',
'流动与转化': 'Flow & Conversion',
'数据/资源/用户从哪来到哪去、流量大小、环节转化与流失。': 'Where data, resources or users come from and go, flow volume, conversion and churn.',
'漏斗图': 'Funnel',
'逐级转化与流失，定位瓶颈环节': 'Stage-by-stage conversion and drop-off to locate bottlenecks',
'曝光': 'Impressions',
'点击': 'Clicks',
'加购': 'Add to cart',
'下单': 'Orders',
'支付': 'Payments',
'桑基图': 'Sankey',
'多级流向与分流比例，看资源如何在环节间流动': 'Multi-stage flows and split ratios',
'自然搜索': 'Organic search',
'付费广告': 'Paid ads',
'社交内容': 'Social content',
'成交': 'Converted',
'加购未付': 'Cart abandoned',
'流失': 'Churned',
'和弦图': 'Chord',
'环形双向流量 · 渐变丝带展示区域间资金往来': 'Bidirectional ring flows: gradient ribbons of regional capital',
'西南': 'Southwest',
'地理空间': 'Geospatial',
'在哪里、区域差异、空间密度、位置分布。': 'Where things happen, regional gaps, spatial density and location.',
'分级统计图': 'Choropleth',
'按行政区着色，看区域指标高低': 'Shade regions by indicator to compare levels',
'人均 GDP（万元）': 'GDP per capita (10k)',
'热力地图': 'Hotspot bubble map',
'空间密度热力，找聚集热点': 'Spatial density hotspots',
'门店密度': 'Store density',
'层级与流程': 'Hierarchy & Process',
'系统架构图': 'System architecture',
'单点入口': 'single entry point',
'令牌校验': 'token check',
'订单写入': 'order write',
'订单库': 'orders',
'归档': 'archive',
'会话': 'sessions',
'边缘接入': 'EDGE',
'核心服务': 'CORE SERVICES',
'数据层': 'DATA',
'分区分组 + 正交连线 + 线上标注，改配色只换边框': 'Zones, orthogonal connectors and inline labels — the palette only recolours borders and lines',
'Web App': 'Web App','Mobile App': 'Mobile App','API Gateway': 'API Gateway','Auth Service': 'Auth Service','令牌校验': 'token check','Orders Service': 'Orders Service','Postgres': 'Postgres','订单库': 'orders','Object Store': 'Object Store','归档': 'archive','Redis': 'Redis','边缘接入': 'EDGE','核心服务': 'CORE SERVICES','是': 'Yes',
'否': 'No',
'组织/分类的层级结构，任务/审批/协作的先后与责任归属。': 'Organisational hierarchy and the sequence and ownership of tasks and approvals.',
'树形图': 'Tree',
'层级结构的展开，看分类归属': 'Expand the hierarchy and see where things belong',
'集团': 'Group',
'消费事业群': 'Consumer BU',
'家电': 'Appliances',
'食品': 'Food',
'服饰': 'Apparel',
'科技事业群': 'Technology BU',
'半导体': 'Semiconductors',
'创新药': 'Innovative drugs',
'器械': 'Devices',
'医药事业群': 'Healthcare BU',
'泳道图': 'Swimlane',
'按责任方分泳道，看跨部门协作流程': 'Lanes by owner: cross-team process',
'客户': 'Customer',
'销售': 'Sales',
'风控': 'Risk',
'财务': 'Finance',
'提交需求': 'Submit request',
'需求确认': 'Requirement sign-off',
'资信评估': 'Credit assessment',
'授信审批': 'Credit approval',
'签约放款': 'Contract & disbursement',
'径向树': 'Radial tree',
'环形层级展开 · 适合多级分类结构': 'Radial hierarchy for multi-level categories',
'业务版图': 'Business map',
'设计': 'Design',
'光伏': 'Solar',
'储能': 'Storage',
'特殊': 'Specialized',
'领域专用图形，或承担\'状态/区间/诊断\'等非通用表达任务的图表。': 'Domain-specific graphics, or charts for state, interval and diagnostic tasks.',
'控制图': 'Control chart',
'过程监控：均值线 + 上下控制限，识别异常': 'Process monitoring: mean and control limits flag anomalies',
'平行坐标': 'Parallel coordinates',
'多维样本连线，找多维模式与离群样本': 'Multi-dimensional sample lines to spot patterns and outliers',
'增速': 'Growth',
'毛利': 'Gross margin',
'负债率': 'Leverage',
'现金流': 'Cash flow',
'公司 A': 'Company A',
'公司 B': 'Company B',
'公司 C': 'Company C',
'公司 D': 'Company D',
'主题河流图': 'Streamgraph',
'多主题随时间的此消彼长，看结构演变': 'Themes rising and falling over time',
'主题 A': 'Theme A',
'主题 B': 'Theme B',
'主题 C': 'Theme C',
'主题 D': 'Theme D'
};
  function localizeDemo(obj) {
    var en = false;
    try { en = window.I18N && window.I18N.getLang() === 'en'; } catch (e) {}
    if (!en) return obj;
    function walk(v) {
      if (typeof v === 'string') {
        if (FULL_EN[v] !== undefined) return FULL_EN[v];
        return DEMO_EN[v] !== undefined ? DEMO_EN[v] : v;
      }
      if (Array.isArray(v)) return v.map(walk);
      if (v && typeof v === 'object') { var o = {}; for (var k in v) o[k] = walk(v[k]); return o; }
      return v;
    }
    return walk(obj);
  }
  global.localizeDemo = localizeDemo;
  global.CHART_CATALOG = CATS;
  global.CHART_GEN = { rndArr: rndArr, months: months, seedRand: seedRand };
})(window);
