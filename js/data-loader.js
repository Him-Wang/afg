/* ============================================================
 * 数据层 — 内置示例数据 + CSV / Excel / JSON 解析 + 列识别
 * ============================================================ */
(function (global) {
  'use strict';

  /* ---------- 确定性伪随机（示例 K 线数据用，保证每次一致） ---------- */
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ---------- 生成示例 K 线（含成交量） ---------- */
  function genOHLC(count, startPrice, startDate, seed) {
    var rnd = mulberry32(seed);
    var out = [];
    var price = startPrice;
    var d = new Date(startDate);
    for (var i = 0; i < count; i++) {
      var change = (rnd() - 0.485) * price * 0.028;
      var open = price;
      var close = Math.max(1, open + change);
      var high = Math.max(open, close) * (1 + rnd() * 0.012);
      var low = Math.min(open, close) * (1 - rnd() * 0.012);
      var volume = Math.round(300000 + rnd() * 2200000 + Math.abs(change) * 120000);
      out.push({
        time: d.toISOString().slice(0, 10),
        open: round(open), high: round(high), low: round(low), close: round(close),
        volume: volume
      });
      price = close;
      d.setDate(d.getDate() + 1);
    }
    return out;
  }

  function round(n) { return Math.round(n * 100) / 100; }
  function seq(n, fn) { var a = []; for (var i = 0; i < n; i++) a.push(fn(i)); return a; }

  /* ---------- 内置示例数据 ---------- */
  var SAMPLES = {};

  SAMPLES['macro-gdp-area'] = {
    meta: { title: '主要经济体 GDP 同比增速', subtitle: '季度 · 实际同比（%）', unit: '%', source: '示例数据 · 演示用' },
    type: 'area',
    data: {
      labels: ['2019Q1','2019Q2','2019Q3','2019Q4','2020Q1','2020Q2','2020Q3','2020Q4','2021Q1','2021Q2','2021Q3','2021Q4','2022Q1','2022Q2','2022Q3','2022Q4','2023Q1','2023Q2','2023Q3','2023Q4','2024Q1','2024Q2','2024Q3'],
      series: [
        { name: '中国', values: [6.3,6.2,6.0,5.8,-6.8,3.2,4.9,6.5,18.3,7.9,4.9,4.0,4.8,0.4,3.9,2.9,4.5,6.3,4.9,5.2,5.3,4.7,4.6] },
        { name: '美国', values: [2.7,2.3,2.5,2.6,0.6,-8.4,-1.5,-1.9,0.6,12.2,5.0,5.7,3.7,1.8,2.4,1.0,1.7,2.4,2.9,3.2,2.9,3.0,2.7] },
        { name: '欧元区', values: [1.8,1.2,1.3,1.0,-3.1,-14.6,-4.2,-4.6,-1.2,14.4,3.9,4.7,5.2,4.2,2.4,1.8,1.2,0.6,0.0,0.2,0.4,0.6,0.9] }
      ]
    }
  };

  SAMPLES['macro-dual'] = {
    meta: { title: '社会消费品零售总额及增速', subtitle: '月度 · 累计值（万亿元）与同比（%）', unit: '万亿元', source: '示例数据 · 演示用' },
    type: 'dual',
    data: {
      labels: ['2023-01','2023-03','2023-05','2023-07','2023-09','2023-11','2024-01','2024-03','2024-05','2024-07','2024-09','2024-11'],
      bars: [{ name: '社零总额', values: [3.51, 11.62, 18.36, 26.28, 34.28, 42.79, 4.68, 12.03, 19.50, 27.40, 35.35, 43.80] }],
      lines: [{ name: '同比增速(%)', values: [3.5, 5.8, 2.5, 2.6, 5.5, 10.1, 5.5, 4.7, 3.7, 2.7, 3.2, 3.0] }]
    }
  };

  SAMPLES['macro-step'] = {
    meta: { title: '贷款市场报价利率（LPR）', subtitle: '1 年期与 5 年期以上（%）', unit: '%', source: '示例数据 · 演示用' },
    type: 'step',
    data: {
      labels: ['2019-08','2019-11','2020-02','2020-04','2021-01','2021-12','2022-01','2022-05','2022-08','2023-06','2023-08','2024-02','2024-07','2024-10'],
      series: [
        { name: '1年期 LPR', values: [4.25, 4.15, 4.05, 3.85, 3.85, 3.80, 3.70, 3.70, 3.65, 3.55, 3.45, 3.45, 3.35, 3.10] },
        { name: '5年期以上 LPR', values: [4.85, 4.80, 4.75, 4.65, 4.65, 4.65, 4.60, 4.45, 4.30, 4.20, 4.20, 3.95, 3.85, 3.60] }
      ]
    }
  };

  SAMPLES['macro-heatmap'] = {
    meta: { title: '全球主要经济体 GDP 增速矩阵', subtitle: '年度 · 实际同比（%）', unit: '%', source: '示例数据 · 演示用' },
    type: 'heatmap',
    data: {
      xLabels: ['2019','2020','2021','2022','2023','2024'],
      yLabels: ['中国','美国','欧元区','日本','印度','巴西','英国','韩国'],
      values: [
        [0,0,6.0],[1,0,2.5],[2,0,1.6],[3,0,0.7],[4,0,4.6],[5,0,7.2],
        [0,1,-2.2],[1,1,-5.8],[2,1,2.1],[3,1,1.0],[4,1,3.9],[5,1,4.4],
        [0,2,1.6],[1,2,-6.1],[2,2,5.4],[3,2,3.5],[4,2,0.4],[5,2,0.8],
        [0,3,-0.4],[1,3,-4.2],[2,3,2.6],[3,3,1.0],[4,3,1.9],[5,3,0.3],
        [0,4,3.9],[1,4,-5.8],[2,4,9.7],[3,4,7.0],[4,4,8.2],[5,4,6.8],
        [0,5,1.2],[1,5,-3.3],[2,5,4.8],[3,5,3.0],[4,5,2.9],[5,5,3.0],
        [0,6,1.6],[1,6,-10.4],[2,6,8.7],[3,6,4.3],[4,6,0.1],[5,6,1.1],
        [0,7,2.2],[1,7,-0.7],[2,7,4.3],[3,7,2.6],[4,7,1.4],[5,7,2.2]
      ]
    }
  };

  SAMPLES['industry-rank'] = {
    meta: { title: '申万一级行业营收增速排名', subtitle: '2024 年度 · 同比（%）', unit: '%', source: '示例数据 · 演示用' },
    type: 'rank',
    data: {
      categories: ['电子','电力设备','汽车','机械设备','基础化工','医药生物','计算机','食品饮料','银行','非银金融','房地产','钢铁'],
      values: [18.4, 15.2, 12.8, 10.6, 8.9, 6.7, 5.4, 3.8, 2.1, 1.2, -6.8, -9.5]
    }
  };

  SAMPLES['industry-bubble'] = {
    meta: { title: '行业景气定位矩阵', subtitle: '横轴：营收增速(%) · 纵轴：净利润增速(%) · 气泡：行业市值(万亿元)', unit: '', source: '示例数据 · 演示用' },
    type: 'bubble',
    data: {
      xName: '营收增速', yName: '净利润增速', sizeName: '市值',
      data: [
        { name: '电子', x: 18.4, y: 26.1, size: 7.2 },
        { name: '电力设备', x: 15.2, y: 21.8, size: 6.1 },
        { name: '汽车', x: 12.8, y: 16.5, size: 4.9 },
        { name: '机械设备', x: 10.6, y: 12.3, size: 4.2 },
        { name: '基础化工', x: 8.9, y: 6.4, size: 4.8 },
        { name: '医药生物', x: 6.7, y: 9.8, size: 5.5 },
        { name: '计算机', x: 5.4, y: -2.1, size: 4.1 },
        { name: '食品饮料', x: 3.8, y: 8.2, size: 5.8 },
        { name: '银行', x: 2.1, y: 1.5, size: 11.5 },
        { name: '非银金融', x: 1.2, y: -4.6, size: 5.2 },
        { name: '房地产', x: -6.8, y: -18.2, size: 2.1 },
        { name: '钢铁', x: -9.5, y: -22.4, size: 1.3 }
      ]
    }
  };

  SAMPLES['industry-treemap'] = {
    meta: { title: 'A 股行业市值分布', subtitle: '按申万一级行业 · 万亿元', unit: '万亿元', source: '示例数据 · 演示用' },
    type: 'treemap',
    data: {
      data: [
        { name: '银行', value: 11.5 }, { name: '电子', value: 7.2 }, { name: '电力设备', value: 6.1 },
        { name: '食品饮料', value: 5.8 }, { name: '医药生物', value: 5.5 }, { name: '非银金融', value: 5.2 },
        { name: '汽车', value: 4.9 }, { name: '基础化工', value: 4.8 }, { name: '机械设备', value: 4.2 },
        { name: '计算机', value: 4.1 }, { name: '国防军工', value: 2.8 }, { name: '房地产', value: 2.1 }
      ]
    }
  };

  SAMPLES['industry-stacked'] = {
    meta: { title: '三次产业结构变迁', subtitle: '占 GDP 比重（%）', unit: '%', source: '示例数据 · 演示用' },
    type: 'stacked',
    data: {
      labels: ['2000','2004','2008','2012','2016','2020','2023','2024'],
      series: [
        { name: '第一产业', values: [14.7, 13.1, 10.3, 9.1, 8.1, 7.7, 7.1, 6.8] },
        { name: '第二产业', values: [45.5, 45.9, 46.9, 45.4, 39.6, 37.8, 38.3, 36.6] },
        { name: '第三产业', values: [39.8, 41.0, 42.8, 45.5, 52.3, 54.5, 54.6, 56.6] }
      ]
    }
  };

  SAMPLES['fin-waterfall'] = {
    meta: { title: '营业收入桥接分析', subtitle: '2023 → 2024 · 亿元', unit: '亿元', source: '示例数据 · 演示用' },
    type: 'waterfall',
    data: {
      labels: ['2023 营收', '量增', '价增', '新产品', '海外扩张', '汇兑影响', '2024 营收'],
      values: [820, 96, 34, 52, 28, -18, 1012]
    }
  };

  SAMPLES['fin-combo'] = {
    meta: { title: '季度营收与毛利率', subtitle: '营业收入（亿元）与毛利率（%）', unit: '亿元', source: '示例数据 · 演示用' },
    type: 'dual',
    data: {
      labels: ['2023Q1','2023Q2','2023Q3','2023Q4','2024Q1','2024Q2','2024Q3','2024Q4'],
      bars: [{ name: '营业收入', values: [188, 204, 216, 232, 210, 226, 241, 258] }],
      lines: [{ name: '毛利率(%)', values: [38.2, 39.1, 40.3, 41.6, 42.0, 43.2, 44.5, 45.8] }]
    }
  };

  SAMPLES['fin-donut'] = {
    meta: { title: '营业收入结构', subtitle: '分业务占比（%）', unit: '%', source: '示例数据 · 演示用' },
    type: 'donut',
    data: {
      data: [
        { name: '核心产品', value: 46 }, { name: '增值服务', value: 22 },
        { name: '硬件销售', value: 14 }, { name: '海外业务', value: 11 }, { name: '其他', value: 7 }
      ]
    }
  };

  SAMPLES['fin-kpi'] = {
    meta: { title: '核心经营指标概览', subtitle: '2024 年度 · 亿元', unit: '', source: '示例数据 · 演示用' },
    type: 'kpi',
    data: {
      cards: [
        { label: '营业收入', value: '1,012.4', delta: '+12.6%', dir: 'pos', spark: [188,204,216,232,210,226,241,258,262,271,280,291] },
        { label: '归母净利润', value: '204.8', delta: '+18.2%', dir: 'pos', spark: [32,35,38,41,39,44,48,52,54,57,60,64] },
        { label: '毛利率', value: '45.8%', delta: '+3.1pp', dir: 'pos', spark: [38.2,39.1,40.3,41.6,42.0,43.2,44.5,45.8,46.1,46.4,46.6,45.8] },
        { label: '经营现金流', value: '186.3', delta: '-4.2%', dir: 'neg', spark: [52,48,55,50,46,49,44,42,45,41,38,40] }
      ]
    }
  };

  SAMPLES['fin-sankey'] = {
    meta: { title: '收入结构流向（桑基图）', subtitle: '营业收入 → 业务线 → 成本/费用/利润', unit: '亿元', source: '示例数据 · 演示用' },
    type: 'sankey',
    data: {
      nodes: [
        { name: '营业收入' },
        { name: '产品线 A' }, { name: '产品线 B' }, { name: '产品线 C' },
        { name: '营业成本' }, { name: '销售费用' }, { name: '管理费用' }, { name: '净利润' }
      ],
      links: [
        { source: '营业收入', target: '产品线 A', value: 420 },
        { source: '营业收入', target: '产品线 B', value: 330 },
        { source: '营业收入', target: '产品线 C', value: 260 },
        { source: '产品线 A', target: '营业成本', value: 240 },
        { source: '产品线 A', target: '销售费用', value: 90 },
        { source: '产品线 A', target: '净利润', value: 90 },
        { source: '产品线 B', target: '营业成本', value: 200 },
        { source: '产品线 B', target: '管理费用', value: 50 },
        { source: '产品线 B', target: '净利润', value: 80 },
        { source: '产品线 C', target: '营业成本', value: 150 },
        { source: '产品线 C', target: '销售费用', value: 40 },
        { source: '产品线 C', target: '净利润', value: 70 }
      ]
    }
  };

  /* ============================================================
   * 机器学习示例数据（确定性生成）
   * ============================================================ */

  (function () {
    var r;

    // 回归趋势：营收（线性趋势 + 噪声）
    r = mulberry32(11);
    var trendLabels = ['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024'];
    SAMPLES['ml-trend'] = {
      meta: { title: '营收趋势与回归拟合', subtitle: '线性回归 · 95% 置信带', unit: '亿元', source: '示例数据 · 演示用' },
      type: 'mlTrend',
      data: {
        labels: trendLabels,
        values: trendLabels.map(function (_, i) { return round(400 + 62 * i + (r() - 0.5) * 68); })
      }
    };

    // 预测扇面：GDP 增速
    SAMPLES['ml-forecast'] = {
      meta: { title: 'GDP 增速预测 · 扇面图', subtitle: '历史 + 预测区间（50% / 80% / 90%）', unit: '%', source: '示例数据 · 演示用' },
      type: 'mlForecast',
      data: {
        labels: ['2018','2019','2020','2021','2022','2023','2024'],
        values: [6.7, 6.0, 2.2, 8.4, 3.0, 5.2, 5.0],
        horizon: 3,
        forecastLabels: ['2025E','2026E','2027E']
      }
    };

    // K-Means 聚类：行业（三簇）
    r = mulberry32(22);
    var clusterCenters = [{ x: 16, y: 22 }, { x: 6, y: 6 }, { x: -8, y: -16 }];
    var clusterNames = ['电子','电力设备','汽车','机械','化工','医药','计算机','食品','银行','非银','地产','钢铁','有色','军工','传媒'];
    SAMPLES['ml-cluster'] = {
      meta: { title: '行业聚类分析（K-Means）', subtitle: '营收增速(%) × 净利润增速(%) · 自动分 3 簇', unit: '', source: '示例数据 · 演示用' },
      type: 'mlCluster',
      data: {
        xName: '营收增速(%)', yName: '净利润增速(%)', k: 3,
        data: clusterNames.map(function (nm, i) {
          var c = clusterCenters[Math.floor(i / 5)];
          return { name: nm, x: round(c.x + (r() - 0.5) * 8), y: round(c.y + (r() - 0.5) * 10) };
        })
      }
    };

    // 相关性矩阵：全球资产月度收益（共同因子 → 正相关）
    r = mulberry32(33);
    var corrNames = ['沪深300','标普500','纳斯达克','恒生指数','日经225','德国DAX','黄金','原油'];
    SAMPLES['ml-corr'] = {
      meta: { title: '全球资产相关性矩阵', subtitle: '月度收益率 · Pearson 相关系数', unit: '', source: '示例数据 · 演示用' },
      type: 'mlCorr',
      data: {
        series: corrNames.map(function (nm, idx) {
          var values = [];
          var beta = (nm === '黄金' || nm === '原油') ? 0.35 : 0.85; // 商品与股票相关性更低
          for (var m = 0; m < 36; m++) {
            var common = (r() - 0.5) * 0.06;
            var idio = (r() - 0.5) * 0.045;
            values.push(Math.round((beta * common + idio) * 10000) / 10000);
          }
          return { name: nm, values: values };
        })
      }
    };

    // 收益分布：日收益率（近似正态 + 肥尾）
    r = mulberry32(44);
    var distValues = [];
    for (var d = 0; d < 320; d++) {
      var v = (r() + r() + r() - 1.5) / 1.5 * 0.028;
      if (r() < 0.06) v += (r() - 0.5) * 0.12;
      distValues.push(Math.round(v * 10000) / 10000);
    }
    SAMPLES['ml-dist'] = {
      meta: { title: '收益率分布', subtitle: '直方图 + 核密度估计（KDE）', unit: '日收益率', source: '示例数据 · 演示用' },
      type: 'mlDist',
      data: { values: distValues }
    };
  })();

  /* ============================================================
   * 新增模版示例数据
   * ============================================================ */
  (function () {
    var r;

    // 堆叠柱状：社融月度（按年对比）
    SAMPLES['macro-sheirong-stack'] = {
      meta: { title: '社会融资规模 · 月度对比', subtitle: '按年份堆叠 · 万亿元', unit: '万亿元', source: '示例数据 · 演示用' },
      type: 'stackedBar',
      data: {
        labels: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'],
        series: [
          { name: '2022', values: [6.2,1.2,4.7,0.9,2.8,5.2,0.8,2.4,3.5,1.5,2.0,1.3] },
          { name: '2023', values: [6.0,3.2,5.4,1.2,1.6,4.2,0.5,3.1,4.1,1.8,2.5,1.9] },
          { name: '2024', values: [6.5,1.5,4.9,0.7,2.1,3.3,0.8,3.0,3.8,1.4,2.3,2.8] }
        ]
      }
    };

    // 雷达图：PMI 分项对比
    SAMPLES['macro-pmi-radar'] = {
      meta: { title: '制造业 PMI 分项对比', subtitle: '2024 年 vs 2023 年 · 景气度（%）', unit: '', source: '示例数据 · 演示用' },
      type: 'radar',
      data: {
        indicators: [
          { name: '生产', max: 60 }, { name: '新订单', max: 60 },
          { name: '原材料库存', max: 60 }, { name: '从业人员', max: 60 },
          { name: '供应商配送时间', max: 60 }, { name: '新出口订单', max: 60 }
        ],
        series: [
          { name: '2024年', values: [52.1, 51.3, 48.9, 49.2, 50.6, 49.8] },
          { name: '2023年', values: [50.5, 49.8, 47.9, 48.5, 50.2, 48.6] }
        ]
      }
    };

    // 基金业绩评估：净值曲线（确定性随机游走）
    r = mulberry32(55);
    var nav = [], bench = [], v = 1.0, b = 1.0;
    var d0 = new Date('2024-01-01');
    for (var i = 0; i < 520; i++) {
      v *= (1 + 0.0004 + (r() - 0.5) * 0.013);
      b *= (1 + 0.0002 + (r() - 0.5) * 0.011);
      var ds = d0.toISOString().slice(0, 10);
      nav.push({ date: ds, value: Math.round(v * 1000) / 1000 });
      bench.push({ date: ds, value: Math.round(b * 1000) / 1000 });
      d0.setDate(d0.getDate() + 1);
    }
    SAMPLES['fund-perf'] = {
      meta: { title: '基金净值与业绩评估', subtitle: '净值 + 回撤 · 指标随缩放区间更新', unit: '净值', source: '示例数据 · 演示用' },
      type: 'perf',
      data: { name: '示例成长基金', nav: nav, bench: bench }
    };

    // 世界地图：全球 GDP 增速着色
    SAMPLES['macro-world-map'] = {
      meta: { title: '全球 GDP 增速地图', subtitle: '2024 年 · 实际同比（%）', unit: '%', source: '示例数据 · 演示用' },
      type: 'worldMap',
      data: { values: [
        { name: 'China', value: 5.0 }, { name: 'United States', value: 2.8 },
        { name: 'Japan', value: 0.8 }, { name: 'Germany', value: 0.1 },
        { name: 'India', value: 6.8 }, { name: 'Brazil', value: 3.2 },
        { name: 'Russia', value: 3.6 }, { name: 'United Kingdom', value: 0.9 },
        { name: 'France', value: 1.1 }, { name: 'Canada', value: 1.3 },
        { name: 'Australia', value: 1.4 }, { name: 'Korea', value: 2.2 },
        { name: 'Mexico', value: 2.4 }, { name: 'Italy', value: 0.7 },
        { name: 'Spain', value: 2.5 }, { name: 'Indonesia', value: 5.0 },
        { name: 'Saudi Arabia', value: 1.8 }, { name: 'South Africa', value: 1.1 },
        { name: 'Turkey', value: 3.5 }, { name: 'Argentina', value: -2.5 }
      ] }
    };

    // 国家分组对比（G7 / 新兴市场 / 欧元区）
    SAMPLES['macro-country-groups'] = {
      meta: { title: '主要经济体分组对比', subtitle: 'GDP 同比增速 · 按组聚合', unit: '%', source: '示例数据 · 演示用' },
      type: 'line',
      data: {
        labels: ['2016','2017','2018','2019','2020','2021','2022','2023','2024'],
        series: [
          { name: 'G7', values: [1.7, 2.3, 2.2, 1.6, -4.6, 5.1, 2.4, 1.8, 1.6] },
          { name: '新兴市场', values: [4.3, 4.8, 4.5, 3.7, -2.2, 6.3, 3.9, 4.2, 4.1] },
          { name: '欧元区', values: [1.8, 2.5, 1.8, 1.5, -6.2, 5.3, 3.4, 0.5, 0.8] }
        ]
      }
    };

    // 关联探索：宏观指标散点矩阵
    r = mulberry32(77);
    function genMacro(base, vol) {
      var a = []; var x = base;
      for (var i = 0; i < 40; i++) { x = x + (r() - 0.5) * vol; a.push(Math.round(x * 100) / 100); }
      return a;
    }
    SAMPLES['macro-corr-explore'] = {
      meta: { title: '宏观指标关联探索', subtitle: '散点图矩阵 · 相似趋势与相关系数', unit: '', source: '示例数据 · 演示用' },
      type: 'scatterMatrix',
      data: {
        series: [
          { name: 'GDP增速', values: genMacro(5.0, 1.2) },
          { name: 'CPI', values: genMacro(2.0, 0.8) },
          { name: 'M2增速', values: genMacro(9.0, 1.5) },
          { name: '社融增速', values: genMacro(8.0, 2.0) }
        ]
      }
    };
    // 内置指标库：CPI / M2 / PMI 月度
    SAMPLES['macro-cpi'] = {
      meta: { title: '居民消费价格指数 CPI', subtitle: '月度 · 同比（%）', unit: '%', source: '示例数据 · 演示用' },
      type: 'line',
      data: {
        labels: ['2023-01','2023-03','2023-05','2023-07','2023-09','2023-11','2024-01','2024-03','2024-05','2024-07','2024-09','2024-11'],
        series: [{ name: 'CPI同比', values: [2.1, 0.7, 0.2, -0.3, 0.0, -0.5, -0.8, 0.1, 0.3, 0.5, 0.4, 0.2] }]
      }
    };
    SAMPLES['macro-m2'] = {
      meta: { title: '广义货币供应量 M2', subtitle: '月度 · 同比（%）', unit: '%', source: '示例数据 · 演示用' },
      type: 'line',
      data: {
        labels: ['2023-01','2023-03','2023-05','2023-07','2023-09','2023-11','2024-01','2024-03','2024-05','2024-07','2024-09','2024-11'],
        series: [{ name: 'M2同比', values: [12.6, 12.7, 11.6, 10.7, 10.3, 10.0, 8.7, 8.3, 7.0, 6.3, 6.8, 7.3] }]
      }
    };
    SAMPLES['macro-pmi-monthly'] = {
      meta: { title: '制造业 PMI 走势', subtitle: '月度 · 荣枯线 50', unit: '', source: '示例数据 · 演示用' },
      type: 'line',
      data: {
        labels: ['2023-01','2023-03','2023-05','2023-07','2023-09','2023-11','2024-01','2024-03','2024-05','2024-07','2024-09','2024-11'],
        series: [
          { name: '制造业PMI', values: [50.1, 51.9, 48.8, 49.3, 50.2, 49.4, 49.2, 50.8, 49.5, 49.4, 49.8, 50.3] },
          { name: '新订单', values: [50.9, 53.6, 48.3, 49.5, 50.5, 49.4, 49.0, 53.0, 49.6, 49.3, 49.9, 50.8] }
        ]
      }
    };
  })();

  var PRICE_SAMPLE = {
    meta: { title: '示例科技股 · 日 K', subtitle: '日线 · 前复权 · 元', unit: '元', source: '示例数据 · 合成演示' },
    type: 'candlestick',
    data: { ohlc: genOHLC(180, 45.6, '2024-04-01', 20260401) }
  };
  SAMPLES['price-candlestick'] = PRICE_SAMPLE;

  /* ---------- CSV 解析（支持引号、换行、表头） ---------- */
  function parseCSV(text) {
    var rows = [];
    var row = [];
    var cur = '';
    var inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { cur += '"'; i++; }
          else inQuotes = false;
        } else cur += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(cur); cur = ''; }
        else if (c === '\n' || c === '\r') {
          if (c === '\r' && text[i + 1] === '\n') i++;
          row.push(cur); cur = '';
          if (row.some(function (x) { return x.trim() !== ''; })) rows.push(row);
          row = [];
        } else cur += c;
      }
    }
    if (cur !== '' || row.length) { row.push(cur); if (row.some(function (x) { return x.trim() !== ''; })) rows.push(row); }

    if (!rows.length) return { columns: [], rows: [] };

    var columns = rows[0].map(function (h) { return (h || '').trim(); });
    var dataRows = rows.slice(1).filter(function (r) { return r.some(function (x) { return String(x).trim() !== ''; }); });
    var objects = dataRows.map(function (r) {
      var o = {};
      columns.forEach(function (col, idx) { o[col] = r[idx] === undefined ? '' : r[idx]; });
      return o;
    });
    return toTable(columns, objects);
  }

  /* ---------- JSON 解析 ---------- */
  function parseJSON(text) {
    var obj = JSON.parse(text);
    if (Array.isArray(obj)) {
      var columns = Object.keys(obj[0] || {});
      return toTable(columns, obj);
    }
    // 对象：尝试直接作为图表配置 {labels, series} 或 {data:[...]}
    if (obj && Array.isArray(obj.data)) {
      return { raw: obj };
    }
    if (obj && Array.isArray(obj.series)) {
      return { raw: obj };
    }
    throw new Error('无法识别的 JSON 结构');
  }

  /* ---------- Excel 解析（异步） ---------- */
  function aoaToTable(aoa) {
    if (!aoa.length) return null;
    var columns = aoa[0].map(function (h, i) { var s = String(h || '').trim(); return s || ('列' + (i + 1)); });
    var objects = aoa.slice(1).filter(function (r) { return r.some(function (x) { return String(x) !== ''; }); })
      .map(function (r) {
        var o = {};
        columns.forEach(function (col, idx) { o[col] = r[idx] === undefined ? '' : r[idx]; });
        return o;
      });
    return toTable(columns, objects);
  }

  function cellOf(row, i) {
    return (row && row[i] !== undefined && row[i] !== null) ? row[i] : '';
  }

  /* 智能解析单块：跳过标题行/元数据行，定位真实表头与数据区 */
  function smartBlockToTable(aoa) {
    var rows = aoa.filter(function (r) { return r && r.some(function (c) { return String(c).trim() !== ''; }); });
    if (rows.length < 2) return null;
    var ncols = Math.max.apply(null, rows.map(function (r) { return r.length; }));

    function numCount(row) {
      var c = 0;
      for (var i = 0; i < row.length; i++) { if (String(cellOf(row, i)).trim() !== '' && !isNaN(toNum(cellOf(row, i)))) c++; }
      return c;
    }
    function dateCount(row) {
      var c = 0;
      for (var i = 0; i < row.length; i++) { if (isDateString(String(cellOf(row, i)))) c++; }
      return c;
    }
    function nonEmpty(row) { return row.filter(function (c) { return String(c).trim() !== ''; }).length; }
    function textCount(row) {
      var c = 0;
      for (var i = 0; i < row.length; i++) { if (String(cellOf(row, i)).trim() !== '' && isNaN(toNum(cellOf(row, i)))) c++; }
      return c;
    }

    // 表头行：优先选"文本（非数值）单元格多"的行，其次选非空最多的行
    var headerIdx = -1, bestTxt = -1, bestNe = -1, bestNeIdx = -1;
    for (var i = 0; i < Math.min(rows.length, 15); i++) {
      var tc = textCount(rows[i]);
      var ne = nonEmpty(rows[i]);
      if (ne > bestNe) { bestNe = ne; bestNeIdx = i; }
      if (tc > bestTxt) { bestTxt = tc; headerIdx = i; }
    }
    if (headerIdx < 0 || bestTxt === 0) headerIdx = bestNeIdx;
    // 数据起始行：表头之后第一个"至少 2 个数值单元格"的行（跳过元数据/分组行）
    var dataStart = -1;
    for (i = headerIdx + 1; i < rows.length; i++) { if (numCount(rows[i]) >= 2) { dataStart = i; break; } }
    if (dataStart < 0) {
      for (i = headerIdx + 1; i < rows.length; i++) { if (numCount(rows[i]) >= 1) { dataStart = i; break; } }
    }
    if (dataStart < 0) dataStart = headerIdx + 1;
    if (dataStart > rows.length) return aoaToTable(aoa);

    // 列名
    var headerRow = headerIdx >= 0 ? rows[headerIdx] : null;
    var columns = [];
    for (i = 0; i < ncols; i++) {
      var v = headerRow ? String(cellOf(headerRow, i)).trim() : '';
      columns.push(v || ('列' + (i + 1)));
    }

    // 数据行：从 dataStart 起，保留含数值或日期的行（排除"单位/频度/来源/更新时间"等元数据行）
    var META_KEYS = /^(指标名称|指标|频度|频率|单位|来源|数据来源|更新时间|更新日期|名称|统计口径|备注)$/;
    var dataAO = rows.slice(dataStart).filter(function (r) {
      var first = String(cellOf(r, 0)).trim();
      if (first === '') return false; // 跳过无首列标签的代码/子表头行
      if (META_KEYS.test(first)) return false;
      return numCount(r) >= 1 || dateCount(r) >= 1;
    });
    var objects = dataAO.map(function (r) {
      var o = {};
      for (var k = 0; k < ncols; k++) o[columns[k]] = cellOf(r, k);
      return o;
    });

    // 识别时间列并转换 Excel 日期序列号（如 46295 → 2026-09-28）
    var tcol = findTimeColumn(columns, objects);
    if (tcol) {
      convertSerialTime({ columns: columns, rows: objects }, { timeCol: tcol });
      if (!isTimeNameHeader(tcol)) {
        var renamed = '日期', k2 = 1;
        while (columns.indexOf(renamed) >= 0) { renamed = '日期' + (k2++); }
        if (tcol !== renamed) {
          objects.forEach(function (o) { o[renamed] = o[tcol]; delete o[tcol]; });
          columns[columns.indexOf(tcol)] = renamed;
        }
      }
    }

    return toTable(columns, objects);
  }

  /* 按空行把单个工作表拆成多块（支持"一表多数据"） */
  function splitBlocks(aoa) {
    var blocks = [], cur = [];
    aoa.forEach(function (row) {
      var empty = !row || row.every(function (c) { return String(c).trim() === ''; });
      if (empty) { if (cur.length) { blocks.push(cur); cur = []; } }
      else cur.push(row);
    });
    if (cur.length) blocks.push(cur);
    return blocks;
  }

  /* 读取整个工作簿，返回所有数据表（含跨工作表、单表多块） */
  function readExcelAll(arrayBuffer) {
    var wb = global.XLSX.read(arrayBuffer, { type: 'array' });
    var datasets = [];
    wb.SheetNames.forEach(function (sheetName) {
      var ws = wb.Sheets[sheetName];
      var aoa = global.XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      var blocks = splitBlocks(aoa);
      var valid = 0;
      blocks.forEach(function (block) {
        if (block.length < 2) return;
        var table = smartBlockToTable(block);
        if (!table || !table.rows.length) return;
        table = maybeTranspose(table);
        valid++;
        var det = detectTable(table);
        var name = blocks.filter(function (b) { return b.length >= 2; }).length > 1
          ? (sheetName + ' · 表' + valid) : sheetName;
        datasets.push({ name: name, sheet: sheetName, columns: table.columns, rows: table.rows, table: table, detection: det });
      });
    });
    return datasets;
  }

  /* 单表读取（向后兼容） */
  function readExcel(arrayBuffer) {
    var datasets = readExcelAll(arrayBuffer);
    return datasets.length ? datasets[0].table : { columns: [], rows: [] };
  }

  /* 依据识别结果给出图表类型建议 */
  function suggestType(det) {
    if (det.ohlc) return 'candlestick';
    if (det.isTimeSeries && det.numericCols.length) return 'area';
    if (det.numericCols.length) return 'bar';
    return 'table';
  }

  /* ---------- 统一表格化 + 列识别 ---------- */
  function toTable(columns, rows) {
    return { columns: columns, rows: rows };
  }

  function isDateString(s) {
    if (typeof s !== 'string') return false;
    s = s.trim();
    var Y = '(?:19|20)\\d{2}'; // 年份限定 1900-2099，避免把指数点位(如1003.63)误判为日期
    return new RegExp('^' + Y + '$').test(s)
      || new RegExp('^' + Y + '[-/.]\\d{1,2}([-/.]\\d{1,2})?$').test(s)
      || new RegExp(Y + '[-/.]?Q[1-4]', 'i').test(s)
      || new RegExp('Q[1-4][-/.]?\\s?' + Y, 'i').test(s)
      || new RegExp(Y + '[-/.]?H[1-2]', 'i').test(s)
      || new RegExp('^' + Y + '年').test(s)
      || /^\d{1,2}月$/.test(s)
      || new RegExp('^' + Y + '年\\d{1,2}月').test(s);
  }

  /* 转置表：指标在行、时间（月份/日期）在列 → 转成时间在行、指标在列 */
  function transposeTable(table) {
    if (!table || !table.columns || !table.rows || table.rows.length < 2) return table;
    var labelCol = table.columns[0];
    var numericCols = table.columns.filter(function (c) {
      if (c === labelCol) return false;
      var n = 0, num = 0;
      table.rows.slice(0, 30).forEach(function (r) { var v = r[c]; if (String(v).trim() !== '') { n++; if (!isNaN(toNum(v))) num++; } });
      return n > 0 && num / n > 0.6;
    });
    if (!numericCols.length) return table;
    var indicatorNames = table.rows.map(function (r) { return String(r[labelCol]).trim(); });
    var newColumns = ['时间'].concat(indicatorNames);
    var newRows = numericCols.map(function (col) {
      var o = {}; o['时间'] = col;
      table.rows.forEach(function (r, ri) { o[indicatorNames[ri]] = r[col]; });
      return o;
    });
    return toTable(newColumns, newRows);
  }

  /* 判断是否转置表：表头含多个日期/月份列，且首列为文本分类 */
  function maybeTranspose(table) {
    if (!table || !table.columns || !table.rows || table.rows.length < 2) return table;
    var dateHeaders = table.columns.filter(function (c) { return isDateString(c); });
    if (dateHeaders.length < 3) return table;
    var firstCol = table.columns[0];
    var firstText = true;
    table.rows.slice(0, 20).forEach(function (r) {
      var v = r[firstCol];
      if (String(v).trim() === '') return;
      if (isDateString(String(v)) || !isNaN(toNum(v))) firstText = false;
    });
    return firstText ? transposeTable(table) : table;
  }
  function toNum(v) {
    if (typeof v === 'number') return v;
    if (v === null || v === undefined) return NaN;
    var s = String(v).trim();
    if (s === '' || s === '-' || s === '--' || s === '—' || s === 'N/A' || s === 'NA') return NaN;
    s = s.replace(/[,%\s]/g, '');
    if (s === '') return NaN; // 去掉 %、逗号等后为空 → 不是数字
    var n = Number(s);
    return isNaN(n) ? NaN : n;
  }

  /* ---------- Excel 日期序列号 / 时间列识别 / 时间排序 ---------- */
  var TIME_HEADER_RE = /(日期|date|时间|time|期间|period|year|年份|月份|年月)/i;

  function isTimeNameHeader(name) { return TIME_HEADER_RE.test(String(name)); }

  /* Excel 日期序列号：1900-01-01 记为 1，约 20000~80000 对应 1954~2119 年 */
  function isExcelSerial(v) {
    var n = toNum(v);
    if (isNaN(n) || n !== Math.floor(n)) return false;
    return n >= 10000 && n <= 80000;
  }

  function serialToDateStr(serial) {
    var ms = Date.UTC(1899, 11, 30) + serial * 86400000;
    var d = new Date(ms);
    var y = d.getUTCFullYear(), m = d.getUTCMonth() + 1, day = d.getUTCDate();
    return y + '-' + (m < 10 ? '0' : '') + m + '-' + (day < 10 ? '0' : '') + day;
  }

  function isDateLike(v) {
    if (v instanceof Date) return true;
    if (isDateString(String(v))) return true;
    if (isExcelSerial(v)) return true;
    return false;
  }

  function valueToDateStr(v) {
    if (v instanceof Date) {
      var y = v.getFullYear(), m = v.getMonth() + 1, d = v.getDate();
      return y + '-' + (m < 10 ? '0' : '') + m + '-' + (d < 10 ? '0' : '') + d;
    }
    if (isExcelSerial(v)) return serialToDateStr(toNum(v));
    return String(v);
  }

  /* 找出最可能是时间列的列：日期字符串 / Excel序列号 */
  function findTimeColumn(columns, rows) {
    var sample = rows.slice(0, 40);
    var cand = columns.map(function (c) {
      var n = 0, d = 0, s = 0;
      sample.forEach(function (r) {
        var v = r[c];
        if (String(v).trim() === '') return;
        n++;
        if (v instanceof Date || isDateString(String(v))) d++;
        else if (isExcelSerial(v)) s++;
      });
      return { col: c, n: n, dateRatio: n ? d / n : 0, serialRatio: n ? s / n : 0, headerTime: isTimeNameHeader(c) };
    });
    // 1) 真正的日期字符串列
    var strings = cand.filter(function (x) { return x.dateRatio >= 0.5; });
    if (strings.length) {
      strings.sort(function (a, b) { return b.dateRatio - a.dateRatio || (Number(b.headerTime) - Number(a.headerTime)); });
      return strings[0].col;
    }
    // 2) 表头含时间关键字 + Excel 序列号
    var serialHeader = cand.filter(function (x) { return x.headerTime && x.serialRatio >= 0.5; });
    if (serialHeader.length) return serialHeader[0].col;
    // 3) 首列纯序列号
    var serialOnly = cand.filter(function (x) { return x.serialRatio >= 0.5; });
    if (serialOnly.length && serialOnly[0].col === columns[0]) return serialOnly[0].col;
    return null;
  }

  /* 把时间列的 Excel 序列号转换为日期字符串 */
  function convertSerialTime(table, det) {
    if (!table || !det || !det.timeCol || !table.columns || table.columns.indexOf(det.timeCol) < 0) return table;
    var col = det.timeCol;
    var sample = table.rows.slice(0, 40);
    var nonEmpty = 0, serialCount = 0;
    sample.forEach(function (r) {
      var v = r[col];
      if (String(v).trim() === '') return;
      nonEmpty++;
      if (isExcelSerial(v)) serialCount++;
    });
    if (!nonEmpty || serialCount / nonEmpty < 0.5) return table;
    table.rows.forEach(function (r) {
      if (isExcelSerial(r[col])) r[col] = serialToDateStr(toNum(r[col]));
      else if (r[col] instanceof Date) r[col] = valueToDateStr(r[col]);
    });
    return table;
  }

  function parseTimeKey(v) {
    if (v instanceof Date) return v.getTime();
    var s = String(v).trim();
    if (!s) return null;
    if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) return Date.parse(s.replace(/\//g, '-').slice(0, 10));
    var m = s.match(/^(\d{4})[-/.](\d{1,2})$/);
    if (m) return Date.parse(m[1] + '-' + (m[2].length < 2 ? '0' : '') + m[2] + '-01');
    m = s.match(/^(\d{4})[-/.]?Q([1-4])$/i); if (m) return Number(m[1]) * 4 + Number(m[2]);
    m = s.match(/^Q([1-4])[-\s.]*(\d{4})$/i); if (m) return Number(m[2]) * 4 + Number(m[1]);
    m = s.match(/^(\d{4})[-/.]?H([1-2])$/i); if (m) return Number(m[1]) * 4 + Number(m[2]) * 2;
    m = s.match(/^(\d{4})$/); if (m) return Number(m[1]) * 4;
    m = s.match(/^(\d{4})年/); if (m) return Number(m[1]) * 4;
    return null;
  }

  /* 按时间升序排序（最新在最后/最右），非时间列原样返回 */
  function sortRowsByTime(rows, timeCol) {
    if (!timeCol || !rows || !rows.length) return rows;
    var keyed = rows.map(function (r, i) { return { r: r, i: i, k: parseTimeKey(r[timeCol]) }; });
    var withKey = keyed.filter(function (x) { return x.k !== null; });
    if (withKey.length < rows.length * 0.5) return rows;
    keyed.sort(function (a, b) {
      if (a.k === null && b.k === null) return a.i - b.i;
      if (a.k === null) return 1;
      if (b.k === null) return -1;
      return a.k - b.k;
    });
    return keyed.map(function (x) { return x.r; });
  }

  function detectTable(table) {
    if (!table || !table.columns || !table.rows || !table.rows.length) return null;
    var columns = table.columns;
    var sample = table.rows.slice(0, 30);
    var found = findTimeColumn(columns, table.rows);
    var timeCol = found || columns[0];
    var isTimeSeries = false;
    if (found) {
      var n = 0, d = 0;
      sample.forEach(function (r) { var v = r[timeCol]; if (String(v).trim() !== '') { n++; if (isDateLike(v)) d++; } });
      isTimeSeries = n > 0 && d / n >= 0.5;
    }
    // 数值列：数值占比 >0.7（排除时间列）
    var numericCols = columns.filter(function (c) {
      if (c === timeCol) return false;
      var nonNull = 0, num = 0;
      sample.forEach(function (r) { if (String(r[c]).trim() !== '') { nonNull++; if (!isNaN(toNum(r[c]))) num++; } });
      return nonNull > 0 && num / nonNull > 0.7;
    });
    var lower = columns.map(function (c) { return c.toLowerCase(); });
    function has(keys) { return keys.some(function (k) { return lower.indexOf(k) >= 0; }); }
    var ohlc = null;
    if (has(['open']) && has(['high']) && has(['low']) && has(['close'])) {
      ohlc = { time: timeCol, open: 'open', high: 'high', low: 'low', close: 'close',
               volume: has(['volume', 'vol']) ? (columns[lower.indexOf('volume') >= 0 ? lower.indexOf('volume') : lower.indexOf('vol')]) : null };
    }
    return { timeCol: timeCol, numericCols: numericCols, ohlc: ohlc, isTimeSeries: isTimeSeries,
             orientation: (numericCols.length > table.rows.length) ? 'wide' : 'long' };
  }

  /* ---------- 宏观数据变换：变频 / 同比 / 环比 / 累计 / 自定义公式 ---------- */
  function avg(a) { return a.length ? a.reduce(function (x, y) { return x + y; }, 0) / a.length : 0; }

  function inferFreq(labels) {
    if (!labels || !labels.length) return null;
    var s = String(labels[0]).trim();
    if (/^\d{4}$/.test(s) || /^\d{4}年$/.test(s)) return 'year';
    if (/Q[1-4](\s|$)/i.test(s) || /\d{4}Q[1-4]/i.test(s)) return 'quarter';
    if (/^\d{4}[-/.]\d{1,2}$/.test(s)) return 'month';
    // YYYY-MM-DD：用相邻时间点间隔判断 日频/月频(月末)/季频(季末)
    var times = [];
    for (var i = 0; i < labels.length && times.length < 8; i++) {
      var t = parseTimeKey(labels[i]);
      if (t) times.push(t);
    }
    if (times.length < 2) return 'day';
    var gaps = [];
    for (var j = 1; j < times.length; j++) gaps.push(times[j] - times[j - 1]);
    gaps.sort(function (a, b) { return a - b; });
    var med = gaps[Math.floor(gaps.length / 2)];
    var day = 86400000;
    if (med < 2 * day) return 'day';
    if (med < 60 * day) return 'month';
    if (med < 200 * day) return 'quarter';
    return 'year';
  }

  function periodKey(label) {
    var s = String(label).trim();
    var m;
    m = s.match(/^(\d{4})[-/.](\d{1,2})/); if (m) return { y: +m[1], m: +m[2] };
    m = s.match(/^(\d{4})Q([1-4])$/i); if (m) return { y: +m[1], q: +m[2] };
    m = s.match(/^(\d{4})$/); if (m) return { y: +m[1] };
    return null;
  }

  function numericColsOf(table, timeCol) {
    return table.columns.filter(function (c) { return c !== timeCol && !isNaN(toNum(table.rows[0][c])); });
  }

  function buildAgg(table, timeCol, groups, agg) {
    var numericCols = numericColsOf(table, timeCol);
    var out = [];
    Object.keys(groups).sort().forEach(function (k) {
      var rs = groups[k], o = {};
      o[timeCol] = k;
      numericCols.forEach(function (c) {
        var vals = rs.map(function (r) { return toNum(r[c]); }).filter(function (v) { return !isNaN(v); });
        o[c] = round(agg === 'sum' ? vals.reduce(function (a, b) { return a + b; }, 0) : avg(vals));
      });
      out.push(o);
    });
    return toTable([timeCol].concat(numericCols), out);
  }

  function freqToQuarter(table, timeCol, agg) {
    var groups = {};
    table.rows.forEach(function (r) {
      var p = periodKey(r[timeCol]); if (!p) return;
      var q = p.y + 'Q' + Math.ceil((p.m || 1) / 3);
      (groups[q] = groups[q] || []).push(r);
    });
    return buildAgg(table, timeCol, groups, agg);
  }

  function freqToYear(table, timeCol, agg) {
    var groups = {};
    table.rows.forEach(function (r) {
      var p = periodKey(r[timeCol]); if (!p) return;
      (groups[p.y] = groups[p.y] || []).push(r);
    });
    return buildAgg(table, timeCol, groups, agg);
  }

  function pctChange(table, timeCol, lag) {
    var numericCols = numericColsOf(table, timeCol);
    var out = [];
    for (var i = 0; i < table.rows.length; i++) {
      var r = table.rows[i], o = {};
      o[timeCol] = r[timeCol];
      var prev = table.rows[i - lag];
      numericCols.forEach(function (c) {
        var cur = toNum(r[c]);
        if (prev && !isNaN(toNum(prev[c])) && toNum(prev[c]) !== 0) o[c] = round((cur / toNum(prev[c]) - 1) * 100);
        else o[c] = null;
      });
      out.push(o);
    }
    return toTable([timeCol].concat(numericCols), out);
  }

  function cumulative(table, timeCol) {
    var numericCols = numericColsOf(table, timeCol);
    var out = [], sums = {}, curKey = null;
    table.rows.forEach(function (r) {
      var p = periodKey(r[timeCol]);
      var key = p ? p.y : String(r[timeCol]).slice(0, 4);
      if (key !== curKey) { sums = {}; curKey = key; }
      var o = {}; o[timeCol] = r[timeCol];
      numericCols.forEach(function (c) {
        var v = toNum(r[c]);
        sums[c] = (sums[c] || 0) + (isNaN(v) ? 0 : v);
        o[c] = round(sums[c]);
      });
      out.push(o);
    });
    return toTable([timeCol].concat(numericCols), out);
  }

  function evalFormula(expr, row, columns) {
    var sorted = columns.slice().sort(function (a, b) { return b.length - a.length; });
    var s = String(expr);
    sorted.forEach(function (c) { s = s.split(c).join(' __C' + columns.indexOf(c) + '__ '); });
    s = s.replace(/__C(\d+)__/g, function (m, i) { var v = toNum(row[columns[+i]]); return '(' + (isNaN(v) ? 0 : v) + ')'; });
    if (/[^0-9+\-*/().\s]/.test(s)) throw new Error('公式含非法字符');
    var r = Function('"use strict";return (' + s + ');')();
    return (r === null || r === undefined || isNaN(r)) ? null : r;
  }

  function formula(table, timeCol, resultName, expr) {
    var cols = table.columns;
    var out = [];
    table.rows.forEach(function (r) {
      var v = evalFormula(expr, r, cols);
      var o = {};
      cols.forEach(function (c) { o[c] = r[c]; });
      o[resultName] = v === null ? null : round(v);
      out.push(o);
    });
    return toTable(cols.concat([resultName]), out);
  }

  global.DataLoader = {
    SAMPLES: SAMPLES, PRICE_SAMPLE: PRICE_SAMPLE,
    parseCSV: parseCSV, parseJSON: parseJSON, readExcel: readExcel, readExcelAll: readExcelAll,
    detectTable: detectTable, suggestType: suggestType, toNum: toNum, isDateString: isDateString,
    convertSerialTime: convertSerialTime, sortRowsByTime: sortRowsByTime,
    transposeTable: transposeTable, maybeTranspose: maybeTranspose,
    isExcelSerial: isExcelSerial, parseTimeKey: parseTimeKey,
    inferFreq: inferFreq, freqToQuarter: freqToQuarter, freqToYear: freqToYear,
    pctChange: pctChange, cumulative: cumulative, formula: formula
  };
})(window);
