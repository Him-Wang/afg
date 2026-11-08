/* ADV 图表分类目录：9 大用途分类 + 图表定义 + 演示数据生成器 */
(function (global) {
  'use strict';

  /* 确定性伪随机（保证每次进入案例一致） */
  function seedRand(seed) {
    var s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
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

  var CATS = [];
  CATS.push({
    id: 'compare', name: '比较与排序', icon: '⇄',
    desc: '谁高谁低、谁多谁少、排名先后、个体之间或个体与基准之间的差异。',
    charts: [
      { id: 'groupedBar', name: '分组条形图', type: 'groupedBar', desc: '同一维度下多组数据并排对比，看组间差异',
        data: function () { return { labels: ['华东', '华南', '华北', '西南', '东北'], series: [
          { name: '2024', values: [86, 72, 64, 51, 38] }, { name: '2025', values: [94, 79, 61, 58, 33] }] }; } },
      { id: 'tornado', name: '对比柱状图（旋风图）', type: 'tornado', desc: '左右对称对比两组指标，一眼看出结构差异',
        data: function () { return { labels: ['研发', '销售', '管理', '生产', '客服'], left: [18, 42, 25, 55, 12], right: [26, 31, 19, 62, 9], leftName: 'A 公司', rightName: 'B 公司' }; } },
      { id: 'lollipop', name: '棒棒糖图', type: 'lollipop', desc: '排序后的横向对比，比条形图更轻，适合排名展示',
        data: function () { return { labels: ['消费', '科技', '医药', '金融', '制造', '能源'], values: [92, 78, 65, 54, 41, 23] }; } },
      { id: 'bullet', name: '子弹图', type: 'bullet', desc: '实际值对照目标与区间，适合 KPI 达成情况',
        data: function () { return { rows: [
          { name: '营收完成率', value: 86, target: 100, ranges: [60, 80, 100] },
          { name: '毛利完成率', value: 72, target: 85, ranges: [50, 70, 90] },
          { name: '客户留存', value: 91, target: 90, ranges: [70, 85, 95] }] }; } },
      { id: 'wordcloud', name: '词云', type: 'wordcloud', desc: '按词频大小排布的文本可视化，突出高频主题',
        data: function () { return { words: [
          { text: '算力', weight: 100 }, { text: '新能源', weight: 92 }, { text: '出海', weight: 85 }, { text: '降本', weight: 78 },
          { text: '现金流', weight: 72 }, { text: '毛利率', weight: 66 }, { text: 'AI', weight: 63 }, { text: '库存', weight: 56 },
          { text: '研发', weight: 51 }, { text: '分红', weight: 46 }, { text: '并购', weight: 40 }, { text: '汇率', weight: 35 },
          { text: '供应链', weight: 31 }, { text: '产能', weight: 28 }, { text: '估值', weight: 24 }] }; } },
      { id: 'radar', name: '雷达图', type: 'radar', desc: '多维度能力画像，比较主体在各维度的强项与短板',
        data: function () { return { indicators: ['盈利', '成长', '运营', '偿债', '现金流', '估值'], series: [
          { name: '公司 A', values: [85, 72, 66, 78, 81, 58] }, { name: '公司 B', values: [62, 88, 74, 55, 60, 82] }] }; } }
    ]
  });

  CATS.push({
    id: 'trend', name: '趋势与时间', icon: '↗',
    desc: '数据随时间怎么变、变化的节奏、拐点、周期、累计过程。',
    charts: [
      { id: 'line', name: '折线图', type: 'line', desc: '最通用的时间序列表达，看趋势与拐点',
        data: function () { return { labels: months(36), series: [
          { name: '指标 A', values: rndArr(11, 36, 80, 160) }, { name: '指标 B', values: rndArr(12, 36, 60, 120) }] }; } },
      { id: 'area', name: '面积图', type: 'area', desc: '强调累积量的变化，视觉重量更强',
        data: function () { return { labels: months(30), series: [{ name: '成交额', values: rndArr(21, 30, 420, 980) }] }; } },
      { id: 'stacked', name: '堆叠面积图', type: 'stacked', desc: '多项累加看总量与结构同步变化',
        data: function () { return { labels: months(24), series: [
          { name: '业务 A', values: rndArr(31, 24, 120, 260) }, { name: '业务 B', values: rndArr(32, 24, 80, 200) }, { name: '业务 C', values: rndArr(33, 24, 40, 150) }] }; } },
      { id: 'waterfall', name: '瀑布图', type: 'waterfall', desc: '从起点到终点的增减拆解，看清每一笔贡献',
        data: function () { return { labels: ['期初', '新增', '流失', '提价', '成本', '期末'], values: [500, 120, -80, 60, -45, 555], totalFromZero: false }; } },
      { id: 'heatmap', name: '热力图', type: 'heatmap', desc: '二维矩阵用颜色编码数值，快速定位高低区',
        data: function () { return { xLabels: ['Q1', 'Q2', 'Q3', 'Q4'], yLabels: ['产品 A', '产品 B', '产品 C', '产品 D'],
          values: [[82, 91, 76, 88], [64, 72, 85, 69], [45, 51, 62, 58], [30, 38, 44, 41]] }; } }
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
      { id: 'stackedBar', name: '堆叠柱状图', type: 'stackedBar', desc: '分类间比较的同时看内部构成',
        data: function () { return { labels: ['2021', '2022', '2023', '2024', '2025'], series: [
          { name: '华东', values: [120, 138, 152, 171, 190] }, { name: '华南', values: [90, 102, 118, 127, 145] }, { name: '华北', values: [70, 76, 82, 95, 104] }] }; } },
      { id: 'percentBar', name: '百分比堆叠条形图', type: 'percentBar', desc: '只比结构不比总量，跨组比较最公平',
        data: function () { return { labels: ['客单价 <50', '50–100', '100–300', '>300'], series: [
          { name: '新客', values: [58, 42, 25, 12] }, { name: '老客', values: [32, 46, 55, 61] }, { name: '会员', values: [10, 12, 20, 27] }] }; } },
      { id: 'treemap', name: '矩形树图', type: 'treemap', desc: '面积即占比，同时展示两层层级结构',
        data: function () { return { data: [
          { name: '消费', value: 38, children: [{ name: '家电', value: 15 }, { name: '食品', value: 13 }, { name: '服饰', value: 10 }] },
          { name: '科技', value: 30, children: [{ name: '半导体', value: 14 }, { name: '软件', value: 9 }, { name: '硬件', value: 7 }] },
          { name: '医药', value: 18, children: [{ name: '创新药', value: 10 }, { name: '器械', value: 8 }] },
          { name: '其他', value: 14 }] }; } },
      { id: 'sunburst', name: '旭日图', type: 'sunburst', desc: '多层占比的径向展开，适合三级以上结构',
        data: function () { return { data: [
          { name: '境内', children: [{ name: '华东', value: 32 }, { name: '华南', value: 25 }, { name: '华北', value: 15 }] },
          { name: '境外', children: [{ name: '北美', value: 14 }, { name: '欧洲', value: 9 }, { name: '亚太', value: 5 }] }] }; } }
    ]
  });

  CATS.push({
    id: 'distribution', name: '分布', icon: '▥',
    desc: '数据集中在哪、离散程度、偏态、异常值、双峰/多峰。',
    charts: [
      { id: 'histogram', name: '直方图', type: 'histogram', desc: '看数据分布形状、集中区间与长尾',
        data: function () { return { values: rndArr(41, 160, 20, 100) }; } },
      { id: 'boxplot', name: '箱线图', type: 'boxplot', desc: '五数概括，快速比较组间中位数与离散度',
        data: function () { return { categories: ['A 组', 'B 组', 'C 组', 'D 组'], boxes: [
          [22, 48, 61, 74, 95], [30, 55, 68, 80, 99], [15, 38, 52, 63, 88], [40, 62, 75, 88, 105]] }; } },
      { id: 'violin', name: '小提琴图', type: 'violin', desc: '箱线图 + 密度曲线，看清分布的多峰形态',
        data: function () { return { categories: ['A 组', 'B 组', 'C 组'], groups: [
          rndArr(51, 80, 20, 96), rndArr(52, 80, 35, 100), rndArr(53, 80, 15, 80)] }; } },
      { id: 'beeswarm', name: '蜂群图', type: 'beeswarm', desc: '逐点展示，避免散点重叠，看清真实样本分布',
        data: function () { return { categories: ['A 组', 'B 组', 'C 组'], groups: [
          rndArr(61, 60, 18, 92), rndArr(62, 60, 30, 100), rndArr(63, 60, 12, 78)] }; } },
      { id: 'ridge', name: '山脊图', type: 'ridge', desc: '多组密度曲线竖向堆叠，比较分布形态变化',
        data: function () { return { labels: ['2021', '2022', '2023', '2024', '2025'],
          groups: [rndArr(71, 70, 20, 80), rndArr(72, 70, 25, 85), rndArr(73, 70, 30, 90), rndArr(74, 70, 28, 95), rndArr(75, 70, 35, 100)] }; } },
      { id: 'matrixHeat', name: '二维热力图', type: 'matrixHeat', desc: '两个维度交叉的热力矩阵，找聚集区',
        data: function () { var names = ['0–20', '20–40', '40–60', '60–80', '80–100'];
          return { names: names, matrix: names.map(function (_, i) { return names.map(function (_, j) { return Math.round((rnd(i * 10 + j + 1, 20, 95) / 100) * 100) / 100; }); }) }; } },
      { id: 'ecdf', name: 'Q-Q 图 / ECDF', type: 'ecdf', desc: '经验分布与理论分位对照，检验分布假设',
        data: function () { return { samples: rndArr(81, 120, 10, 95) }; } }
    ]
  });

  CATS.push({
    id: 'relation', name: '关系与相关', icon: '⌘',
    desc: '变量之间有没有关系、关系强弱/方向、网络结构、集合交集。',
    charts: [
      { id: 'scatter', name: '散点图', type: 'scatter', desc: '两个变量的关系方向与强弱，看离群点',
        data: function () { var a = rndArr(91, 60, 10, 90); return { xName: '广告投入', yName: '销售额',
          points: a.map(function (x, i) { return [x, Math.round(x * 1.6 + rnd(92 + i, -25, 25))]; }), seriesName: '门店' }; } },
      { id: 'bubble', name: '气泡图', type: 'bubble', desc: '散点 + 第三维（大小），一图看三个变量',
        data: function () { return { xName: '增速', yName: '利润率', data: [
          { name: '消费', x: 12, y: 18, size: 92 }, { name: '科技', x: 28, y: 24, size: 74 },
          { name: '医药', x: 9, y: 31, size: 58 }, { name: '金融', x: 6, y: 14, size: 66 }, { name: '制造', x: 19, y: 9, size: 45 }] }; } },
      { id: 'scatterMatrix', name: '矩阵散点图', type: 'scatterMatrix', desc: '多变量两两散点，快速扫出相关结构',
        data: function () { return { series: [
          { name: 'GDP', values: rndArr(101, 40, 2, 8) }, { name: 'CPI', values: rndArr(102, 40, 0, 4) },
          { name: 'M2', values: rndArr(103, 40, 6, 14) }, { name: '出口', values: rndArr(104, 40, -5, 20) }] }; } },
      { id: 'corrMatrix', name: '相关系数矩阵', type: 'corrMatrix', desc: '量化两两相关强度，红正蓝负一目了然',
        data: function () { return { names: ['GDP', 'CPI', 'M2', '出口', '投资'],
          matrix: [[1, .32, .68, .51, .74], [.32, 1, .18, -.12, .25], [.68, .18, 1, .44, .82], [.51, -.12, .44, 1, .39], [.74, .25, .82, .39, 1]] }; } },
      { id: 'venn', name: '维恩图', type: 'venn', desc: '集合交集与独有部分，适合客群/功能重叠分析',
        data: function () { return { sets: [
          { name: '功能 A', value: 42 }, { name: '功能 B', value: 35 }, { name: '功能 C', value: 28 }], overlapAB: 18, overlapAll: 7 }; } },
      { id: 'arc', name: '弧长链接图', type: 'arc', desc: '一维排序 + 弧线连接，看长距离关联',
        data: function () { return { nodes: ['采购', '生产', '仓储', '物流', '门店', '客户'], links: [
          ['采购', '生产'], ['采购', '仓储'], ['生产', '仓储'], ['仓储', '物流'], ['物流', '门店'], ['门店', '客户'], ['生产', '客户']] }; } }
    ]
  });

  CATS.push({
    id: 'flow', name: '流动与转化', icon: '⇢',
    desc: '数据/资源/用户从哪来到哪去、流量大小、环节转化与流失。',
    charts: [
      { id: 'funnel', name: '漏斗图', type: 'funnel', desc: '逐级转化与流失，定位瓶颈环节',
        data: function () { return { steps: [
          { name: '曝光', value: 100 }, { name: '点击', value: 62 }, { name: '加购', value: 34 }, { name: '下单', value: 21 }, { name: '支付', value: 16 }] }; } },
      { id: 'sankey', name: '桑基图', type: 'sankey', desc: '多级流向与分流比例，看资源如何在环节间流动',
        data: function () { return { nodes: [{ name: '总流量', color: '#1A1A2E' }, { name: '自然搜索', color: '#C9A96A' }, { name: '付费广告', color: '#6F8FA8' }, { name: '社交', color: '#7FA06F' }, { name: '成交', color: '#9B7FB5' }, { name: '流失', color: '#C08484' }],
          links: [{ source: '总流量', target: '自然搜索', value: 46 }, { source: '总流量', target: '付费广告', value: 32 }, { source: '总流量', target: '社交', value: 22 },
            { source: '自然搜索', target: '成交', value: 28 }, { source: '自然搜索', target: '流失', value: 18 }, { source: '付费广告', target: '成交', value: 19 }, { source: '付费广告', target: '流失', value: 13 }, { source: '社交', target: '成交', value: 8 }, { source: '社交', target: '流失', value: 14 }], total: 100 }; } },
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
      { id: 'symbolMap', name: '符号地图', type: 'symbolMap', desc: '用气泡大小表达城市量级，位置不失真',
        data: function () { return { points: [
          { name: 'Shanghai', coord: [121.47, 31.23], value: 96 }, { name: 'New York', coord: [-74.01, 40.71], value: 92 },
          { name: 'London', coord: [-0.13, 51.51], value: 88 }, { name: 'Tokyo', coord: [139.69, 35.69], value: 85 },
          { name: 'Singapore', coord: [103.82, 1.35], value: 76 }, { name: 'Dubai', coord: [55.27, 25.20], value: 61 },
          { name: 'Sydney', coord: [151.21, -33.87], value: 55 }, { name: 'São Paulo', coord: [-46.63, -23.55], value: 48 }] }; } },
      { id: 'heatMapGeo', name: '热力地图', type: 'heatMapGeo', desc: '空间密度热力，找聚集热点',
        data: function () { return { metric: '门店密度' }; } },
      { id: 'trajectory', name: '轨迹图', type: 'trajectory', desc: '路径与轨迹，看移动规律与线路',
        data: function () { return { path: [[121.47, 31.23], [103.82, 1.35], [55.27, 25.20], [-0.13, 51.51], [-74.01, 40.71]] }; } },
      { id: 'migration', name: '迁徙图', type: 'migration', desc: '人口/资源迁移方向与规模',
        data: function () { return { flows: [
          { from: [121.47, 31.23], to: [-74.01, 40.71], value: 62 }, { from: [103.82, 1.35], to: [-0.13, 51.51], value: 48 },
          { from: [139.69, 35.69], to: [151.21, -33.87], value: 35 }, { from: [55.27, 25.20], to: [-46.63, -23.55], value: 29 }] }; } },
      { id: 'hexMap', name: '六边形地图', type: 'hexMap', desc: '等面积网格聚合，避免面积偏差',
        data: function () { return { points: [
          { name: 'Shanghai', coord: [121.47, 31.23], value: 88 }, { name: 'New York', coord: [-74.01, 40.71], value: 94 },
          { name: 'London', coord: [-0.13, 51.51], value: 79 }, { name: 'Dubai', coord: [55.27, 25.20], value: 58 },
          { name: 'Tokyo', coord: [139.69, 35.69], value: 52 }, { name: 'Sydney', coord: [151.21, -33.87], value: 44 }] }; } }
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
      { id: 'icicle', name: '冰柱图', type: 'icicle', desc: '层级占比的横向堆叠，比树图更省空间',
        data: function () { return { tree: { name: '全部', children: [
          { name: '消费', value: 38, children: [{ name: '家电', value: 15 }, { name: '食品', value: 13 }, { name: '服饰', value: 10 }] },
          { name: '科技', value: 30, children: [{ name: '半导体', value: 14 }, { name: '软件', value: 16 }] },
          { name: '医药', value: 18 }, { name: '其他', value: 14 }] } }; } },
      { id: 'flowchart', name: '流程图', type: 'flowchart', desc: '步骤先后与分支判断，梳理业务链路',
        data: function () { return { steps: [
          { name: '提交申请', type: 'start' }, { name: '材料审核', type: 'process' },
          { name: '是否齐全', type: 'decision' }, { name: '补充材料', type: 'process' }, { name: '通过', type: 'end' }] }; } },
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
      { id: 'bulletSpecial', name: '子弹图（KPI）', type: 'bullet', desc: '单指标对照目标区间，仪表盘常用',
        data: function () { return { rows: [
          { name: '本月营收', value: 92, target: 100, ranges: [60, 85, 110] },
          { name: '回款率', value: 78, target: 90, ranges: [55, 75, 95] }] }; } },
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

  global.CHART_CATALOG = CATS;
  global.CHART_GEN = { rndArr: rndArr, months: months, seedRand: seedRand };
})(window);
