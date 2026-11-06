/* ============================================================
 * 主应用 — 导航、渲染调度、主题切换、数据导入、导出
 * ============================================================ */
(function () {
  'use strict';

  var el = function (id) { return document.getElementById(id); };
  var toNum = DataLoader.toNum;

  /* 简洁 SVG 图标（stroke 风格，随主题着色） */
  function svgIcon(path, size) {
    return '<svg viewBox="0 0 24 24" width="' + (size || 15) + '" height="' + (size || 15) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }
  var ICONS = {
    home: svgIcon('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>'),
    macro: svgIcon('<path d="M6 20v-6M12 20V4M18 20v-9"/>'),
    examples: svgIcon('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>'),
    caret: svgIcon('<path d="M9 18l6-6-6-6"/>', 12),
    trend: svgIcon('<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>'),
    perf: svgIcon('<path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/>'),
    kline: svgIcon('<path d="M7 4v3M7 17v3M17 6v3M17 14v3M4 7h6M4 7v3M16 9h6M16 9v3M14 17h6M14 17v3"/>'),
    ml: svgIcon('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>'),
    macro: svgIcon('<path d="M19 5L5 19"/><circle cx="7" cy="7" r="2"/><circle cx="17" cy="17" r="2"/>'),
    globe: svgIcon('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18a14 14 0 0 1 0-18"/>')
  };

  var GOALS = [
    { id: 'trend', label: '趋势图', desc: '时间序列', icon: ICONS.trend },
    { id: 'perf', label: '业绩评估', desc: '收益/波动/回撤', icon: ICONS.perf },
    { id: 'ml', label: '机器学习', desc: '回归/预测', icon: ICONS.ml },
    { id: 'macro', label: '宏观分析', desc: '同比/环比', icon: ICONS.macro }
  ];

  var TEMPLATES = [
    { category: '宏观数据', items: [
      { id: 'macro-gdp-area', label: '渐变面积 · GDP 增速' },
      { id: 'macro-dual', label: '双轴组合 · 社零总额' },
      { id: 'macro-step', label: '阶梯线 · 政策利率' },
      { id: 'macro-heatmap', label: '热力矩阵 · 全球增速' },
      { id: 'macro-sheirong-stack', label: '季节性折线 · 社融近4年' },
      { id: 'macro-pmi-radar', label: '雷达图 · 宏观景气13项' },
      { id: 'macro-world-map', label: '世界地图 · 通胀着色' },
      { id: 'macro-corr-explore', label: '关联探索 · 散点矩阵' }
    ]},
    { category: '行业数据', items: [
      { id: 'industry-rank', label: '横向排名 · 行业涨幅榜' },
      { id: 'industry-bubble', label: '气泡矩阵 · 行业景气' },
      { id: 'industry-treemap', label: '板块热力 · 行业市值' },
      { id: 'industry-stacked', label: '堆叠面积 · 社融结构' }
    ]},
    { category: '公司财务', items: [
      { id: 'fin-waterfall', label: '瀑布图 · 茅台营收桥接' },
      { id: 'fin-combo', label: '双轴组合 · 营收与净利率' },
      { id: 'fin-donut', label: '环形图 · 收入结构' },
      { id: 'fin-sankey', label: '桑基图 · 收入流向' },
      { id: 'fin-kpi', label: '指标卡 · 经营概览' }
    ]},
    { category: '金融资产', items: [
      { id: 'fund-perf', label: '资产净值 · 沪深300' },
      { id: 'asset-rank', label: '全球股指 · 近一年涨幅' },
      { id: 'asset-heat', label: '股指收益 · 年度热力' }
    ]},
    { category: '机器学习', items: [
      { id: 'ml-trend', label: '回归趋势 · 置信带' },
      { id: 'ml-forecast', label: '时间序列预测 · 扇面' },
      { id: 'ml-cluster', label: 'K-Means 聚类' },
      { id: 'ml-corr', label: '相关性矩阵' },
      { id: 'ml-dist', label: '收益分布 · KDE' }
    ]}
  ];

  /* 宏观图事件标注（竖线 + 标签 + 详细说明） */
  var EVENTS = {
    'macro-gdp-area': [
      { x: '2020Q1', label: '疫情冲击', desc: '新冠疫情爆发，经济活动停摆，GDP 同比增速骤降至 -6.8%。' },
      { x: '2021Q1', label: '低基数复苏', desc: '低基数叠加复工复产，GDP 同比增速反弹至 18.3%。' }
    ],
    'macro-dual': [
      { x: '2023-11', label: '促销旺季', desc: '双十一等电商大促拉动社零总额同比明显回升。' },
      { x: '2024-01', label: '春节错位', desc: '春节假期错位导致 1 月社零同比读数阶段性波动。' }
    ],
    'macro-step': [
      { x: '2022-01', label: '降息周期', desc: '央行开启降息周期，1 年期 LPR 下调。' },
      { x: '2024-10', label: '大幅降息', desc: '逆周期调节力度加大，LPR 进一步下调至 3.10%。' }
    ]
  };

  var state = {
    theme: 'midnight-gold',
    currentTemplate: 'macro-gdp-area',
    mode: 'template',
    isImported: false,
    showEvents: true,
    showWatermark: true,
    annotateMode: false,
    tableView: false,
    transposed: false,
    labelMode: 'off',
    seriesColors: {},
    overrideType: null,
    annotations: {},
    customTitles: {},
    viewKey: 'tpl:macro-gdp-area',
    priceEl: null, echartsEl: null, priceInsts: [],
    table: null, det: null,
    dataset: null, datasets: null, dashboardDatasets: null,
    mapping: { timeCol: '', yCols: [], chartType: 'line' },
    uploadedTable: null, overlaySeries: [], _indicatorOptions: null, macroItem: null, finItem: null, intlItem: null, chartConfig: null, exploreConfig: null, lastChart: null, timeRange: 'all', alignToMain: true, macroTypeOverride: null, analysisGoal: 'trend'
  };

  function vnum(v) { var n = toNum(v); return isNaN(n) ? null : n; }

  /* 时间轴裁剪：按所有系列中有数据的范围 [最早, 最晚] 裁剪 */
  function trimToDataRange(labels, series) {
    var n = labels.length, first = n, last = -1;
    series.forEach(function (s) {
      s.values.forEach(function (v, i) {
        if (v !== null && v !== undefined && !isNaN(v)) {
          if (i < first) first = i;
          if (i > last) last = i;
        }
      });
    });
    if (first > last || first === 0 && last === n - 1) return { labels: labels, series: series };
    return {
      labels: labels.slice(first, last + 1),
      series: series.map(function (s) { return { name: s.name, values: s.values.slice(first, last + 1) }; })
    };
  }

  /* 时间区间裁剪：近1年/近5年/近10年/全部 */
  function applyTimeRange(labels, series) {
    if (!state.timeRange || state.timeRange === 'all' || !labels || !labels.length) return { labels: labels, series: series };
    var years = { '1y': 1, '5y': 5, '10y': 10 }[state.timeRange];
    if (!years) return { labels: labels, series: series };
    var lastLabel = String(labels[labels.length - 1]);
    var lastY = parseInt(lastLabel.match(/\d{4}/), 10);
    if (isNaN(lastY)) return { labels: labels, series: series };
    var cutoffY = lastY - years + 1;
    var start = 0;
    for (var i = 0; i < labels.length; i++) {
      var ym = String(labels[i]).match(/\d{4}/);
      if (ym && parseInt(ym[0], 10) >= cutoffY) { start = i; break; }
    }
    if (start === 0) return { labels: labels, series: series };
    if (labels.length - start < 3) start = Math.max(0, labels.length - 3);
    return {
      labels: labels.slice(start),
      series: series.map(function (s) { return { name: s.name, values: s.values.slice(start) }; })
    };
  }

  function fmtNum(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  function getChartTheme() { return Themes.active().chart; }

  function currentSeriesNames() {
    if (state.mode === 'imported' || state.mode === 'dataset') return state.mapping.yCols ? state.mapping.yCols.slice() : [];
    if (state.mode === 'template') {
      var s = DataLoader.SAMPLES[state.currentTemplate];
      if (s && s.data) {
        if (s.data.series) return s.data.series.map(function (x) { return x.name; });
        var names = [];
        (s.data.bars || []).forEach(function (b) { names.push(b.name); });
        (s.data.lines || []).forEach(function (l) { names.push(l.name); });
        return names;
      }
    }
    return [];
  }

  function openColorPanel() {
    var names = currentSeriesNames();
    var list = el('color-list');
    list.innerHTML = '';
    if (!names.length) { toast('当前图表无可单独配色的系列'); return; }
    var swatches = Themes.active().chart.series.slice(0, 10); // 主题配色
    names.forEach(function (name) {
      var cur = state.seriesColors[name] || '';
      var row = document.createElement('div');
      row.className = 'color-row';
      var dots = swatches.map(function (c) {
        return '<span class="color-dot' + (c === cur ? ' on' : '') + '" data-name="' + name + '" data-color="' + c + '" style="background:' + c + '"></span>';
      }).join('');
      row.innerHTML =
        '<span class="color-name">' + name + '</span>' +
        '<span class="color-dots">' + dots + '</span>' +
        (cur ? '<button class="btn sm color-reset" data-name="' + name + '">重置</button>' : '');
      list.appendChild(row);
    });
    el('color-overlay').classList.add('open');
  }

  function closeColorPanel() { el('color-overlay').classList.remove('open'); }

  /* 指标增删（从当前数据表里选择要绘制的指标） */
  function openIndicatorPanel() {
    var options = []; // {key, name, labels, values}
    if (state.macroItem) {
      (window.CHINA_MACRO && window.CHINA_MACRO.sections || []).forEach(function (sec) {
        sec.items.forEach(function (item) {
          if (!item.series || !item.series.length) return;
          if (item.title === state.macroItem.title) return;
          options.push({ key: 'macro:' + item.title, name: item.title, labels: item.labels, values: item.series[0].values });
        });
      });
    } else if (state.finItem) {
      (window.FINANCE_DATA && window.FINANCE_DATA.sections || []).forEach(function (sec) {
        sec.items.forEach(function (item) {
          if (!item.series || !item.series.length) return;
          if (item.title === state.finItem.title) return;
          options.push({ key: 'fin:' + item.title, name: item.title, labels: item.labels, values: item.series[0].values });
        });
      });
    } else if (state.intlItem) {
      // 国际宏观：可叠加其他国家指标 + 中国宏观数据对比
      (window.INTL_MACRO && window.INTL_MACRO.sections || []).forEach(function (sec) {
        sec.items.forEach(function (item) {
          if (!item.series || !item.series.length) return;
          if (item.title === state.intlItem.title) return;
          options.push({ key: 'intl:' + item.title, name: item.title, labels: item.labels, values: item.series[0].values });
        });
      });
      (window.CHINA_MACRO && window.CHINA_MACRO.sections || []).forEach(function (sec) {
        sec.items.forEach(function (item) {
          if (!item.series || !item.series.length) return;
          options.push({ key: 'cn:' + item.title, name: '【中国】' + item.title, labels: item.labels, values: item.series[0].values });
        });
      });
    } else if (state.chartConfig) {
      // AI 生成的图：可叠加真实宏观/金融指标
      ['INTL_MACRO', 'CHINA_MACRO', 'FINANCE_DATA'].forEach(function (gname) {
        var D = window[gname];
        ((D && D.sections) || []).forEach(function (sec) {
          (sec.items || []).forEach(function (item) {
            if (!item.series || !item.series.length) return;
            var name = item.title;
            var exists = (state.chartConfig.series || []).some(function (x) { return x.name === name; });
            if (exists) return;
            options.push({ key: 'real:' + gname + ':' + name, name: name, labels: item.labels, values: item.series[0].values });
          });
        });
      });
    } else {
      var table = state.uploadedTable || state.table || (state.dataset && state.dataset.table);
      if (!table) { toast('请先上传数据，再添加指标'); return; }
      var det = DataLoader.detectTable(table);
      var cols = det.numericCols.filter(function (c) { return c !== det.timeCol; });
      cols.forEach(function (col) {
        var s = extractedSeries(table, det.timeCol, col);
        options.push({ key: 'col:' + col, name: col, labels: s.labels, values: s.values });
      });
    }
    if (!options.length) { list = el('indicator-list'); list.innerHTML = '<span class="hint">暂无可添加的指标</span>'; el('indicator-overlay').classList.add('open'); return; }
    state._indicatorOptions = options;
    var list = el('indicator-list');
    list.innerHTML = '';
    options.forEach(function (o) {
      var on = state.overlaySeries.some(function (x) { return x.key === o.key; });
      if (!on && state.mapping.yCols.indexOf(o.name) >= 0) on = true;
      var chip = document.createElement('div');
      chip.className = 'col-chip' + (on ? ' on' : '');
      chip.textContent = o.name;
      chip.dataset.key = o.key;
      list.appendChild(chip);
    });
    el('indicator-overlay').classList.add('open');
  }
  function closeIndicatorPanel() { el('indicator-overlay').classList.remove('open'); }

  function extractedSeries(table, timeCol, col) {
    var labels = [], values = [];
    table.rows.forEach(function (r) { var v = DataLoader.toNum(r[col]); if (!isNaN(v)) { labels.push(String(r[timeCol])); values.push(v); } });
    return { labels: labels, values: values };
  }

  /* 把额外指标叠加到当前图（按日期对齐） */
  function alignSeriesToBase(baseLabels, overlayLabels, overlayValues) {
    var aligned = new Array(baseLabels.length).fill(null);
    var j = 0;
    for (var i = 0; i < baseLabels.length; i++) {
      var target = String(baseLabels[i]);
      while (j < overlayLabels.length && String(overlayLabels[j]) <= target) j++;
      if (j > 0) aligned[i] = overlayValues[j - 1];
    }
    return aligned;
  }

  function mergeOverlaySeries(baseLabels, baseSeries, overlays) {
    if (!overlays || !overlays.length) return { labels: baseLabels, series: baseSeries };
    if (state.alignToMain) {
      // 按主图频率对齐：保留主图标签，叠加序列取"每个主图时间点之前最近的值"
      var alignedSeries = overlays.map(function (o) {
        return { name: o.name, values: alignSeriesToBase(baseLabels, o.labels, o.values) };
      });
      return { labels: baseLabels, series: baseSeries.concat(alignedSeries) };
    }
    var labelSet = {};
    baseLabels.forEach(function (l) { labelSet[l] = true; });
    overlays.forEach(function (o) { o.labels.forEach(function (l) { labelSet[l] = true; }); });
    var union = Object.keys(labelSet).sort();
    var newSeries = baseSeries.map(function (s) {
      var m = {};
      baseLabels.forEach(function (l, i) { m[l] = s.values[i]; });
      return { name: s.name, values: union.map(function (l) { return m[l] !== undefined ? m[l] : null; }) };
    });
    overlays.forEach(function (o) {
      var m = {};
      o.labels.forEach(function (l, i) { m[l] = o.values[i]; });
      newSeries.push({ name: o.name, values: union.map(function (l) { return m[l] !== undefined ? m[l] : null; }) });
    });
    return { labels: union, series: newSeries };
  }
  /* 量级差异大 → 自动双轴折线 */
  function medianAbs(values) {
    var v = values.filter(function (x) { return x !== null && x !== undefined && !isNaN(x) && x !== 0; });
    if (!v.length) return 0;
    v.sort(function (a, b) { return a - b; });
    return Math.abs(v[Math.floor(v.length / 2)]);
  }
  function magnitudeMismatch(series) {
    var stats = series.map(function (s) {
      var v = s.values.filter(function (x) { return x !== null && x !== undefined && !isNaN(x) && x !== 0; });
      if (!v.length) return null;
      v.sort(function (a, b) { return a - b; });
      return { min: v[0], max: v[v.length - 1], median: v[Math.floor(v.length / 2)] };
    }).filter(Boolean);
    if (stats.length < 2) return false;
    // 只有数量级差距很大（>10 倍）才用双轴；同量级（如各国GDP增速）用单轴
    var mags = stats.map(function (s) { return Math.max(Math.abs(s.max), Math.abs(s.min), Math.abs(s.median)); }).filter(function (m) { return m > 0; });
    if (mags.length >= 2) {
      var mx = Math.max.apply(null, mags), mn = Math.min.apply(null, mags);
      if (mx / mn > 10) return true;
    }
    return false;
  }
  function renderAutoDual(c, type, data, theme) {
    if ((type === 'line' || type === 'area') && data && data.series && data.series.length >= 2 && magnitudeMismatch(data.series)) {
      var meds = data.series.map(function (s) { return medianAbs(s.values); });
      var maxIdx = meds.indexOf(Math.max.apply(null, meds));
      var dup = {
        labels: data.labels,
        series: data.series.map(function (s, i) { return { name: s.name, values: s.values, yAxisIndex: (i === maxIdx ? 0 : 1) }; })
      };
      return ChartFactory.render(c, 'dualLine', dup, theme);
    }
    return ChartFactory.render(c, type, data, theme);
  }

  /* ---------- 数据管理（保存/导出/URL 载入） ---------- */
  function openDataPanel() { el('data-overlay').classList.add('open'); }
  function closeDataPanel() { el('data-overlay').classList.remove('open'); }

  function applyRemoteTable(table, title) {
    table = DataLoader.maybeTranspose(table);
    state.table = table;
    var det = DataLoader.detectTable(table);
    state.det = det;
    state.mapping.timeCol = det.timeCol;
    state.mapping.yCols = det.numericCols.filter(function (c) { return c !== det.timeCol; });
    state.mapping.chartType = det.isTimeSeries ? 'area' : 'bar';
    state.isImported = true; state.mode = 'imported'; state.viewKey = 'imported';
    state.customTitles = state.customTitles || {};
    state.customTitles['imported'] = title;
    closeDataPanel();
    renderUserChart(false);
    toast('已加载 ' + table.rows.length + ' 行数据');
  }

  function fetchRemote(url) {
    toast('正在拉取数据…');
    fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (json) {
        if (json && json.observations) {
          var obs = json.observations || [];
          var rows = obs.filter(function (o) { return o.value && o.value !== '.'; })
            .map(function (o) { var r = {}; r['日期'] = o.date; r['数值'] = Number(o.value); return r; });
          applyRemoteTable({ columns: ['日期', '数值'], rows: rows }, (json.series && json.series.title) || '远程数据');
        } else if (Array.isArray(json)) {
          var cols = Object.keys(json[0] || {});
          applyRemoteTable({ columns: cols, rows: json }, '远程数据');
        } else if (json && json.type && (json.labels !== undefined || json.series !== undefined || json.data)) {
          applyChartConfig(json); closeDataPanel();
        } else if (json && json.labels && json.series) {
          applyChartConfig(json); closeDataPanel();
        } else {
          toast('无法识别的数据格式');
        }
      })
      .catch(function (e) { toast('拉取失败：' + e.message + '（file:// 下可能被浏览器拦截，请用线上部署）'); });
  }

  function loadDataUrl() {
    var u = el('data-url').value.trim();
    if (!u) { toast('请输入数据 URL'); return; }
    fetchRemote(u);
  }

  function saveLocal() {
    if (!state.table) { toast('当前没有可保存的数据'); return; }
    try {
      localStorage.setItem('afgData', JSON.stringify({ table: state.table, title: el('chart-title').textContent || '我的数据' }));
      toast('已保存到浏览器');
    } catch (e) { toast('保存失败：' + e.message); }
  }

  function restoreLocal() {
    try {
      var raw = localStorage.getItem('afgData');
      if (!raw) { toast('浏览器中还没有保存的数据'); return; }
      var obj = JSON.parse(raw);
      applyRemoteTable(obj.table, obj.title || '我的数据');
    } catch (e) { toast('恢复失败：' + e.message); }
  }

  function exportJson() {
    if (!state.table) { toast('当前没有可导出的数据'); return; }
    var blob = new Blob([JSON.stringify(state.table, null, 0)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    a.click();
    toast('数据 JSON 已导出（可放到 GitHub 仓库用 URL 载入）');
  }

  var TYPE_LABELS = { line: '折线图', area: '面积图', bar: '柱状图', stacked: '堆叠面积', rank: '横向排名', candlestick: 'K 线', radar: '雷达图', stackedBar: '堆叠柱状', perf: '业绩评估', worldMap: '世界地图', scatterMatrix: '散点矩阵' };

  /* ---------- 通用 ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = el('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2200);
  }

  function toggleSidebar() {
    var sb = el('sidebar');
    var open = sb.classList.toggle('open');
    el('sidebar-backdrop').classList.toggle('show', open);
  }
  function closeSidebar() {
    el('sidebar').classList.remove('open');
    el('sidebar-backdrop').classList.remove('show');
  }

  function setHead(meta) {
    state.currentMeta = meta;
    el('chart-title').textContent = state.customTitles[state.viewKey] || meta.title;
    el('chart-subtitle').textContent = meta.subtitle || '';
    var unit = el('chart-unit');
    if (meta.unit) { unit.style.display = ''; unit.textContent = meta.unit; }
    else unit.style.display = 'none';
    el('chart-source').textContent = meta.source || '';
  }

  function clearStage() {
    hideBack();
    ChartFactory.disposeAll();
    state.priceInsts.forEach(function (inst) { PriceChart.destroy(inst); });
    state.priceInsts = [];
    (state.macroInsts || []).forEach(function (i) { try { i.dispose(); } catch (e) {} });
    state.macroInsts = [];
    state.priceEl = null; state.echartsEl = null;
    el('chart-stage').innerHTML = '';
    clearAnalysis();
  }

  function normalizeTime(v) {
    var s = String(v).trim();
    if (/^\d{8}$/.test(s)) return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8);
    var m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (m) return m[1] + '-' + (m[2].length < 2 ? '0' : '') + m[2] + '-' + (m[3].length < 2 ? '0' : '') + m[3];
    return s;
  }

  /* ---------- 图上标注（加说明） ---------- */
  function echartsAnnotations(key) {
    return (state.annotations[key] || []).filter(function (a) { return a.cat !== undefined; });
  }
  function priceAnnotations(key) {
    return (state.annotations[key] || []).filter(function (a) { return a.time !== undefined; });
  }

  function attachAnnotationHandler(inst) {
    if (!inst || !inst.getZr) return;
    var zr = inst.getZr();
    if (zr._annotBound) return;
    zr._annotBound = true;
    zr.on('click', function (e) {
      if (!state.annotateMode) return;
      var px = e.offsetX, py = e.offsetY;
      var opt = inst.getOption();
      var xAxis = opt.xAxis && opt.xAxis[0];
      var pt;
      try { pt = inst.convertFromPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [px, py]); }
      catch (err) {
        try { pt = inst.convertFromPixel({ gridIndex: 0 }, [px, py]); }
        catch (err2) { return; }
      }
      if (!pt) return;
      var cat, val = pt[1];
      if (xAxis && xAxis.type === 'category' && xAxis.data) {
        var idx = (typeof pt[0] === 'number') ? Math.round(pt[0]) : xAxis.data.indexOf(pt[0]);
        idx = Math.max(0, Math.min(xAxis.data.length - 1, idx));
        cat = xAxis.data[idx];
      } else { cat = pt[0]; }
      if (cat === undefined || cat === null || isNaN(val)) { toast('请点击图表绘图区域内'); return; }
      showAnnotationInput(px, py, function (text) {
        var list = state.annotations[state.viewKey] || (state.annotations[state.viewKey] = []);
        list.push({ cat: cat, val: val, text: text });
        rerender();
        toast('已添加说明');
      });
    });
  }

  /* 极值标注：标注可视区间内最高 / 最低 / 最新，随缩放更新 */
  /* 极值标注：标注可视区间内各指标的最高/最低/最新，可拖动、带箭头指向 */
  /* 根据背景色自动选择深色/浅色文字 */
  function pickTextColor(bg) {
    if (!bg) return '#FFFFFF';
    var r = 255, g = 255, b = 255;
    if (bg.charAt(0) === '#') {
      var hex = bg.slice(1);
      if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      r = parseInt(hex.slice(0, 2), 16); g = parseInt(hex.slice(2, 4), 16); b = parseInt(hex.slice(4, 6), 16);
    } else {
      var m = bg.match(/rgba?\(([^)]+)\)/);
      if (m) { var p = m[1].split(',').map(Number); r = p[0]; g = p[1]; b = p[2]; }
    }
    var lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return lum > 0.6 ? '#0E0F12' : '#FFFFFF';
  }

  function applyExtremeLabels(inst) {
    if (!inst) return;
    var container = inst.getDom && inst.getDom();
    if (!container) return;
    var old = container.querySelector('.ext-overlay');
    if (old) old.remove();
    var mode = state.labelMode || 'off';
    var tc = Themes.active().chart;
    // 仅清除本功能自己开启的「全部数据」标签，不影响图表自带标签（如热力图数值）
    if (mode !== 'all' && inst._allLabels) {
      var o0 = inst.getOption();
      inst.setOption({ series: (o0.series || []).map(function () { return { label: { show: false } }; }) });
      inst._allLabels = false;
    }
    if (mode === 'off') return;
    if (mode === 'all') {
      var o1 = inst.getOption();
      var dz1 = o1.dataZoom && o1.dataZoom[0];
      var st1 = dz1 ? (dz1.start || 0) : 0, en1 = dz1 ? (dz1.end || 100) : 100;
      var total = 0;
      (o1.series || []).forEach(function (s) { total = Math.max(total, (s.data || []).length); });
      var visible = Math.max(1, Math.round(total * (en1 - st1) / 100));
      if (visible > 300) {
        toast('可见 ' + visible + ' 个数据点，请先用「区间」缩小到 300 个点以内再标注全部数据');
        return;
      }
      var dense = visible > 24;
      inst._allLabels = true;
      inst.setOption({ series: (o1.series || []).map(function (s) {
        return { label: {
          show: true, position: 'top', fontSize: dense ? 7 : 10, color: tc.muted,
          rotate: dense ? 90 : 0,
          align: dense ? 'left' : 'center',
          verticalAlign: dense ? 'middle' : 'bottom',
          distance: dense ? 3 : 2
        } };
      }) });
      return;
    }
    var opt = inst.getOption();
    var dz = opt.dataZoom && opt.dataZoom[0];
    var start = dz ? (dz.start || 0) : 0, end = dz ? (dz.end || 100) : 100;
    var t = Themes.active().chart;

    var overlay = document.createElement('div');
    overlay.className = 'ext-overlay';
    overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:20;';
    container.appendChild(overlay);
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%'); svg.setAttribute('height', '100%');
    svg.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;';
    overlay.appendChild(svg);
    var defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svg.appendChild(defs);

    var marks = [];
    (opt.series || []).forEach(function (series, si) {
      if (series.type !== 'line' && series.type !== 'bar') return;
      var data = series.data || [];
      var n = data.length;
      if (!n) return;
      var s = Math.floor(n * start / 100), e = Math.ceil(n * end / 100);
      if (e <= s) e = Math.min(n, s + 1);
      function valAt(i) { var v = data[i]; if (v === null || v === undefined) return null; return (typeof v === 'object') ? v.value : v; }
      var maxI = -1, minI = -1;
      for (var i = s; i < e; i++) { var v = valAt(i); if (v === null || isNaN(v)) continue; if (maxI < 0 || v > valAt(maxI)) maxI = i; if (minI < 0 || v < valAt(minI)) minI = i; }
      var lastI = e - 1;
      while (lastI >= s && (valAt(lastI) === null || isNaN(valAt(lastI)))) lastI--;
      if (maxI < 0 || minI < 0) return;
      var xAxis = opt.xAxis && opt.xAxis[0];
      function pxOf(i) {
        try { return inst.convertToPixel({ seriesIndex: si }, [i, valAt(i)]); }
        catch (err) { try { return inst.convertToPixel({ xAxisIndex: 0, yAxisIndex: 0 }, [i, valAt(i)]); } catch (e2) { return null; } }
      }
      var name = series.name || ('指标' + (si + 1));
      var items = [];
      if (maxI !== minI) { items.push({ i: maxI, kind: '最高', color: t.up }); items.push({ i: minI, kind: '最低', color: t.down }); }
      else items.push({ i: maxI, kind: '最新', color: t.accent });
      if (lastI >= s && lastI !== maxI && lastI !== minI) items.push({ i: lastI, kind: '最新', color: t.accent });
      items.forEach(function (it) {
        var p = pxOf(it.i);
        if (!p) return;
        marks.push({ px: p[0], py: p[1], name: name, kind: it.kind, val: valAt(it.i), color: it.color, si: si });
      });
    });
    if (!marks.length) return;

    var colorIdx = {};
    Object.keys(marks.reduce(function (a, m) { a[m.color] = 1; return a; }, {})).forEach(function (c, ci) {
      colorIdx[c] = ci;
      var mk = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
      mk.setAttribute('id', 'extArrow' + ci);
      mk.setAttribute('markerWidth', '8'); mk.setAttribute('markerHeight', '8');
      mk.setAttribute('refX', '6'); mk.setAttribute('refY', '3');
      mk.setAttribute('orient', 'auto'); mk.setAttribute('markerUnits', 'userSpaceOnUse');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M0,0 L7,3 L0,6 z'); path.setAttribute('fill', c);
      mk.appendChild(path);
      defs.appendChild(mk);
    });

    // 计算初始位置并做纵向去重（防遮挡）
    var labelsInfo = marks.map(function (m) {
      var shortName = m.name.length > 7 ? m.name.slice(0, 7) + '…' : m.name;
      var lx = m.px + 6, ly = m.py - 26;
      if (m.kind === '最低') { lx = m.px + 6; ly = m.py + 6; }
      else if (m.kind === '最新') { lx = m.px + 14; ly = m.py - 8; }
      ly -= m.si * 16;
      return { m: m, shortName: shortName, lx: lx, ly: ly };
    });
    labelsInfo.sort(function (a, b) { return a.ly - b.ly; });
    for (var li = 1; li < labelsInfo.length; li++) {
      var prev = labelsInfo[li - 1];
      if (Math.abs(labelsInfo[li].lx - prev.lx) < 130 && (labelsInfo[li].ly - prev.ly) < 22) {
        labelsInfo[li].ly = prev.ly + 22;
      }
    }

    var cw = container.clientWidth || 0, chh = container.clientHeight || 0;
    labelsInfo.forEach(function (info) {
      var m = info.m, lx = info.lx, ly = info.ly;
      var label = document.createElement('div');
      label.className = 'ext-label';
      var txtColor = pickTextColor(m.color);
      label.style.cssText = 'position:absolute;left:' + lx + 'px;top:' + ly + 'px;pointer-events:auto;cursor:move;background:' + m.color + ';color:' + txtColor + ';font:700 10px Inter,sans-serif;padding:3px 7px;border-radius:4px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.35);';
      label.textContent = fmtNum(m.val);
      overlay.appendChild(label);
      // 边界收敛：保证标签完整显示在图表内
      var lw = label.offsetWidth || 48, lh = label.offsetHeight || 18;
      if (lx + lw > cw - 6) lx = cw - lw - 6;
      if (lx < 6) lx = 6;
      if (ly + lh > chh - 6) ly = chh - lh - 6;
      if (ly < 6) ly = 6;
      label.style.left = lx + 'px';
      label.style.top = ly + 'px';
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', m.px); line.setAttribute('y1', m.py);
      line.setAttribute('x2', lx + 3); line.setAttribute('y2', ly + 10);
      line.setAttribute('stroke', m.color); line.setAttribute('stroke-width', '1.2');
      line.setAttribute('marker-end', 'url(#extArrow' + colorIdx[m.color] + ')');
      svg.appendChild(line);
      makeExtLabelDraggable(label, line);
    });
  }

  function makeExtLabelDraggable(label, line) {
    label.addEventListener('mousedown', function (e) {
      e.preventDefault();
      var sx = e.clientX, sy = e.clientY;
      var ox = label.offsetLeft, oy = label.offsetTop;
      function onMove(ev) {
        var dx = ev.clientX - sx, dy = ev.clientY - sy;
        label.style.left = (ox + dx) + 'px';
        label.style.top = (oy + dy) + 'px';
        line.setAttribute('x2', ox + dx + 3);
        line.setAttribute('y2', oy + dy + 10);
      }
      function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function attachExtremeLabels(inst) {
    if (!inst) return;
    applyExtremeLabels(inst);
    if (inst._extBound) return;
    inst._extBound = true;
    inst.on('datazoom', function () { applyExtremeLabels(inst); });
  }

  function attachPriceAnnotationHandler(inst, container) {
    if (!inst || !inst.chart || !container || container._annotBound) return;
    container._annotBound = true;
    container.addEventListener('click', function (ev) {
      if (!state.annotateMode) return;
      var rect = container.getBoundingClientRect();
      var x = ev.clientX - rect.left;
      var time = null;
      try { time = inst.chart.timeScale().coordinateToTime(x); } catch (e) {}
      if (!time) { toast('请点击K线区域'); return; }
      showAnnotationInput(x, ev.clientY - rect.top, function (text) {
        var list = state.annotations[state.viewKey] || (state.annotations[state.viewKey] = []);
        list.push({ time: time, text: text });
        rerender();
        toast('已添加说明');
      });
    });
  }

  function applyPriceAnnotations(inst) {
    if (!inst || !inst.candle || !inst.candle.setMarkers) return;
    var list = priceAnnotations(state.viewKey);
    var theme = getChartTheme();
    try {
      inst.candle.setMarkers(list.map(function (a) {
        return { time: a.time, position: 'aboveBar', color: theme.accent, shape: 'circle', text: a.text };
      }));
    } catch (e) {}
  }

  function showAnnotationInput(px, py, cb) {
    var stage = el('chart-stage');
    var wrap = document.createElement('div');
    wrap.className = 'annot-input-wrap';
    var w = 236;
    wrap.style.left = Math.max(4, Math.min(px, stage.clientWidth - w)) + 'px';
    wrap.style.top = Math.max(4, py - 42) + 'px';
    wrap.style.width = w + 'px';
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'annot-input';
    input.placeholder = '输入说明文字，回车确认';
    wrap.appendChild(input);
    stage.appendChild(wrap);
    input.focus();
    var closed = false;
    function close() { if (!closed) { closed = true; wrap.remove(); } }
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'Enter') { var t = input.value.trim(); close(); if (t) cb(t); }
      else if (ev.key === 'Escape') { close(); }
    });
    input.addEventListener('blur', function () { setTimeout(close, 120); });
  }

  /* ---------- 首页 / 使用说明 ---------- */
  /* AI 画图示例（等价于 Agent 调用 make_chart 生成的结果） */
  function showExampleChart() {
    var cfg = {
      type: 'area', viewKey: 'example', theme: 'midnight-gold',
      title: 'AI 示例 · 全球主要经济体 GDP 增速', subtitle: '对 AI 说一句话即可生成这样的图', unit: '%',
      labels: ['2019', '2020', '2021', '2022', '2023', '2024', '2025'],
      series: [
        { name: '中国', values: [6.0, 2.2, 8.4, 3.0, 5.2, 5.0, 5.0] },
        { name: '美国', values: [2.5, -2.2, 5.7, 2.1, 2.5, 2.8, 2.4] },
        { name: '欧元区', values: [1.6, -6.1, 5.4, 3.5, 0.4, 0.8, 1.2] },
        { name: '日本', values: [-0.4, -4.2, 2.6, 1.0, 1.9, 0.3, 1.1] }
      ]
    };
    applyChartConfig(cfg);
    showBack(function () { renderHome(); });
  }

  function renderHome() {
    clearStage();
    state.macroItem = null; state.finItem = null; state.intlItem = null; state.chartConfig = null; state.macroTypeOverride = null;
    state.mode = 'home';
    state.viewKey = 'home';
    highlightNav('home');
    el('stat-badge').style.display = 'none';
    el('btn-events').style.display = 'none';
    el('btn-table').style.display = 'none';
    el('hint').textContent = '';
    var h = document.createElement('div');
    h.className = 'home-view';
    h.innerHTML =
      '<div class="home-logo">AFG</div>' +
      '<div class="home-title">智能制图 · 上传即用</div>' +
      '<div class="home-sub">只需上传数据，工具自动识别结构并推荐图表；你随时可自由切换图表类型、配色与功能。</div>' +
      '<div class="home-steps">' +
        '<div class="home-step"><span class="hs-num">1</span><div><b>上传数据</b><p>支持 Excel（多工作表）/ CSV / JSON，数据仅在本地浏览器处理、不上传。</p></div></div>' +
        '<div class="home-step"><span class="hs-num">2</span><div><b>选择分析目的</b><p>趋势图 / 业绩评估 / K线 / 机器学习 / 宏观分析，自动推荐并按模块出图。</p></div></div>' +
        '<div class="home-step"><span class="hs-num">3</span><div><b>自由定制</b><p>切换图表、5 套配色、时间区间、叠加指标、标注、数据变换、世界地图、雷达图等。</p></div></div>' +
      '</div>' +
      '<button class="btn primary home-cta" id="home-import">＋ 上传数据开始</button>' +
      '<div class="home-note">想看效果？左侧「中国宏观数据一览」看最新宏观；「参考模板」可预览各图表样式。</div>' +
      '<div class="home-mcp">' +
        '<h3>🤖 用 AI 一句话画图（Kimi / WorkBuddy / Cursor / Claude 等）</h3>' +
        '<p>不用学任何语法，直接把数据和需求说给 AI，它会调用 AFG 的 <code>make_chart</code> 工具，返回一个图表链接，点开就能看、能分享、能导出。</p>' +
        '<div class="home-ai-examples">' +
          '<div class="home-ai-q">「用近 5 年沪深300和中证500做一张对比折线图」</div>' +
          '<div class="home-ai-q">「画一张全球主要经济体近 6 年 GDP 增速的热力图」</div>' +
          '<div class="home-ai-q">「把这几个月的中美 CPI 画成面积图，用黑金主题」</div>' +
        '</div>' +
        '<p class="home-ai-tip">👉 你也可以把 Excel 粘给 AI，再说「用 AFG 画图」，它会自动整理数据并生成图表链接。</p>' +
        '<div class="home-cta-row">' +
          '<button class="btn primary" id="home-demo">▶ 看一个 AI 生成的图表示例</button>' +
        '</div>' +
        '<details class="home-mcp-detail"><summary>开发者配置（MCP Server）</summary>' +
          '<ol><li>进入 <code>mcp-server/</code>，运行 <code>npm install</code></li>' +
          '<li>Agent 的 MCP 设置里添加：Command=<code>node</code>，Args=<code>&lt;项目路径&gt;/mcp-server/server.js</code></li>' +
          '<li>对 Agent 说「用 AFG 画图」，即可调用 <code>make_chart</code></li></ol>' +
          '<p>支持折线/面积/柱状/堆叠/雷达 + 5 套配色，详见 <code>mcp-server/README.md</code>。</p>' +
        '</details>' +
            '</div>';
    el('chart-stage').appendChild(h);
    setHead({ title: 'AFG · 智能制图', subtitle: '上传数据 → 自动识别 → 推荐图表 → 自由定制', unit: '', source: '' });
    h.querySelector('#home-import').addEventListener('click', openModal);
    var demoBtn = h.querySelector('#home-demo');
    if (demoBtn) demoBtn.addEventListener('click', showExampleChart);
    syncToolbar();
  }

  /* ---------- 中国宏观数据一览（真实数据看板） ---------- */
  function renderChinaMacro() {
    clearStage();
    state.mode = 'macro';
    state.viewKey = 'china-macro';
    state.currentTemplate = null; state.dataset = null; state.dashboardDatasets = null;
    state.table = null; state.det = null; state.macroItem = null; state.finItem = null; state.intlItem = null; state.chartConfig = null; state.macroTypeOverride = null;
    highlightNav('china-macro');
    el('stat-badge').style.display = 'none';
    el('btn-events').style.display = 'none';
    el('btn-table').style.display = 'none';
    el('hint').textContent = '';
    var M = window.CHINA_MACRO || { sections: [] };
    setHead({
      title: '中国宏观数据一览',
      subtitle: (M.updated ? '数据更新到 ' + M.updated : '暂无数据') + ' · 点击任意卡片查看完整图表',
      unit: '', source: 'Wind / 国家统计局 · 手工整理'
    });

    var wrap = document.createElement('div');
    wrap.className = 'macro-dash';
    var theme = getChartTheme();
    state.macroInsts = [];

    (M.sections || []).forEach(function (sec) {
      var secEl = document.createElement('div');
      secEl.className = 'macro-section';
      var hd = document.createElement('div');
      hd.className = 'macro-cat';
      hd.textContent = sec.name;
      secEl.appendChild(hd);
      var grid = document.createElement('div');
      grid.className = 'macro-grid';
      sec.items.forEach(function (item) {
        if (!item || !item.series || !item.series.length) return;
        var first = item.series[0];
        var latest = first.values[first.values.length - 1];
        var prev = first.values.length > 1 ? first.values[first.values.length - 2] : null;
        var delta = (prev === null || prev === undefined || isNaN(prev)) ? null : (latest - prev);
        var upCls = delta === null ? '' : (delta >= 0 ? 'up' : 'down');
        var arrow = delta === null ? '' : (delta >= 0 ? '▲' : '▼');
        var multi = item.series.length > 1;
        var card = document.createElement('div');
        card.className = 'macro-card';
        card.title = '点击查看完整图表';
        card.innerHTML =
          '<div class="mc-name">' + item.title + (multi ? '（' + item.series.length + '条）' : '') + '</div>' +
          '<div class="mc-val">' + fmtNum(latest) + '</div>' +
          '<div class="mc-delta ' + upCls + '">' + (delta === null ? '—' : arrow + ' ' + fmtNum(Math.abs(delta)) + ' 较上期') + '</div>' +
          '<div class="mc-chart"></div>';
        card.addEventListener('click', function () { openMacroItem(item, false); });
        grid.appendChild(card);
        renderMacroSpark(card.querySelector('.mc-chart'), item, theme);
      });
      secEl.appendChild(grid);
      wrap.appendChild(secEl);
    });

    el('chart-stage').appendChild(wrap);
    syncToolbar();
  }

  function openMacroItem(item, keep) {
    try {
      var vk = 'macro-item:' + item.title;
      if (!keep) { state.overlaySeries = []; state.macroTypeOverride = null; delete state.customTitles[vk]; }
      state.macroItem = item;
      var merged = mergeOverlaySeries(item.labels, item.series, state.overlaySeries);
      var type = state.macroTypeOverride || item.type;
      applyChartConfig({ type: type, title: item.title, unit: item.unit, labels: merged.labels, series: merged.series, viewKey: vk });
      showBack(function () { renderChinaMacro(); });
      if (state.overlaySeries.length) renderPeriodTable(merged.labels, merged.series);
    } catch (e) { toast('打开图表失败'); }
  }

  function renderMacroSpark(el2, item, theme) {
    try {
      var inst = echarts.getInstanceByDom(el2) || echarts.init(el2);
      state.macroInsts.push(inst);
      var series = item.series.map(function (s, i) {
        var color = theme.series ? theme.series[i % theme.series.length] : theme.accent;
        return {
          type: 'line', name: s.name, data: s.values, showSymbol: false, smooth: true, silent: true,
          lineStyle: { color: color, width: 1.5 },
          areaStyle: item.series.length === 1 ? { color: ChartFactory.hexToRgba(color, 0.16) } : undefined
        };
      });
      inst.setOption({
        grid: { left: 2, right: 2, top: 6, bottom: 2 },
        xAxis: { type: 'category', show: false, data: item.labels, boundaryGap: false },
        yAxis: { type: 'value', show: false, scale: true },
        series: series,
        tooltip: {
          trigger: 'axis', confine: true,
          backgroundColor: theme.panel, borderColor: theme.accent + '55', borderWidth: 1,
          textStyle: { color: theme.text, fontSize: 11 },
          valueFormatter: function (v) { return fmtNum(v); }
        }
      });
    } catch (e) {}
  }

  /* ---------- 金融数据一览（真实数据看板） ---------- */
  function renderFinance() {
    clearStage();
    state.mode = 'macro';
    state.viewKey = 'finance';
    state.currentTemplate = null; state.dataset = null; state.dashboardDatasets = null;
    state.table = null; state.det = null; state.macroItem = null; state.finItem = null; state.intlItem = null; state.chartConfig = null; state.macroTypeOverride = null;
    highlightNav('finance');
    el('stat-badge').style.display = 'none';
    el('btn-events').style.display = 'none';
    el('btn-table').style.display = 'none';
    el('hint').textContent = '';
    var F = window.FINANCE_DATA || { sections: [] };
    setHead({
      title: '金融数据一览',
      subtitle: (F.updated ? '数据更新到 ' + F.updated : '暂无数据') + ' · 股票/商品/外汇用业绩模版，债券/VIX 用收益率折线',
      unit: '', source: 'Wind / 交易所 · 手工整理'
    });

    var wrap = document.createElement('div');
    wrap.className = 'macro-dash';
    var theme = getChartTheme();
    state.macroInsts = [];

    (F.sections || []).forEach(function (sec) {
      var secEl = document.createElement('div');
      secEl.className = 'macro-section';
      var hd = document.createElement('div');
      hd.className = 'macro-cat';
      hd.textContent = sec.name;
      secEl.appendChild(hd);
      var grid = document.createElement('div');
      grid.className = 'macro-grid';
      sec.items.forEach(function (item) {
        if (!item || !item.series || !item.series.length) return;
        var ranged = applyTimeRange(item.labels, item.series);
        var fi = { title: item.title, unit: item.unit, type: item.type, labels: ranged.labels, series: ranged.series };
        var first = fi.series[0];
        var vals = first.values;
        var latest = vals[vals.length - 1];
        var prev = vals.length > 1 ? vals[vals.length - 2] : null;
        var delta = (prev === null || prev === undefined || isNaN(prev) || prev === 0) ? null : (latest - prev);
        var upCls = delta === null ? '' : (delta >= 0 ? 'up' : 'down');
        var arrow = delta === null ? '' : (delta >= 0 ? '▲' : '▼');
        var card = document.createElement('div');
        card.className = 'macro-card';
        card.title = fi.type === 'line' ? '点击查看走势' : '点击查看业绩';
        card.innerHTML =
          '<div class="mc-name">' + fi.title + '</div>' +
          '<div class="mc-val">' + fmtNum(latest) + '</div>' +
          '<div class="mc-delta ' + upCls + '">' + (delta === null ? '—' : arrow + ' ' + fmtNum(Math.abs(delta)) + ' 较上期') + '</div>' +
          '<div class="mc-chart"></div>';
        card.addEventListener('click', function () { openFinItem(fi); });
        grid.appendChild(card);
        renderMacroSpark(card.querySelector('.mc-chart'), fi, theme);
      });
      secEl.appendChild(grid);
      wrap.appendChild(secEl);
    });

    el('chart-stage').appendChild(wrap);
    syncToolbar();
  }

  function openFinItem(item, keep) {
    try {
      var fvk = 'fin-item:' + item.title;
      if (!keep) { state.overlaySeries = []; state.macroTypeOverride = null; delete state.customTitles[fvk]; }
      state.finItem = item;
      var ranged = applyTimeRange(item.labels, item.series);
      var labels = ranged.labels, values = ranged.series[0].values;
      var merged = mergeOverlaySeries(labels, [{ name: item.title, values: values }], state.overlaySeries);
      clearStage();
      state.mode = 'imported'; state.isImported = true; state.viewKey = fvk;
      state.macroItem = null; state.chartConfig = null;
      highlightNav(null);
      el('btn-events').style.display = 'none';
      el('stat-badge').style.display = 'none';
      showBack(function () { renderFinance(); });
      var theme = getChartTheme();
      var c = document.createElement('div'); c.className = 'chart-canvas'; el('chart-stage').appendChild(c);
      if (item.type === 'line' || state.overlaySeries.length) {
        // 收益率/波动率 或 带叠加对比：直接折线
        var ci = renderAutoDual(c, 'line', { labels: merged.labels, series: merged.series }, theme);
        attachExtremeLabels(ci);
        state.echartsEl = c;
        state.lastChart = { type: 'line', title: item.title, data: { labels: merged.labels, series: merged.series } };
        renderFinanceMetricsTable(merged.labels, merged.series, item.type === 'fund', item.unit === '%');
        setHead({ title: item.title + (state.overlaySeries.length ? ' · 对比' : ''), subtitle: '', unit: item.unit || '', source: '公开数据' });
        el('hint').textContent = state.overlaySeries.length ? '多指标对比' : '收益率/波动率走势';
      } else {
        // 业绩评估：净值 + 回撤 + 指标
        var nav = merged.labels.map(function (d, i) { return { date: d, value: merged.series[0].values[i] }; }).filter(function (p) { return p.value !== null && p.value !== undefined && !isNaN(p.value); });
        var ci2 = ChartFactory.render(c, 'perf', { name: item.title, nav: nav }, theme);
        renderPerfMetrics({ name: item.title, nav: nav }, ci2);
        renderFinanceMetricsTable(merged.labels, merged.series, true);
        state.echartsEl = c;
        setHead({ title: item.title + ' · 业绩评估', subtitle: '净值曲线（上）+ 最大回撤（下）', unit: item.unit || '净值', source: '基金' });
        el('hint').textContent = '业绩评估 · 单个资产';
      }
      syncToolbar();
    } catch (e) { toast('打开图表失败'); }
  }

  /* ---------- 国际宏观数据看板 ---------- */
  function renderIntlMacro() {
    clearStage();
    state.mode = 'macro';
    state.viewKey = 'intl-macro';
    state.currentTemplate = null; state.dataset = null; state.dashboardDatasets = null;
    state.table = null; state.det = null; state.macroItem = null; state.finItem = null; state.intlItem = null; state.chartConfig = null; state.macroTypeOverride = null;
    highlightNav('intl-macro');
    el('stat-badge').style.display = 'none';
    el('btn-events').style.display = 'none';
    el('btn-table').style.display = 'none';
    el('hint').textContent = '';
    var M = window.INTL_MACRO || { sections: [] };
    setHead({
      title: '国际宏观数据',
      subtitle: (M.updated ? '数据更新到 ' + M.updated : '暂无数据') + ' · 主流国家 GDP/CPI/PPI/PMI/基准利率',
      unit: '', source: 'akshare · 公开数据'
    });

    var wrap = document.createElement('div');
    wrap.className = 'macro-dash';
    var theme = getChartTheme();
    state.macroInsts = [];

    (M.sections || []).forEach(function (sec) {
      var secEl = document.createElement('div');
      secEl.className = 'macro-section';
      var hd = document.createElement('div');
      hd.className = 'macro-cat';
      hd.textContent = sec.name;
      secEl.appendChild(hd);
      var grid = document.createElement('div');
      grid.className = 'macro-grid';
      sec.items.forEach(function (item) {
        if (!item || !item.series || !item.series.length) return;
        var first = item.series[0];
        var vals = first.values;
        var latest = vals[vals.length - 1];
        var prev = vals.length > 1 ? vals[vals.length - 2] : null;
        var delta = (prev === null || prev === undefined || isNaN(prev) || prev === 0) ? null : (latest - prev);
        var upCls = delta === null ? '' : (delta >= 0 ? 'up' : 'down');
        var arrow = delta === null ? '' : (delta >= 0 ? '▲' : '▼');
        var card = document.createElement('div');
        card.className = 'macro-card';
        card.title = '点击查看走势';
        card.innerHTML =
          '<div class="mc-name">' + item.title + '</div>' +
          '<div class="mc-val">' + fmtNum(latest) + '</div>' +
          '<div class="mc-delta ' + upCls + '">' + (delta === null ? '—' : arrow + ' ' + fmtNum(Math.abs(delta)) + ' 较上期') + '</div>' +
          '<div class="mc-chart"></div>';
        card.addEventListener('click', function () { openIntlItem(item); });
        grid.appendChild(card);
        renderMacroSpark(card.querySelector('.mc-chart'), item, theme);
      });
      secEl.appendChild(grid);
      wrap.appendChild(secEl);
    });

    el('chart-stage').appendChild(wrap);
    syncToolbar();
  }

  function openIntlItem(item, keep) {
    try {
      var ivk = 'intl-item:' + item.title;
      if (!keep) { state.overlaySeries = []; state.macroTypeOverride = null; delete state.customTitles[ivk]; }
      state.intlItem = item;
      var ranged = applyTimeRange(item.labels, item.series);
      var merged = mergeOverlaySeries(ranged.labels, ranged.series, state.overlaySeries);
      clearStage();
      state.mode = 'imported'; state.isImported = true; state.viewKey = ivk;
      state.macroItem = null; state.finItem = null; state.chartConfig = null;
      highlightNav(null);
      el('btn-events').style.display = 'none';
      el('stat-badge').style.display = 'none';
      showBack(function () { renderIntlMacro(); });
      var theme = getChartTheme();
      var c = document.createElement('div'); c.className = 'chart-canvas'; el('chart-stage').appendChild(c);
      var ci = renderAutoDual(c, 'line', { labels: merged.labels, series: merged.series }, theme);
      attachExtremeLabels(ci);
      state.echartsEl = c;
      state.lastChart = { type: 'line', title: item.title, data: { labels: merged.labels, series: merged.series } };
      if (state.overlaySeries.length) renderPeriodTable(merged.labels, merged.series);
      setHead({ title: item.title + (state.overlaySeries.length ? ' · 对比' : ''), subtitle: '走势 · 可直接叠加中国宏观等指标', unit: item.unit || '', source: '公开数据' });
      el('hint').textContent = state.overlaySeries.length ? '多指标对比' : '单个指标走势';
      syncToolbar();
    } catch (e) { toast('打开图表失败'); }
  }

  /* ---------- 数据探索：用已有数据自由组合生成图表 ---------- */
  var exploreSel = [];
  function exploreData(source) {
    if (source === 'china') return window.CHINA_MACRO;
    if (source === 'intl') return window.INTL_MACRO;
    return window.FINANCE_DATA;
  }
  function buildExploreItems(source) {
    var box = el('explore-items');
    if (!box) return;
    exploreSel.length = 0;
    box.innerHTML = '';
    var sources = (source === 'all') ? ['china', 'intl', 'finance'] : [source];
    var labelMap = { china: '中国宏观', intl: '国际宏观', finance: '金融数据' };
    sources.forEach(function (src) {
      var D = exploreData(src) || { sections: [] };
      // 该数据源有指标才加分组标题
      var hasAny = D.sections.some(function (s) { return s.items && s.items.length; });
      if (!hasAny) return;
      var hd = document.createElement('div');
      hd.className = 'nav-group-label';
      hd.style.padding = '10px 4px 4px';
      hd.textContent = labelMap[src] || src;
      box.appendChild(hd);
      D.sections.forEach(function (sec) {
        sec.items.forEach(function (item) {
          if (!item.series || !item.series.length) return;
          var key = src + ':' + item.title;
          var chip = document.createElement('div');
          chip.className = 'col-chip';
          chip.textContent = item.title;
          chip.dataset.key = key;
          chip.addEventListener('click', function () {
            var i = exploreSel.indexOf(key);
            if (i >= 0) exploreSel.splice(i, 1); else exploreSel.push(key);
            chip.classList.toggle('on');
          });
          box.appendChild(chip);
          item._exploreKey = key;
        });
      });
    });
  }
  function openExplore() {
    el('explore-overlay').classList.add('open');
    buildExploreItems(el('explore-source').value);
  }
  function closeExplore() { el('explore-overlay').classList.remove('open'); }
  function exploreItemByKey(key) {
    var src = key.split(':')[0];
    var title = key.split(':').slice(1).join(':');
    var D = exploreData(src);
    for (var i = 0; i < D.sections.length; i++) {
      for (var j = 0; j < D.sections[i].items.length; j++) {
        if (D.sections[i].items[j].title === title) return D.sections[i].items[j];
      }
    }
    return null;
  }
  function renderExplore() {
    var source = el('explore-source').value;
    var typ = el('explore-type').value;
    var keys = exploreSel.slice();
    if (keys.length < 2) { toast('请至少选择 2 个指标'); return; }
    var items = keys.map(function (k) { return exploreItemByKey(k); }).filter(Boolean);
    if (items.length < 2) { toast('未找到所选指标'); return; }
    state.exploreConfig = { source: source, keys: keys, type: typ };
    renderExploreFromConfig();
    closeExplore();
  }
  function renderExploreFromConfig() {
    var cfg = state.exploreConfig;
    if (!cfg) return;
    var source = cfg.source, typ = cfg.type, keys = cfg.keys;
    var items = keys.map(function (k) { return exploreItemByKey(k); }).filter(Boolean);
    if (items.length < 2) return;
    var theme = getChartTheme();
    var ranged = items.map(function (it) { return applyTimeRange(it.labels, it.series); });
    clearStage();
    state.mode = 'imported'; state.isImported = true; state.viewKey = 'explore';
    state.macroItem = null; state.finItem = null; state.intlItem = null; state.chartConfig = null;
    highlightNav('explore');
    el('btn-events').style.display = 'none';
    el('stat-badge').style.display = 'none';
    var stage = el('chart-stage');
    var c = document.createElement('div'); c.className = 'chart-canvas'; stage.appendChild(c);
    var title = items.map(function (it) { return it.title; }).join(' vs ');
    function setLast(t, d) { state.lastChart = { type: t, title: title, data: d }; }
    if (typ === 'multi') {
      var merged = mergeOverlaySeries(ranged[0].labels, ranged[0].series, items.slice(1).map(function (it, i) {
        return { name: it.title, labels: ranged[i + 1].labels, values: ranged[i + 1].series[0].values };
      }));
      renderAutoDual(c, 'line', merged, theme);
      setLast('line', merged);
      setHead({ title: '多线对比', subtitle: title, unit: '', source: '已有数据' });
    } else if (typ === 'heatmap') {
      var labelSet = {};
      ranged.forEach(function (r) { r.labels.forEach(function (l) { labelSet[l] = true; }); });
      var xLabels = Object.keys(labelSet).sort();
      var yLabels = items.map(function (it) { return it.title; });
      var values = [];
      items.forEach(function (it, i) {
        var map = {};
        ranged[i].labels.forEach(function (l, k) { map[l] = ranged[i].series[0].values[k]; });
        xLabels.forEach(function (l, j) { if (map[l] !== undefined && map[l] !== null) values.push([j, i, Math.round(map[l] * 100) / 100]); });
      });
      ChartFactory.render(c, 'heatmap', { xLabels: xLabels, yLabels: yLabels, values: values }, theme);
      setLast('heatmap', { xLabels: xLabels, yLabels: yLabels, values: values });
      setHead({ title: '热力矩阵', subtitle: title, unit: '', source: '已有数据' });
    } else if (typ === 'scatter') {
      var ser = items.map(function (it, i) { return { name: it.title, values: ranged[i].series[0].values }; });
      ChartFactory.render(c, 'scatterMatrix', { series: ser }, theme);
      setLast('scatterMatrix', { series: ser });
      setHead({ title: '散点矩阵 · 关联探索', subtitle: title, unit: '', source: '已有数据' });
    } else if (typ === 'radar') {
      var inds = items.map(function (it) { return { name: it.title }; });
      var vals = items.map(function (it, i) { var v = ranged[i].series[0].values; return v[v.length - 1]; });
      ChartFactory.render(c, 'radar', { indicators: inds, series: [{ name: '最新值', values: vals }] }, theme);
      setLast('radar', { indicators: inds, series: [{ name: '最新值', values: vals }] });
      setHead({ title: '雷达图 · 最新快照', subtitle: title, unit: '', source: '已有数据' });
    } else if (typ === 'rank') {
      var rv = items.map(function (it, i) { var v = ranged[i].series[0].values; return v[v.length - 1]; });
      ChartFactory.render(c, 'rank', { categories: items.map(function (it) { return it.title; }), values: rv }, theme);
      setLast('rank', { categories: items.map(function (it) { return it.title; }), values: rv });
      setHead({ title: '横向排名 · 最新值', subtitle: title, unit: '', source: '已有数据' });
    }
    state.echartsEl = c;
    el('hint').textContent = '数据探索 · 共 ' + items.length + ' 个指标';
    syncToolbar();
  }

  /* ---------- 侧边导航 ---------- */
  function buildSidebar() {
    var sb = el('sidebar');
    sb.innerHTML = '';

    // 1. 使用说明
    var home = document.createElement('div');
    home.className = 'nav-item'; home.dataset.id = 'home';
    home.innerHTML = '<span class="nav-icon">' + ICONS.home + '</span><span>使用说明</span>';
    home.addEventListener('click', function () { state.overlaySeries = []; renderHome(); closeSidebar(); });
    sb.appendChild(home);

    // 2. 中国宏观数据
    var macro = document.createElement('div');
    macro.className = 'nav-item nav-macro'; macro.dataset.id = 'china-macro';
    macro.innerHTML = '<span class="nav-icon">' + ICONS.macro + '</span><span>中国宏观数据</span>';
    macro.addEventListener('click', function () { state.overlaySeries = []; renderChinaMacro(); closeSidebar(); });
    sb.appendChild(macro);

    // 3. 国际宏观数据
    var intl = document.createElement('div');
    intl.className = 'nav-item nav-macro'; intl.dataset.id = 'intl-macro';
    intl.innerHTML = '<span class="nav-icon">' + ICONS.globe + '</span><span>国际宏观数据</span>';
    intl.addEventListener('click', function () { state.overlaySeries = []; renderIntlMacro(); closeSidebar(); });
    sb.appendChild(intl);

    // 4. 金融数据
    var fin = document.createElement('div');
    fin.className = 'nav-item nav-macro'; fin.dataset.id = 'finance';
    fin.innerHTML = '<span class="nav-icon">' + ICONS.perf + '</span><span>金融数据</span>';
    fin.addEventListener('click', function () { state.overlaySeries = []; renderFinance(); closeSidebar(); });
    sb.appendChild(fin);

    // 5. 数据探索
    var explore = document.createElement('div');
    explore.className = 'nav-item'; explore.dataset.id = 'explore';
    explore.innerHTML = '<span class="nav-icon">' + ICONS.ml + '</span><span>数据探索</span>';
    explore.addEventListener('click', function () { openExplore(); closeSidebar(); });
    sb.appendChild(explore);

    // 6. 示例图（可展开子菜单）
    var ex = document.createElement('div');
    ex.className = 'nav-item nav-parent';
    ex.innerHTML = '<span class="nav-icon">' + ICONS.examples + '</span><span>示例图</span><span class="nav-caret">' + ICONS.caret + '</span>';
    var submenu = document.createElement('div');
    submenu.className = 'nav-submenu';
    ex.addEventListener('click', function () {
      var open = submenu.classList.toggle('open');
      ex.classList.toggle('open', open);
    });
    sb.appendChild(ex);

    TEMPLATES.forEach(function (group) {
      var label = document.createElement('div');
      label.className = 'nav-group-label';
      label.textContent = group.category;
      submenu.appendChild(label);
      group.items.forEach(function (item) {
        var nav = document.createElement('div');
        nav.className = 'nav-item nav-sub';
        nav.dataset.id = item.id;
        nav.innerHTML = '<span>' + item.label + '</span>';
        nav.addEventListener('click', function () { state.overrideType = null; state.overlaySeries = []; renderTemplate(item.id); closeSidebar(); });
        submenu.appendChild(nav);
      });
    });
    sb.appendChild(submenu);
  }

  function highlightNav(id) {
    document.querySelectorAll('.nav-item').forEach(function (n) {
      n.classList.toggle('active', n.dataset.id === id);
    });
  }

  /* ---------- 渲染内置模版 ---------- */
  function renderTemplate(id) {
    state.macroItem = null; state.finItem = null; state.intlItem = null; state.chartConfig = null; state.macroTypeOverride = null;
    var sample = DataLoader.SAMPLES[id];
    if (!sample) return;
    clearStage();
    state.mode = 'template';
    state.isImported = false;
    state.dataset = null; state.dashboardDatasets = null;
    state.currentTemplate = id;
    state.viewKey = 'tpl:' + id;
    highlightNav(id);
    setHead(sample.meta);

    // 注入单位、事件标注、图上说明
    if (sample.data) sample.data.unit = sample.meta.unit;
    var hasEvents = !!(EVENTS[id] && EVENTS[id].length);
    if (sample.data) sample.data.events = (hasEvents && state.showEvents) ? EVENTS[id] : [];
    if (sample.data) sample.data.annotations = echartsAnnotations(state.viewKey);
    if (sample.data) sample.data.seriesColors = state.seriesColors;

    var evBtn = el('btn-events');
    if (evBtn) {
      evBtn.style.display = hasEvents ? '' : 'none';
      evBtn.classList.toggle('active', hasEvents && state.showEvents);
    }

    updateStatBadge(sample);

    var theme = getChartTheme();
    var stage = el('chart-stage');

    if (sample.type === 'candlestick') {
      var pc = document.createElement('div'); pc.className = 'chart-canvas'; stage.appendChild(pc);
      var inst = PriceChart.create(pc, theme);
      PriceChart.setData(inst, sample.data.ohlc);
      applyPriceAnnotations(inst);
      attachPriceAnnotationHandler(inst, pc);
      state.priceInsts.push(inst);
      state.priceEl = pc;
    } else if (sample.type === 'kpi') {
      renderKpi(sample.data);
    } else if (sample.type === 'perf') {
      var c = document.createElement('div'); c.className = 'chart-canvas'; stage.appendChild(c);
      var ci = ChartFactory.render(c, sample.type, sample.data, theme);
      attachAnnotationHandler(ci);
      attachExtremeLabels(ci);
      state.echartsEl = c;
      renderPerfMetrics(sample.data, ci);
    } else if (sample.type === 'worldMap' && state.tableView) {
      renderWorldTable(sample.data);
    } else {
      var c2 = document.createElement('div'); c2.className = 'chart-canvas'; stage.appendChild(c2);
      var renderType = sample.type;
      if (state.overrideType && sample.data && sample.data.labels !== undefined && sample.data.series !== undefined) renderType = state.overrideType;
      var renderData = sample.data;
      if (state.overlaySeries.length && sample.data.labels !== undefined && sample.data.series !== undefined) {
        var merged = mergeOverlaySeries(sample.data.labels, sample.data.series, state.overlaySeries);
        merged.unit = sample.data.unit;
        merged.events = sample.data.events;
        merged.annotations = sample.data.annotations;
        merged.seriesColors = sample.data.seriesColors;
        renderData = merged;
      }
      if (renderData.labels !== undefined && renderData.series !== undefined) {
        var ranged2 = applyTimeRange(renderData.labels, renderData.series);
        renderData.labels = ranged2.labels; renderData.series = ranged2.series;
      }
      var ci2 = ChartFactory.render(c2, renderType, renderData, theme);
      attachAnnotationHandler(ci2);
      attachExtremeLabels(ci2);
      state.echartsEl = c2;
    }
    var tableBtn = el('btn-table');
    if (tableBtn) tableBtn.style.display = (sample.type === 'worldMap') ? '' : 'none';
    renderEventNotes(hasEvents && state.showEvents ? EVENTS[id] : []);
    var anTypes = { area: 1, step: 1, dual: 1, stacked: 1, stackedBar: 1, line: 1 };
    if (anTypes[sample.type]) analysisFromSample(sample);
    el('hint').textContent = '内置示例 · 数据仅本地处理';
    syncToolbar();
  }

  function analysisFromSample(sample) {
    var d = sample.data;
    if (!d || !d.labels) return;
    var seriesArr = [];
    if (d.series) seriesArr = d.series;
    else if (d.bars || d.lines) {
      (d.bars || []).forEach(function (b) { seriesArr.push({ name: b.name, values: b.values }); });
      (d.lines || []).forEach(function (l) { seriesArr.push({ name: l.name, values: l.values }); });
    }
    if (seriesArr.length) renderAnalysis(d.labels, seriesArr);
  }

  function renderEventNotes(events) {
    var box = el('event-notes');
    if (!box) return;
    if (!events || !events.length) { box.style.display = 'none'; box.innerHTML = ''; return; }
    box.style.display = '';
    var html = '<div class="en-title">事件标注</div>';
    events.forEach(function (e) {
      html += '<div class="en-item"><span class="en-dot"></span><span class="en-time">' + e.x + '</span><b>' + e.label + '</b><span class="en-desc">' + (e.desc || '') + '</span></div>';
    });
    box.innerHTML = html;
  }

  function pmiCategory(name) {
    var s = String(name);
    if (/需求|订单|出口|进口/.test(s)) return '需求';
    if (/生产|产出|开工/.test(s)) return '生产';
    if (/采购|库存|原材料/.test(s)) return '采购库存';
    if (/就业|人员|从业|用工/.test(s)) return '就业';
    if (/配送|供应/.test(s)) return '供应商';
    if (/价格|出厂|购进/.test(s)) return '价格';
    return '其他';
  }

  function clearAnalysis() {
    var box = el('analysis');
    if (box) { box.style.display = 'none'; box.innerHTML = ''; }
  }

  /* 分析板块：各指标本月环比 / 同比变动（PMI 分项按需求/生产/采购/库存分组） */
  function renderAnalysis(labels, seriesArr) {
    var box = el('analysis');
    if (!box) return;
    if (!labels || !labels.length || !seriesArr || !seriesArr.length) { clearAnalysis(); return; }
    var freq = DataLoader.inferFreq(labels);
    var lag = freq === 'month' ? 12 : freq === 'quarter' ? 4 : freq === 'year' ? 1 : 1;
    function pct(cur, base) {
      if (base === undefined || base === null || isNaN(cur) || isNaN(base) || base === 0) return null;
      return (cur - base) / Math.abs(base) * 100;
    }
    function fmtV(x) { return (x === null || x === undefined || isNaN(x)) ? '—' : fmtNum(x); }
    function fmtD(x) {
      if (x === null || x === undefined || isNaN(x)) return '<span class="an-na">—</span>';
      var cls = x >= 0 ? 'pos' : 'neg';
      return '<span class="' + cls + '">' + (x >= 0 ? '+' : '') + x.toFixed(2) + '%</span>';
    }
    var rows = seriesArr.map(function (s) {
      var v = s.values, n = v.length;
      var last = v[n - 1], prev = v[n - 2], base = v[n - 1 - lag];
      return { name: s.name, last: last, mom: pct(last, prev), yoy: pct(last, base), cat: pmiCategory(s.name) };
    }).filter(function (r) { return r.last !== undefined && r.last !== null && !isNaN(r.last); });
    if (!rows.length) { clearAnalysis(); return; }

    var isPMI = rows.some(function (r) { return r.cat !== '其他'; });
    var html = '<div class="an-title">数据变动分析<span class="an-sub">（最新值 · 环比 · 同比）</span></div>';
    if (isPMI) {
      var cats = ['需求', '生产', '采购库存', '就业', '供应商', '价格', '其他'];
      cats.forEach(function (cat) {
        var items = rows.filter(function (r) { return r.cat === cat; });
        if (!items.length) return;
        html += '<div class="an-cat">' + cat + '</div>';
        items.forEach(function (r) { html += anRow(r, fmtV, fmtD); });
      });
    } else {
      html += '<div class="an-cat">全部指标</div>';
      rows.forEach(function (r) { html += anRow(r, fmtV, fmtD); });
    }
    box.innerHTML = html;
    box.style.display = '';
  }

  function anRow(r, fmtV, fmtD) {
    return '<div class="an-row"><span class="an-name">' + r.name + '</span>' +
      '<span class="an-last">' + fmtV(r.last) + '</span>' +
      '<span class="an-delta">环比 ' + fmtD(r.mom) + '</span>' +
      '<span class="an-delta">同比 ' + fmtD(r.yoy) + '</span></div>';
  }

  function buildPerfMetricsHtml(nav, slice) {
    var full = ML.perfMetrics(nav.map(function (p) { return p.value; }), null, nav.map(function (p) { return p.date; }));
    var win = (slice && slice.length >= 2) ? ML.perfMetrics(slice.map(function (p) { return p.value; }), null, slice.map(function (p) { return p.date; })) : full;
    function pct(x) { return (x === null || x === undefined || isNaN(x)) ? '—' : (x >= 0 ? '+' : '') + (x * 100).toFixed(2) + '%'; }
    function num(x) { return (x === null || x === undefined || isNaN(x)) ? '—' : x.toFixed(2); }
    var rows = [
      ['年化收益', pct(full.annReturn), pct(win.annReturn)],
      ['年化波动', pct(full.annVol), pct(win.annVol)],
      ['最大回撤', pct(full.maxDD), pct(win.maxDD)],
      ['夏普比率', num(full.sharp), num(win.sharp)],
      ['VaR(95%)', pct(full.var95), pct(win.var95)],
      ['累计收益', pct(full.totalReturn), pct(win.totalReturn)]
    ];
    var html = '<div class="perf-head">业绩指标 <span class="perf-sub">左列全周期 · 右列缩放区间</span></div>';
    rows.forEach(function (r) {
      html += '<div class="perf-row"><span class="perf-name">' + r[0] + '</span><span class="perf-v">' + r[1] + '</span><span class="perf-v win">' + r[2] + '</span></div>';
    });
    return html;
  }

  function makeDraggable(elm) {
    var head = elm.querySelector('.perf-head');
    if (!head) return;
    head.style.cursor = 'move';
    head.addEventListener('mousedown', function (e) {
      e.preventDefault();
      var rect = elm.getBoundingClientRect();
      var offX = e.clientX - rect.left, offY = e.clientY - rect.top;
      function onMove(ev) {
        var stage = el('chart-stage').getBoundingClientRect();
        var x = ev.clientX - stage.left - offX;
        var y = ev.clientY - stage.top - offY;
        elm.style.left = Math.max(0, Math.min(x, stage.width - elm.offsetWidth)) + 'px';
        elm.style.top = Math.max(0, Math.min(y, stage.height - elm.offsetHeight)) + 'px';
        elm.style.right = 'auto';
      }
      function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
  }

  function renderPerfMetrics(data, inst) {
    var wrap = document.createElement('div');
    wrap.className = 'perf-metrics';
    wrap.innerHTML = buildPerfMetricsHtml(data.nav);
    el('chart-stage').appendChild(wrap);
    makeDraggable(wrap);
    if (inst && inst.on) {
      inst.on('datazoom', function () {
        var opt = inst.getOption();
        var dz = opt.dataZoom && opt.dataZoom[0];
        var start = dz ? dz.start : 0, end = dz ? dz.end : 100;
        var n = data.nav.length;
        var s = Math.floor(n * start / 100), e = Math.ceil(n * end / 100);
        wrap.innerHTML = buildPerfMetricsHtml(data.nav, data.nav.slice(s, e));
        makeDraggable(wrap);
      });
    }
  }

  /* ---------- 业绩评估模块（上传价格/净值数据） ---------- */
  function renderPerfFromUpload() {
    var table = state.table;
    if (!table) { toast('请先上传数据'); return; }
    var timeCol = state.mapping.timeCol;
    var yCols = state.mapping.yCols.filter(function (c) { return c !== timeCol; });
    if (!yCols.length) { toast('请选择至少一个价格/净值列'); return; }
    var navs = [];
    yCols.forEach(function (col) {
      var nav = [];
      table.rows.forEach(function (r) {
        var v = DataLoader.toNum(r[col]);
        if (!isNaN(v) && v > 0) nav.push({ date: String(r[timeCol]), value: v });
      });
      if (nav.length >= 2) navs.push({ name: col, nav: nav });
    });
    if (!navs.length) { toast('所选列无有效价格数据'); return; }

    clearStage();
    state.mode = 'imported'; state.isImported = true; state.viewKey = 'perf-upload';
    state.macroItem = null; state.chartConfig = null;
    highlightNav(null);
    el('btn-events').style.display = 'none';
    el('stat-badge').style.display = 'none';
    el('hint').textContent = '业绩评估 · 基于所选价格/净值列';
    setHead({ title: '业绩评估', subtitle: '', unit: '净值', source: '用户数据' });

    var theme = getChartTheme();
    if (navs.length === 1) {
      // 单指标：净值 + 回撤 + 指标卡
      var data = { name: navs[0].name, nav: navs[0].nav };
      var c = document.createElement('div'); c.className = 'chart-canvas'; el('chart-stage').appendChild(c);
      var ci = ChartFactory.render(c, 'perf', data, theme);
      renderPerfMetrics(data, ci);
      renderFinanceMetricsTable(navs[0].nav.map(function (p) { return p.date; }), [{ name: navs[0].name, values: navs[0].nav.map(function (p) { return p.value; }) }], true);
      state.echartsEl = c;
    } else {
      // 多指标：归一化净值对比（上）+ 首个回撤（下）+ 指标表
      var labels = navs[0].nav.map(function (p) { return p.date; });
      var series = navs.map(function (x) {
        var base = x.nav[0].value;
        var m = {};
        x.nav.forEach(function (p) { m[p.date] = p.value; });
        return { name: x.name, values: labels.map(function (d) { return m[d] ? (m[d] / base) : null; }) };
      });
      var dd = [];
      var peak = -Infinity;
      navs[0].nav.forEach(function (p) { peak = Math.max(peak, p.value); dd.push(Math.round((p.value / peak - 1) * 10000) / 100); });
      var c2 = document.createElement('div'); c2.className = 'chart-canvas'; el('chart-stage').appendChild(c2);
      var inst = echarts.init(c2);
      inst.setOption(buildMultiNavPerfOption(theme, labels, series, dd));
      state.echartsEl = c2;
      renderFinanceMetricsTable(labels, series, true);
      renderPerfTable(navs);
    }
    syncToolbar();
  }

  function buildMultiNavPerfOption(theme, labels, series, dd) {
    return {
      backgroundColor: theme.bg,
      tooltip: {
        trigger: 'axis', confine: true,
        backgroundColor: theme.panel, borderColor: theme.accent + '55', borderWidth: 1,
        textStyle: { color: theme.text, fontSize: 12 }
      },
      legend: { top: 8, textStyle: { color: theme.muted }, data: series.map(function (s) { return s.name; }).concat(['回撤']) },
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      grid: [
        { left: 12, right: 16, top: 46, height: '48%', containLabel: true },
        { left: 12, right: 16, bottom: 8, height: '24%', containLabel: true }
      ],
      xAxis: [
        { type: 'category', gridIndex: 0, data: labels, axisLabel: { show: false, color: theme.muted } },
        { type: 'category', gridIndex: 1, data: labels, axisLabel: { color: theme.muted, fontSize: 10 } }
      ],
      yAxis: [
        { type: 'value', gridIndex: 0, scale: true, splitLine: { lineStyle: { color: theme.grid } } },
        { type: 'value', gridIndex: 1, max: 0, axisLabel: { color: theme.muted, fontSize: 10, formatter: '{value}%' }, splitLine: { lineStyle: { color: theme.grid } } }
      ],
      dataZoom: [{ type: 'inside', xAxisIndex: [0, 1], zoomOnMouseWheel: true, moveOnMouseMove: true }],
      series: series.map(function (s, i) {
        return { name: s.name, type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: s.values, symbol: 'none', color: theme.series[i % theme.series.length], lineStyle: { width: 2 } };
      }).concat([
        { name: '回撤', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: dd, symbol: 'none', color: theme.down, lineStyle: { width: 1.2 }, areaStyle: { color: ChartFactory.hexToRgba(theme.down, 0.18) } }
      ])
    };
  }

  /* 多资产对比表（图表下方）：最新值/涨跌幅/高低/均值 + 价格型再补业绩指标 */
  function renderCompareTable(labels, series) {
    if (!series || series.length < 2) return null;
    var priceLike = series.every(function (s) {
      return s.values.some(function (v) { return v !== null && v !== undefined && !isNaN(v) && v > 0; });
    });
    var rows = ['latest', 'change', 'max', 'min', 'mean'];
    var rowNames = { latest: '最新值', change: '区间涨跌幅', max: '最高', min: '最低', mean: '均值' };
    if (priceLike) {
      rows = rows.concat(['annReturn', 'annVol', 'maxDD', 'sharp']);
      rowNames.annReturn = '年化收益'; rowNames.annVol = '年化波动'; rowNames.maxDD = '最大回撤'; rowNames.sharp = '夏普';
    }
    function stats(values) {
      var vv = values.filter(function (v) { return v !== null && v !== undefined && !isNaN(v); });
      if (vv.length < 2) return null;
      var first = vv[0], last = vv[vv.length - 1];
      var s = { latest: last, change: (first !== 0 ? (last - first) / Math.abs(first) * 100 : null), max: Math.max.apply(null, vv), min: Math.min.apply(null, vv), mean: ML.mean(vv) };
      if (priceLike) { var pm = ML.perfMetrics(vv); s.annReturn = pm.annReturn; s.annVol = pm.annVol; s.maxDD = pm.maxDD; s.sharp = pm.sharp; }
      return s;
    }
    var statsArr = series.map(function (s) { return stats(s.values); });
    var html = '<div class="an-head">多资产对比</div><table class="preview-table"><thead><tr><th>指标</th>';
    series.forEach(function (s) { html += '<th>' + s.name + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function (k) {
      html += '<tr><td>' + rowNames[k] + '</td>';
      statsArr.forEach(function (st) {
        var v = st ? st[k] : null;
        var txt = '—';
        if (v !== null && v !== undefined && !isNaN(v)) {
          if (k === 'change' || k === 'annReturn' || k === 'annVol' || k === 'maxDD') txt = (v * 100).toFixed(2) + '%';
          else if (k === 'sharp') txt = v.toFixed(2);
          else txt = fmtNum(v);
        }
        html += '<td>' + txt + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    var wrap = document.createElement('div');
    wrap.className = 'analysis';
    wrap.innerHTML = html;
    el('chart-stage').appendChild(wrap);
    return wrap;
  }

  /* 宏观多指标：下方列出每期数据的明细表 */
  function renderPeriodTable(labels, series) {
    if (!series || series.length < 2) return null;
    var html = '<div class="an-head">分期数据</div>';
    html += '<div style="max-height:340px;overflow:auto"><table class="preview-table"><thead><tr><th>时间</th>';
    series.forEach(function (s) { html += '<th>' + s.name + '</th>'; });
    html += '</tr></thead><tbody>';
    for (var i = labels.length - 1; i >= 0; i--) {
      html += '<tr><td>' + labels[i] + '</td>';
      for (var j = 0; j < series.length; j++) {
        var v = series[j].values[i];
        html += '<td>' + (v === null || v === undefined || isNaN(v) ? '—' : fmtNum(v)) + '</td>';
      }
      html += '</tr>';
    }
    html += '</tbody></table></div>';
    var wrap = document.createElement('div');
    wrap.className = 'analysis';
    wrap.innerHTML = html;
    el('chart-stage').appendChild(wrap);
    return wrap;
  }

  /* 金融资产：业绩指标表（年化回报/波动/回撤/夏普/索提诺/M²/Jensen alpha 等） */
  function financeBenchmark() {
    var D = window.FINANCE_DATA;
    if (!D) return null;
    var found = null;
    (D.sections || []).forEach(function (sec) {
      (sec.items || []).forEach(function (it) {
        if (!found && it.title === '沪深300') found = it;
      });
    });
    return found;
  }
  function renderFinanceMetricsTable(labels, series, isFund, levelMode) {
    if (!series || !series.length) return null;
    var metrics, rows, pctRows, head;
    if (levelMode) {
      // 利率/波动率等点位型：不适用收益率指标，用水平统计
      function lv(values) {
        var v = values.filter(function (x) { return x !== null && x !== undefined && !isNaN(x); });
        if (!v.length) return null;
        return {
          latest: v[v.length - 1], mean: ML.mean(v),
          max: Math.max.apply(null, v), min: Math.min.apply(null, v),
          change: v[v.length - 1] - v[0], std: ML.std(v)
        };
      }
      metrics = series.map(function (s) { return lv(s.values); });
      rows = [['latest', '最新值'], ['mean', '平均值'], ['max', '最高'], ['min', '最低'], ['change', '区间变化'], ['std', '标准差']];
      pctRows = [];
      head = '水平统计（利率/点位 · 不适用收益率指标）';
    } else {
      var bench = isFund ? financeBenchmark() : null;
      var benchVals = bench ? alignSeriesToBase(labels, bench.labels, bench.series[0].values) : null;
      metrics = series.map(function (s) { return ML.perfMetrics(s.values, benchVals, labels); });
      rows = [['annReturn', '年化回报'], ['annVol', '年化波动（标准差）'], ['maxDD', '最大回撤'], ['sharp', '夏普比率']];
      if (isFund) rows = rows.concat([['sortino', '索提诺比率'], ['m2', 'M²'], ['alpha', '詹森 alpha'], ['beta', 'Beta']]);
      rows = rows.concat([['calmar', '卡玛比率'], ['var95', 'VaR 95%'], ['totalReturn', '累计收益']]);
      pctRows = ['annReturn', 'annVol', 'maxDD', 'totalReturn', 'var95', 'alpha', 'm2'];
      head = '业绩指标' + (isFund ? '（基金 · 基准：沪深300 · 无风险利率 2%）' : '（无风险利率 2%）');
    }
    var html = '<div class="an-head">' + head + '</div>';
    html += '<div style="overflow:auto"><table class="preview-table"><thead><tr><th>指标</th>';
    series.forEach(function (s) { html += '<th>' + s.name + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function (r) {
      html += '<tr><td>' + r[1] + '</td>';
      metrics.forEach(function (m) {
        var v = m ? m[r[0]] : null;
        var txt = '—';
        if (v !== null && v !== undefined && !isNaN(v)) {
          txt = (pctRows.indexOf(r[0]) >= 0) ? (v * 100).toFixed(2) + '%' : v.toFixed(2);
        }
        html += '<td>' + txt + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    var wrap = document.createElement('div');
    wrap.className = 'analysis';
    wrap.innerHTML = html;
    el('chart-stage').appendChild(wrap);
    return wrap;
  }

  function renderPerfTable(navs, slice) {
    var wrap = document.createElement('div');
    wrap.className = 'analysis';
    var rows = ['annReturn', 'annVol', 'maxDD', 'sharp', 'var95', 'totalReturn'];
    var labels2 = { annReturn: '年化收益', annVol: '年化波动', maxDD: '最大回撤', sharp: '夏普比率', var95: 'VaR(95%)', totalReturn: '累计收益' };
    function pct(v) { return (v * 100).toFixed(2) + '%'; }
    function metricsOf(x) {
      var nav = slice ? slice(x.nav) : x.nav;
      return ML.perfMetrics(nav.map(function (p) { return p.value; }), null, nav.map(function (p) { return p.date; }));
    }
    var metrics = navs.map(metricsOf);
    var html = '<div class="an-head">业绩指标（基于所选价格/净值列）</div><table class="preview-table"><thead><tr><th>指标</th>';
    navs.forEach(function (x) { html += '<th>' + x.name + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function (k) {
      html += '<tr><td>' + labels2[k] + '</td>';
      metrics.forEach(function (m) {
        var v = m ? m[k] : null;
        var txt = (v === null || v === undefined) ? '—' : (k === 'sharp' ? v.toFixed(2) : pct(v));
        html += '<td>' + txt + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    wrap.innerHTML = html;
    el('chart-stage').appendChild(wrap);
    return wrap;
  }

  /* 价格型多指标：图表下对比指标表，随缩放区间联动更新 */
  function renderPerfTableLive(inst, navs) {
    var wrap = renderPerfTable(navs);
    if (inst && inst.on) {
      inst.on('datazoom', function () {
        try {
          var opt = inst.getOption();
          var dz = opt.dataZoom && opt.dataZoom[0];
          var start = dz ? dz.start : 0, end = dz ? dz.end : 100;
          wrap.innerHTML = renderPerfTableHtml(navs, function (nav) {
            var n = nav.length;
            var s = Math.floor(n * start / 100), e = Math.ceil(n * end / 100);
            return nav.slice(s, e);
          });
        } catch (e) {}
      });
    }
  }

  function renderPerfTableHtml(navs, slice) {
    var rows = ['annReturn', 'annVol', 'maxDD', 'sharp', 'var95', 'totalReturn'];
    var labels2 = { annReturn: '年化收益', annVol: '年化波动', maxDD: '最大回撤', sharp: '夏普比率', var95: 'VaR(95%)', totalReturn: '累计收益' };
    function pct(v) { return (v * 100).toFixed(2) + '%'; }
    var metrics = navs.map(function (x) { var nav = slice ? slice(x.nav) : x.nav; return ML.perfMetrics(nav.map(function (p) { return p.value; }), null, nav.map(function (p) { return p.date; })); });
    var html = '<div class="an-head">业绩指标（基于所选价格/净值列）</div><table class="preview-table"><thead><tr><th>指标</th>';
    navs.forEach(function (x) { html += '<th>' + x.name + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function (k) {
      html += '<tr><td>' + labels2[k] + '</td>';
      metrics.forEach(function (m) {
        var v = m ? m[k] : null;
        var txt = (v === null || v === undefined) ? '—' : (k === 'sharp' ? v.toFixed(2) : pct(v));
        html += '<td>' + txt + '</td>';
      });
      html += '</tr>';
    });
    return html + '</tbody></table>';
  }

  /* ---------- 机器学习模块（上传数据） ---------- */
  function renderMlFromUpload() {
    var table = state.table, timeCol = state.mapping.timeCol;
    var col = state.mapping.yCols.filter(function (c) { return c !== timeCol; })[0];
    if (!col) { toast('请选择至少一个数值列'); return; }
    var labels = [], values = [];
    table.rows.forEach(function (r) { var v = DataLoader.toNum(r[col]); if (!isNaN(v)) { labels.push(String(r[timeCol])); values.push(v); } });
    if (labels.length < 3) { toast('有效数据点太少，无法做回归'); return; }
    clearStage();
    state.mode = 'imported'; state.isImported = true; state.viewKey = 'ml-upload';
    state.macroItem = null; state.chartConfig = null;
    highlightNav(null);
    el('btn-events').style.display = 'none'; el('stat-badge').style.display = 'none';
    setHead({ title: col + ' · 回归趋势', subtitle: '线性回归 · 95% 置信带', unit: '', source: '用户数据' });
    var theme = getChartTheme();
    var c = document.createElement('div'); c.className = 'chart-canvas'; el('chart-stage').appendChild(c);
    var ci = ChartFactory.render(c, 'mlTrend', { labels: labels, values: values }, theme);
    state.echartsEl = c;
    el('hint').textContent = '机器学习 · 回归趋势与置信带';
    syncToolbar();
  }

  /* ---------- 宏观分析模块（上传数据：同比/环比） ---------- */
  function renderMacroFromUpload() {
    var table = state.table, timeCol = state.mapping.timeCol;
    var labels0 = table.rows.map(function (r) { return String(r[timeCol]); });
    var freq = DataLoader.inferFreq(labels0);
    var lag = (freq === 'month') ? 12 : (freq === 'quarter') ? 4 : 1;
    var sub = DataLoader.pctChange(table, timeCol, lag);
    if (!sub || !sub.rows.length) { toast('无法计算同比/环比'); return; }
    var labels = sub.rows.map(function (r) { return String(r[timeCol]); });
    var cols = sub.columns.filter(function (c) { return c !== timeCol; });
    var series = cols.map(function (c) { return { name: c, values: sub.rows.map(function (r) { return vnum(r[c]); }) }; });
    clearStage();
    state.mode = 'imported'; state.isImported = true; state.viewKey = 'macro-upload';
    state.macroItem = null; state.chartConfig = null;
    highlightNav(null);
    el('btn-events').style.display = 'none'; el('stat-badge').style.display = 'none';
    setHead({ title: (lag === 12 ? '同比' : (lag === 4 ? '环比(季)' : '环比')) + '变化', subtitle: '基于所选指标 · 单位：%', unit: '%', source: '用户数据' });
    var theme = getChartTheme();
    var c = document.createElement('div'); c.className = 'chart-canvas'; el('chart-stage').appendChild(c);
    var ci = ChartFactory.render(c, 'line', { labels: labels, series: series }, theme);
    attachExtremeLabels(ci);
    state.echartsEl = c;
    el('hint').textContent = '宏观分析 · 同比/环比（可在「数据变换」里进一步调整）';
    syncToolbar();
  }

  function suggestGoal(det, table) {
    return 'trend';
  }

  /* 是否价格/净值型（指数点位、股价等，中位数>50） */
  function isPriceLike(table, det) {
    if (!table || !det || !det.numericCols) return false;
    var col = det.numericCols[0];
    if (!col || col === det.timeCol) return false;
    var vals = [];
    table.rows.slice(-300).forEach(function (r) { var v = DataLoader.toNum(r[col]); if (!isNaN(v) && v > 0) vals.push(v); });
    if (vals.length < 3) return false;
    vals.sort(function (a, b) { return a - b; });
    return vals[Math.floor(vals.length / 2)] > 50;
  }

  /* 检测是否"已计算好的相关矩阵"（方阵 + 首列标签与列名一致） */
  function detectCorrMatrix(table, det) {
    if (!table || !det || !det.numericCols || det.numericCols.length < 3) return null;
    if (table.rows.length !== det.numericCols.length) return null;
    var labelCol = det.timeCol;
    if (!labelCol) return null;
    var names = det.numericCols.map(function (c) { return String(c).trim(); });
    var labels = table.rows.map(function (r) { return String(r[labelCol]).trim(); });
    var match = 0;
    names.forEach(function (n, i) { if (labels[i] === n) match++; });
    if (match / names.length < 0.8) return null;
    var matrix = [];
    for (var i = 0; i < names.length; i++) {
      var row = [];
      for (var j = 0; j < names.length; j++) row.push(DataLoader.toNum(table.rows[i][names[j]]));
      matrix.push(row);
    }
    return { names: names, matrix: matrix };
  }

  /* 价格型列把 0 视为"无数据"（指数/资产未成立前填 0） */
  function markZerosAsEmpty(table, det) {
    if (!table || !det || !det.numericCols) return table;
    det.numericCols.forEach(function (col) {
      if (col === det.timeCol) return;
      var vals = [];
      table.rows.forEach(function (r) { var v = DataLoader.toNum(r[col]); if (!isNaN(v) && v > 0) vals.push(v); });
      if (vals.length < 3) return;
      vals.sort(function (a, b) { return a - b; });
      var median = vals[Math.floor(vals.length / 2)];
      if (median > 50) { // 价格/点位型（中位数>50），0 视为无数据
        table.rows.forEach(function (r) { if (DataLoader.toNum(r[col]) === 0) r[col] = ''; });
      }
    });
    return table;
  }

  function renderWorldTable(data) {
    var stage = el('chart-stage');
    var wrap = document.createElement('div');
    wrap.className = 'table-view';
    var rows = data.values.slice().sort(function (a, b) { return b.value - a.value; });
    var html = '<table class="preview-table"><thead><tr><th>国家/地区</th><th>GDP 增速(%)</th></tr></thead><tbody>';
    rows.forEach(function (r) { html += '<tr><td>' + r.name + '</td><td>' + (r.value > 0 ? '+' : '') + r.value + '</td></tr>'; });
    html += '</tbody></table>';
    wrap.innerHTML = html;
    stage.appendChild(wrap);
  }

  function updateStatBadge(sample) {
    var badge = el('stat-badge');
    if (!badge) return;
    var d = sample.data;
    var value = null, delta = null;
    if (d && d.ohlc && d.ohlc.length) {
      var last = d.ohlc[d.ohlc.length - 1], prev = d.ohlc[d.ohlc.length - 2];
      value = last.close;
      if (prev) delta = (last.close - prev.close) / prev.close * 100;
    } else if (d && d.series && d.series.length) {
      var v = d.series[0].values, n = v.length;
      value = v[n - 1];
      if (n >= 2 && typeof v[n - 2] === 'number' && v[n - 2] !== 0) delta = (v[n - 1] - v[n - 2]) / Math.abs(v[n - 2]) * 100;
    } else if (d && Array.isArray(d.values)) {
      var vv = d.values, nn = vv.length;
      value = vv[nn - 1];
      if (nn >= 2 && vv[nn - 2] !== 0) delta = (vv[nn - 1] - vv[nn - 2]) / Math.abs(vv[nn - 2]) * 100;
    }
    if (value === null || value === undefined) { badge.style.display = 'none'; return; }
    badge.style.display = '';
    var html = '<span class="stat-value">' + fmtNum(value) + '</span>';
    if (delta !== null && delta !== undefined && isFinite(delta)) {
      html += '<span class="stat-delta ' + (delta >= 0 ? 'pos' : 'neg') + '">' +
        (delta >= 0 ? '▲' : '▼') + ' ' + Math.abs(delta).toFixed(1) + '%</span>';
    }
    badge.innerHTML = html;
  }

  function renderKpi(data) {
    var stage = el('chart-stage');
    var grid = document.createElement('div');
    grid.className = 'kpi-grid';
    var theme = Themes.active();
    data.cards.forEach(function (card) {
      var cardEl = document.createElement('div');
      cardEl.className = 'kpi-card';
      cardEl.innerHTML =
        '<div class="kpi-label">' + card.label + '</div>' +
        '<div class="kpi-value">' + card.value + '</div>' +
        '<div class="kpi-delta ' + card.dir + '">' + card.delta + '</div>' +
        '<div class="kpi-spark"></div>';
      grid.appendChild(cardEl);
    });
    stage.appendChild(grid);
    grid.querySelectorAll('.kpi-spark').forEach(function (sparkEl, i) {
      var color = data.cards[i].dir === 'neg' ? theme.chart.down : theme.chart.accent;
      ChartFactory.renderKpiSpark(sparkEl, data.cards[i].spark, theme.chart, color);
    });
  }

  /* ---------- 主题 ---------- */
  function buildThemeSelect() {
    var sel = el('theme-select');
    Themes.ids().forEach(function (id) {
      var o = document.createElement('option');
      o.value = id;
      o.textContent = Themes.getTheme(id).name;
      sel.appendChild(o);
    });
    sel.value = state.theme;
    sel.addEventListener('change', function () {
      state.theme = sel.value;
      Themes.applyTheme(state.theme);
      rerender();
      toast('已切换配色：' + Themes.active().name);
    });
  }

  function rerender() {
    if (state.macroItem) { openMacroItem(state.macroItem, true); return; }
    if (state.finItem) { openFinItem(state.finItem, true); return; }
    if (state.intlItem) { openIntlItem(state.intlItem, true); return; }
    if (state.exploreConfig) { renderExploreFromConfig(); return; }
    if (state.chartConfig) { applyChartConfig(state.chartConfig); return; }
    if (state.mode === 'dashboard') renderDashboard(state.dashboardDatasets, false);
    else if (state.mode === 'dataset') renderDatasetSingle(state.dataset);
    else if (state.mode === 'imported') renderUserChart(false);
    else if (state.mode === 'home') renderHome();
    else renderTemplate(state.currentTemplate);
  }

  /* ---------- 导出 ---------- */
  function roundRectPath(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function exportImage() {
    var theme = getChartTheme();
    try {
      var imgSrc = null, cw = 0, chh = 0, inst = null;
      if (state.priceEl) {
        var pc = state.priceEl.querySelector('canvas');
        if (pc) { imgSrc = pc.toDataURL('image/png'); cw = pc.width / 2; chh = pc.height / 2; }
      } else if (state.echartsEl) {
        inst = echarts.getInstanceByDom(state.echartsEl);
        if (inst) {
          try { inst.dispatchAction({ type: 'hideTip' }); } catch (e1) {}
          imgSrc = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: theme.bg });
          cw = state.echartsEl.clientWidth; chh = state.echartsEl.clientHeight;
        }
      }
      if (!imgSrc) { toast('当前模版暂不支持导出图片'); return; }

      var W = cw * 2, H = chh * 2;
      var title = (el('chart-title').textContent || '').trim();
      var sub = (el('chart-subtitle').textContent || '').trim();
      var unitEl = el('chart-unit');
      var unit = (unitEl && unitEl.style.display !== 'none' && unitEl.textContent) ? unitEl.textContent.trim() : '';
      var xs = [];
      if (inst) { var o0 = inst.getOption(); xs = (o0.xAxis && o0.xAxis[0] && o0.xAxis[0].data) || []; }
      var rangeTxt = xs.length ? (String(xs[0]) + ' → ' + String(xs[xs.length - 1])) : '';
      var metaParts = [];
      if (sub) metaParts.push(sub);
      if (unit) metaParts.push('单位：' + unit);
      if (rangeTxt) metaParts.push('时间：' + rangeTxt);
      var meta = metaParts.join('    ·    ');

      var pad = 28;
      var titleH = title ? 38 : 0;
      var metaH = meta ? 26 : 0;
      var canvas = document.createElement('canvas');
      canvas.width = W + pad * 2;
      canvas.height = pad + titleH + metaH + H + pad;
      var ctx = canvas.getContext('2d');
      ctx.fillStyle = theme.bg; ctx.fillRect(0, 0, canvas.width, canvas.height);
      var yy = pad;
      if (title) {
        ctx.fillStyle = theme.text;
        ctx.font = 'bold 30px Inter, -apple-system, "PingFang SC", sans-serif';
        ctx.textBaseline = 'top'; ctx.textAlign = 'left';
        ctx.fillText(title, pad, yy);
        yy += titleH;
      }
      if (meta) {
        ctx.fillStyle = theme.muted || '#8A8578';
        ctx.font = '15px Inter, -apple-system, "PingFang SC", sans-serif';
        ctx.textBaseline = 'top'; ctx.textAlign = 'left';
        ctx.fillText(meta, pad, yy);
        yy += metaH;
      }
      var contRect = state.echartsEl ? state.echartsEl.getBoundingClientRect() : null;
      var extLabels = state.echartsEl ? state.echartsEl.querySelectorAll('.ext-label') : [];
      var img = new Image();
      img.onload = function () {
        ctx.drawImage(img, pad, yy, W, H);
        // 把极值标注也画进图片
        if (contRect && extLabels.length) {
          extLabels.forEach(function (lb) {
            var r = lb.getBoundingClientRect();
            var lx = pad + (r.left - contRect.left) * 2;
            var ly = yy + (r.top - contRect.top) * 2;
            var lw = r.width * 2, lh = r.height * 2;
            ctx.fillStyle = lb.style.backgroundColor || theme.accent;
            roundRectPath(ctx, lx, ly, lw, lh, 6);
            ctx.fill();
            ctx.fillStyle = lb.style.color || '#FFFFFF';
            ctx.font = 'bold 20px Inter, -apple-system, "PingFang SC", sans-serif';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(lb.textContent, lx + lw / 2, ly + lh / 2);
            ctx.textAlign = 'left'; ctx.textBaseline = 'top';
          });
        }
        var a = document.createElement('a');
        a.href = canvas.toDataURL('image/png'); a.download = 'chart.png'; a.click();
        toast('图片已导出');
      };
      img.src = imgSrc;
    } catch (e) { toast('导出失败'); }
  }

  function exportSvg() {
    try {
      if (!state.echartsEl) { toast('当前模版暂不支持导出 SVG'); return; }
      var inst = echarts.getInstanceByDom(state.echartsEl);
      if (!inst) { toast('导出失败'); return; }
      var url = inst.getDataURL({ type: 'svg', backgroundColor: 'transparent' });
      var a = document.createElement('a');
      a.href = url; a.download = 'chart.svg'; a.click();
      toast('SVG 已导出');
    } catch (e) { toast('导出失败'); }
  }

  /* ---------- 数据导入弹层 ---------- */
  function openModal() { el('overlay').classList.add('open'); }
  function closeModal() { el('overlay').classList.remove('open'); }

  function buildTabs() {
    el('tabs').addEventListener('click', function (e) {
      var tab = e.target.closest('.tab');
      if (!tab) return;
      document.querySelectorAll('.tab').forEach(function (t) { t.classList.toggle('active', t === tab); });
      document.querySelectorAll('.tab-pane').forEach(function (p) { p.classList.toggle('active', p.dataset.pane === tab.dataset.tab); });
    });
  }

  function buildGoalCards() {
    var box = el('analysis-goal');
    if (!box) return;
    box.innerHTML = '';
    GOALS.forEach(function (g) {
      var card = document.createElement('div');
      card.className = 'goal-card' + (state.analysisGoal === g.id ? ' on' : '');
      card.dataset.goal = g.id;
      card.innerHTML = '<span class="goal-icon">' + g.icon + '</span><span class="goal-text"><b>' + g.label + '</b><i>' + g.desc + '</i></span>';
      card.addEventListener('click', function () { state.analysisGoal = g.id; buildGoalCards(); });
      box.appendChild(card);
    });
  }

  function buildSampleTab() {
    var list = el('sample-list');
    list.innerHTML = '';
    var samples = [
      { label: '时间序列示例（日期 + 多列数值）', csv: '日期,中国GDP增速,美国GDP增速\n2019,6.0,2.5\n2020,2.2,-2.2\n2021,8.4,5.8\n2022,3.0,1.9\n2023,5.2,2.5\n2024,5.0,2.8' },
      { label: 'K 线示例（日期 + OHLC + 成交量）', csv: '日期,open,high,low,close,volume\n2024-04-01,45.6,46.2,44.9,45.8,1200000\n2024-04-02,45.8,46.5,45.1,46.2,1350000\n2024-04-03,46.2,47.0,45.8,46.6,1100000\n2024-04-04,46.6,46.9,45.4,45.7,980000\n2024-04-05,45.7,46.3,45.2,46.1,1020000' }
    ];
    samples.forEach(function (s) {
      var b = document.createElement('button');
      b.className = 'btn';
      b.style.margin = '4px';
      b.textContent = s.label;
      b.addEventListener('click', function () {
        el('csv-text').value = s.csv;
        document.querySelector('.tab[data-tab="csv"]').click();
      });
      list.appendChild(b);
    });
  }

  /* ---------- 解析 + 映射 ---------- */
  function updateChartTypeHint() {
    var hint = el('y-hint');
    if (!hint) return;
    var t = el('chart-type').value;
    if (t === 'radar') hint.textContent = state.transposed
      ? '转置：首列为维度，数值列为实体/对象'
      : '每行 = 一个实体，Y 列为维度指标';
    else if (t === 'rank') hint.textContent = '选 1 列作为排名数值';
    else hint.textContent = '点击选择一列或多列作为数值系列';
  }

  function syncExtremeBtn() {
    var b = el('btn-labels');
    if (b) b.classList.toggle('active', state.labelMode === 'extreme');
  }

  function syncToolbar() {
    var tb = el('chart-toolbar');
    if (tb) tb.style.display = (state.mode === 'home' || state.mode === 'macro') ? 'none' : '';
    syncExtremeBtn();
    var sel = el('toolbar-chart-type');
    if (!sel) return;
    var isData = (state.mode === 'imported' || state.mode === 'dataset');
    var isTemplate = (state.mode === 'template');
    var isHighFreq = (state.dataFreq === 'day' && state.mode === 'imported');
    // 示例图/高频数据只做展示，图表类型切换关闭；其他频率可选
    sel.disabled = isTemplate || isHighFreq || !!state.finItem || !(isData || !!state.macroItem);
    if (state.macroItem) {
      var mt = state.macroTypeOverride || state.macroItem.type;
      if (mt && sel.querySelector('option[value="' + mt + '"]')) sel.value = mt;
    } else if (isData) {
      var t = state.mode === 'imported' ? state.mapping.chartType : '';
      if (t && sel.querySelector('option[value="' + t + '"]')) sel.value = t;
    } else if (isTemplate) {
      var s2 = DataLoader.SAMPLES[state.currentTemplate];
      var tv = s2 ? s2.type : '';
      if (tv && sel.querySelector('option[value="' + tv + '"]')) sel.value = tv;
    }
    if (el('tb-swapxy')) el('tb-swapxy').classList.toggle('active', state.transposed);
  }

  function showMapping(table) {
    state.table = table;
    state.uploadedTable = table;
    state.overlaySeries = []; state.macroItem = null; state.finItem = null; state.intlItem = null; state.chartConfig = null; state.macroTypeOverride = null;
    var det0 = DataLoader.detectTable(table);
    if (!det0) { toast('无法解析数据'); return; }
    // 转换 Excel 日期序列号（如 46295 → 2026-09-28）后重新识别
    DataLoader.convertSerialTime(table, det0);
    state.det = DataLoader.detectTable(table) || det0;
    markZerosAsEmpty(table, state.det);
    state.isPriceData = isPriceLike(table, state.det);
    var _lbls = table.rows.slice(0, 20).map(function (r) { return String(r[state.det.timeCol]); });
    state.dataFreq = DataLoader.inferFreq(_lbls);
    state.mapping.timeCol = state.det.timeCol;
    state.mapping.yCols = state.det.ohlc ? [] : state.det.numericCols.filter(function (c) { return c !== state.det.timeCol; });
    state.mapping.chartType = state.det.ohlc ? 'candlestick' : (state.det.isTimeSeries ? 'line' : 'bar');
    state.transposed = false;
    if (el('btn-swapxy')) el('btn-swapxy').classList.remove('active');

    el('mapping-area').style.display = '';
    el('dataset-picker').style.display = 'none';
    var info = '检测到 ' + table.rows.length + ' 行 × ' + table.columns.length + ' 列 · 推荐：' +
      (TYPE_LABELS[state.mapping.chartType] || state.mapping.chartType) + '　|　X 列：' + state.det.timeCol;
    if (state.det.ohlc) info += '　·　已识别 OHLC 列';
    else if (state.det.isTimeSeries) info += '（时间序列）';
    else info += '（分类/实体）';
    if (state.mapping.yCols.length >= 4) info += '　·　检测到多个指标，建议拆分为多个图表';
    var goal = suggestGoal(state.det, table);
    state.analysisGoal = goal; buildGoalCards();
    var goalLabel = { trend: '趋势图', perf: '业绩评估', kline: 'K线' }[goal] || '趋势图';
    el('detect-info').textContent = info + '　·　建议分析目的：' + goalLabel;
    updateChartTypeHint();
    var splitBtn = el('btn-split');
    if (splitBtn) splitBtn.style.display = (state.mapping.yCols.length >= 4) ? '' : 'none';

    // X 列
    var xSel = el('x-col');
    xSel.innerHTML = '';
    table.columns.forEach(function (c) {
      var o = document.createElement('option');
      o.value = c; o.textContent = c;
      xSel.appendChild(o);
    });
    xSel.value = state.mapping.timeCol;

    // Y 列 chips
    renderYChips();
    updatePreview();
  }

  function renderYChips() {
    var box = el('y-cols');
    box.innerHTML = '';
    var numericCols = state.det.numericCols;
    numericCols.forEach(function (c) {
      var chip = document.createElement('div');
      chip.className = 'col-chip' + (state.mapping.yCols.indexOf(c) >= 0 ? ' on' : '');
      chip.textContent = c;
      chip.addEventListener('click', function () {
        var idx = state.mapping.yCols.indexOf(c);
        if (idx >= 0) state.mapping.yCols.splice(idx, 1);
        else state.mapping.yCols.push(c);
        chip.classList.toggle('on');
      });
      box.appendChild(chip);
    });
    if (!numericCols.length) box.innerHTML = '<span class="hint">未检测到数值列</span>';
  }

  function updatePreview() {
    var table = state.table;
    var tbl = el('preview-table');
    var timeCol = state.mapping.timeCol;
    var html = '<thead><tr>';
    table.columns.forEach(function (c) {
      var cls = 'pv-th';
      if (c === timeCol) cls += ' pv-x';
      else if (state.mapping.yCols.indexOf(c) >= 0) cls += ' pv-y';
      html += '<th class="' + cls + '" data-col="' + c + '" title="' + (c === timeCol ? 'X / 时间列' : '点击选择/取消该列作为 Y 数值') + '">' + c + '</th>';
    });
    html += '</tr></thead><tbody>';
    table.rows.slice(0, 60).forEach(function (r) {
      html += '<tr>';
      table.columns.forEach(function (c) {
        var cls = (c === timeCol) ? 'pv-x' : ((state.mapping.yCols.indexOf(c) >= 0) ? 'pv-y' : '');
        html += '<td class="' + cls + '">' + r[c] + '</td>';
      });
      html += '</tr>';
    });
    if (table.rows.length > 60) html += '<tr><td colspan="' + table.columns.length + '" class="pv-more">… 共 ' + table.rows.length + ' 行，仅预览前 60 行（可用下方「数据行范围」选取区间）</td></tr>';
    html += '</tbody>';
    tbl.innerHTML = html;
    // 表头点击切换 Y 列
    tbl.querySelectorAll('th.pv-th').forEach(function (th) {
      th.addEventListener('click', function () {
        var col = th.dataset.col;
        if (col === timeCol) return;
        var idx = state.mapping.yCols.indexOf(col);
        if (idx >= 0) state.mapping.yCols.splice(idx, 1);
        else state.mapping.yCols.push(col);
        renderYChips();
        updatePreview();
      });
    });
  }

  /* 应用数据行范围（选择数据区间后重新识别） */
  function applyRowRange() {
    if (!state.table) return;
    var n = state.table.rows.length;
    var s = parseInt(el('row-start').value, 10), e = parseInt(el('row-end').value, 10);
    if (isNaN(s)) s = 1;
    if (isNaN(e)) e = n;
    if (s < 1 || e > n || s > e) { toast('行范围无效（1 ~ ' + n + '）'); return; }
    state.table.rows = state.table.rows.slice(s - 1, e);
    showMapping(state.table);
    toast('已选择第 ' + s + ' ~ ' + e + ' 行，共 ' + state.table.rows.length + ' 行');
  }

  /* 构建雷达图数据：wide=转置方向（首列为维度、数值列为实体），否则实体为行、维度为列 */
  function buildRadarData(rows, timeCol, yCols, wide) {
    function ceilMax(vals) { return Math.ceil(Math.max.apply(null, vals.concat([0])) * 1.3); }
    if (wide) {
      var labels = rows.map(function (r) { return String(r[timeCol]); });
      return {
        indicators: labels.map(function (lbl, i) {
          var vals = yCols.map(function (col) { return toNum(rows[i][col]); }).filter(function (v) { return v !== null && v !== undefined && isFinite(v); });
          return { name: lbl, max: ceilMax(vals) };
        }),
        series: yCols.map(function (col) {
          return { name: col, values: rows.map(function (r) { return vnum(r[col]); }) };
        })
      };
    }
    return {
      indicators: yCols.map(function (col) {
        var vals = rows.map(function (r) { return vnum(r[col]); }).filter(function (v) { return v !== null && v !== undefined && isFinite(v); });
        return { name: col, max: ceilMax(vals) };
      }),
      series: rows.map(function (r) {
        return { name: String(r[timeCol]), values: yCols.map(function (col) { return vnum(r[col]); }) };
      })
    };
  }

  function renderUserChart(closeAfter) {
    state.macroItem = null; state.finItem = null; state.intlItem = null; state.chartConfig = null; state.macroTypeOverride = null;
    var m = state.mapping;
    var table = state.table;
    if (!table) return;
    state.viewKey = 'imported';
    el('btn-events').style.display = 'none';
    el('stat-badge').style.display = 'none';
    var rows = DataLoader.sortRowsByTime(table.rows, state.mapping.timeCol);
    var theme = getChartTheme();

    // 相关矩阵 → 默认热力图
    var corrM = detectCorrMatrix(table, state.det);
    if (corrM) {
      clearStage();
      state.mode = 'imported'; state.isImported = true; state.currentTemplate = null;
      state.dataset = null; state.dashboardDatasets = null;
      highlightNav(null);
      var cm = document.createElement('div'); cm.className = 'chart-canvas'; el('chart-stage').appendChild(cm);
      ChartFactory.render(cm, 'matrixHeat', corrM, theme);
      state.echartsEl = cm;
      setHead({ title: '相关系数矩阵', subtitle: '热力图 · 数值为相关系数', unit: '', source: '用户数据' });
      el('hint').textContent = '相关矩阵热力图';
      syncToolbar();
      if (closeAfter !== false) closeModal();
      return;
    }

    if (m.chartType === 'candlestick') {
      if (!state.det.ohlc) { toast('未检测到 open/high/low/close 列'); return; }
      var o = state.det.ohlc;
      var ohlc = rows.map(function (r) {
        return {
          time: normalizeTime(r[o.time]),
          open: toNum(r[o.open]), high: toNum(r[o.high]),
          low: toNum(r[o.low]), close: toNum(r[o.close]),
          volume: o.volume ? toNum(r[o.volume]) : 0
        };
      }).filter(function (d) { return isFinite(d.open) && isFinite(d.close); });
      if (!ohlc.length) { toast('K 线数据无效'); return; }
      clearStage();
      var pc = document.createElement('div'); pc.className = 'chart-canvas'; el('chart-stage').appendChild(pc);
      var inst = PriceChart.create(pc, theme);
      PriceChart.setData(inst, ohlc);
      applyPriceAnnotations(inst);
      attachPriceAnnotationHandler(inst, pc);
      state.priceInsts.push(inst);
      state.priceEl = pc;
      setHead({ title: '用户数据 · K 线', subtitle: '', unit: '', source: '' });
    } else {
      var yCols = state.mapping.yCols.slice();
      if (!yCols.length) { toast('请至少选择一个数值列'); return; }
      var labels = rows.map(function (r) { return String(r[state.mapping.timeCol]); });
      var type = state.mapping.chartType;
      var data;
      if (type === 'rank') {
        var col = yCols[0];
        data = { categories: labels, values: rows.map(function (r) { return vnum(r[col]); }) };
      } else if (type === 'radar') {
        var wide = state.det && state.det.orientation === 'wide';
        if (state.transposed) wide = !wide;
        data = buildRadarData(rows, state.mapping.timeCol, yCols, wide);
      } else {
        if (state.transposed) {
          data = { labels: yCols, series: rows.map(function (r) {
            return { name: String(r[state.mapping.timeCol]), values: yCols.map(function (col) { return vnum(r[col]); }) };
          })};
        } else {
          var trimmed = trimToDataRange(labels, yCols.map(function (col) {
            return { name: col, values: rows.map(function (r) { return vnum(r[col]); }) };
          }));
          var ranged3 = applyTimeRange(trimmed.labels, trimmed.series);
          data = { labels: ranged3.labels, series: ranged3.series };
        }
      }
      data.annotations = echartsAnnotations(state.viewKey);
      data.seriesColors = state.seriesColors;
      renderAnalysis(labels, yCols.map(function (col) { return { name: col, values: rows.map(function (r) { return vnum(r[col]); }) }; }));
      clearStage();
      var c = document.createElement('div'); c.className = 'chart-canvas'; el('chart-stage').appendChild(c);
      var uinst = ChartFactory.render(c, type, data, theme);
      attachAnnotationHandler(uinst);
      attachExtremeLabels(uinst);
      state.echartsEl = c;
      setHead({ title: '用户数据 · ' + (TYPE_LABELS[type] || type), subtitle: '', unit: '', source: '' });
      // 价格型多指标：图表下方加对比指标表（随缩放区间更新）
      if (state.isPriceData && yCols.length >= 2) {
        var navsAll = yCols.map(function (col) {
          var nav = [];
          rows.forEach(function (r) { var v = DataLoader.toNum(r[col]); if (!isNaN(v) && v > 0) nav.push({ date: String(r[state.mapping.timeCol]), value: v }); });
          return { name: col, nav: nav };
        }).filter(function (x) { return x.nav.length >= 2; });
        if (navsAll.length >= 2) renderPerfTableLive(uinst, navsAll);
      }
    }
    state.isImported = true;
    state.mode = 'imported';
    state.currentTemplate = null;
    state.dataset = null; state.dashboardDatasets = null;
    highlightNav(null);
    el('hint').textContent = '已加载用户数据';
    syncToolbar();
    if (closeAfter !== false) closeModal();
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    el('btn-import').addEventListener('click', openModal);
    el('btn-more').addEventListener('click', function (e) {
      e.stopPropagation();
      el('tb-menu').classList.toggle('open');
    });
    document.addEventListener('click', function (e) {
      var menu = el('tb-menu');
      if (menu && menu.classList.contains('open') && !menu.contains(e.target) && e.target !== el('btn-more')) {
        menu.classList.remove('open');
      }
    });
    el('back-btn').addEventListener('click', function () { if (state.backFn) state.backFn(); });
    el('btn-menu').addEventListener('click', toggleSidebar);
    el('sidebar-backdrop').addEventListener('click', closeSidebar);
    el('modal-close').addEventListener('click', closeModal);
    el('overlay').addEventListener('click', function (e) { if (e.target === el('overlay')) closeModal(); });
    el('btn-export').addEventListener('click', exportImage);
    el('btn-share-link').addEventListener('click', copyShareLink);
    el('btn-events').addEventListener('click', function () {
      state.showEvents = !state.showEvents;
      rerender();
    });
    el('btn-annot').addEventListener('click', function () {
      state.annotateMode = !state.annotateMode;
      el('btn-annot').classList.toggle('active', state.annotateMode);
      el('chart-stage').classList.toggle('annot-mode', state.annotateMode);
      el('btn-clear-annot').style.display = state.annotateMode ? '' : 'none';
      if (state.annotateMode) toast('标注模式已开启：点击图表绘图区添加说明');
    });
    el('btn-clear-annot').addEventListener('click', function () {
      state.annotations[state.viewKey] = [];
      rerender();
      toast('已清除当前图表的说明');
    });
    el('btn-labels').addEventListener('click', function () {
      state.labelMode = (state.labelMode === 'extreme') ? 'off' : 'extreme';
      this.classList.toggle('active', state.labelMode === 'extreme');
      if (state.echartsEl) {
        var inst = echarts.getInstanceByDom(state.echartsEl);
        if (inst) applyExtremeLabels(inst);
      } else { rerender(); }
    });
    el('btn-watermark').addEventListener('click', function () {
      state.showWatermark = !state.showWatermark;
      ChartFactory.setWatermark(state.showWatermark);
      el('btn-watermark').classList.toggle('active', state.showWatermark);
      rerender();
    });
    el('btn-table').addEventListener('click', function () {
      state.tableView = !state.tableView;
      el('btn-table').classList.toggle('active', state.tableView);
      el('btn-table').textContent = state.tableView ? '◉ 地图视图' : '☰ 表格视图';
      rerender();
    });
    el('btn-transform').addEventListener('click', openTransform);
    el('tf-close').addEventListener('click', closeTransform);
    el('tf-q').addEventListener('click', function () { doTransform('q', el('tf-agg').value); });
    el('tf-y').addEventListener('click', function () { doTransform('y', el('tf-agg').value); });
    el('tf-yoy').addEventListener('click', function () { doTransform('yoy'); });
    el('tf-mom').addEventListener('click', function () { doTransform('mom'); });
    el('tf-cum').addEventListener('click', function () { doTransform('cum'); });
    el('tf-formula-btn').addEventListener('click', doFormula);
    el('tf-apply').addEventListener('click', commitTransform);

    // 标题编辑
    var titleEl = el('chart-title');
    titleEl.addEventListener('blur', function () {
      var t = titleEl.textContent.trim();
      if (t) state.customTitles[state.viewKey] = t;
      else { delete state.customTitles[state.viewKey]; titleEl.textContent = (state.currentMeta && state.currentMeta.title) || '—'; }
    });
    titleEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); titleEl.blur(); } });

    // 工具栏
    el('tb-swapxy').addEventListener('click', function () {
      if (state.mode !== 'imported' && state.mode !== 'dataset') { toast('X/Y 交换适用于导入的数据'); return; }
      state.transposed = !state.transposed;
      el('tb-swapxy').classList.toggle('active', state.transposed);
      rerender();
    });
    el('toolbar-chart-type').addEventListener('change', function () {
      if (state.macroItem) {
        var CART = { line: 1, area: 1, bar: 1, stacked: 1, stackedLine: 1, stackedBar: 1, step: 1, season: 1 };
        if (CART[this.value]) { state.macroTypeOverride = this.value; openMacroItem(state.macroItem, true); }
        else toast('该指标仅支持 折线/面积/柱状/堆叠');
        return;
      }
      if (state.mode === 'imported') {
        state.mapping.chartType = this.value;
        if (state.chartConfig) {
          var okTypes = ['line', 'area', 'bar', 'stacked', 'stackedLine', 'stackedBar', 'step'];
          if (okTypes.indexOf(this.value) >= 0) state.chartConfig.type = this.value;
        }
        rerender();
      }
      else if (state.mode === 'template') {
        var s = DataLoader.SAMPLES[state.currentTemplate];
        if (s && s.data && s.data.labels !== undefined && s.data.series !== undefined) {
          state.overrideType = this.value; rerender();
        } else toast('该图表暂不支持切换类型');
      } else toast('图表类型切换适用于导入的数据');
    });
    el('toolbar-range').addEventListener('change', function () {
      state.timeRange = this.value;
      rerender();
    });
    el('btn-series-color').addEventListener('click', openColorPanel);
    el('color-close').addEventListener('click', closeColorPanel);
    el('color-list').addEventListener('click', function (e) {
      var t = e.target;
      if (t.classList.contains('color-dot')) {
        state.seriesColors[t.dataset.name] = t.dataset.color;
        rerender();
        openColorPanel();
      } else if (t.classList.contains('color-reset')) {
        delete state.seriesColors[t.dataset.name];
        openColorPanel();
        rerender();
      }
    });
    el('explore-close').addEventListener('click', closeExplore);
    el('explore-source').addEventListener('change', function () { buildExploreItems(this.value); });
    el('explore-generate').addEventListener('click', renderExplore);
    el('explore-clear').addEventListener('click', function () { exploreSel.length = 0; document.querySelectorAll('#explore-items .col-chip.on').forEach(function (c) { c.classList.remove('on'); }); });
    el('data-close').addEventListener('click', closeDataPanel);
    el('save-local').addEventListener('click', saveLocal);
    el('restore-local').addEventListener('click', restoreLocal);
    el('export-json').addEventListener('click', exportJson);
    el('url-load').addEventListener('click', loadDataUrl);
    el('btn-add-indicator').addEventListener('click', openIndicatorPanel);
    el('align-main').addEventListener('change', function () {
      state.alignToMain = this.checked;
      if (state.macroItem) openMacroItem(state.macroItem, true);
      else if (state.finItem) openFinItem(state.finItem, true);
      else if (state.intlItem) openIntlItem(state.intlItem, true);
      else if (state.mode === 'template') renderTemplate(state.currentTemplate);
      else rerender();
    });
    el('indicator-close').addEventListener('click', closeIndicatorPanel);
    el('indicator-list').addEventListener('click', function (e) {
      var chip = e.target.closest('.col-chip');
      if (!chip) return;
      var key = chip.dataset.key;
      var opt = (state._indicatorOptions || []).filter(function (o) { return o.key === key; })[0];
      if (!opt) return;
      var isImported = (state.mode === 'imported' && state.table && !state.macroItem && !state.finItem && !state.intlItem);
      if (isImported) {
        var idx = state.mapping.yCols.indexOf(opt.name);
        if (idx >= 0) state.mapping.yCols.splice(idx, 1);
        else state.mapping.yCols.push(opt.name);
        openIndicatorPanel();
        rerender();
      } else {
        // 叠加模式：把指标加到当前图对比
        var oi = -1;
        state.overlaySeries.forEach(function (x, i) { if (x.key === key) oi = i; });
        if (oi >= 0) state.overlaySeries.splice(oi, 1);
        else state.overlaySeries.push(opt);
        openIndicatorPanel();
        if (state.macroItem) openMacroItem(state.macroItem, true);
        else if (state.finItem) openFinItem(state.finItem, true);
        else if (state.intlItem) openIntlItem(state.intlItem, true);
        else if (state.mode === 'template') renderTemplate(state.currentTemplate);
        else rerender();
      }
    });

    el('csv-parse').addEventListener('click', function () {
      var txt = el('csv-text').value.trim();
      if (!txt) { toast('请先粘贴数据'); return; }
      try { tryParsePasted(txt); }
      catch (e) { toast('解析失败：' + e.message); }
    });

    // 统一文件上传（自动识别类型）
    var drop = el('file-drop');
    var input = el('file-input');
    drop.addEventListener('click', function () { input.click(); });
    input.addEventListener('change', function () { if (input.files[0]) handleFile(input.files[0]); });
    ['dragover', 'dragenter'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('dragover'); });
    });
    ['dragleave', 'drop'].forEach(function (ev) {
      drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('dragover'); });
    });
    drop.addEventListener('drop', function (e) {
      var f = e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) handleFile(f);
    });

    el('x-col').addEventListener('change', function () { state.mapping.timeCol = el('x-col').value; updatePreview(); });
    el('chart-type').addEventListener('change', function () { state.mapping.chartType = el('chart-type').value; updateChartTypeHint(); });
    el('btn-swapxy').addEventListener('click', function () {
      state.transposed = !state.transposed;
      el('btn-swapxy').classList.toggle('active', state.transposed);
      updateChartTypeHint();
      toast(state.transposed ? '已交换 X/Y（转置方向）' : '已恢复默认 X/Y');
    });
    el('render-btn').addEventListener('click', function () {
      var goal = state.analysisGoal || 'trend';
      state.analysisGoal = goal;
      if (goal === 'perf') { renderPerfFromUpload(); closeModal(); return; }
      if (goal === 'kline') { state.mapping.chartType = 'candlestick'; renderUserChart(true); return; }
      if (goal === 'ml') { renderMlFromUpload(); closeModal(); return; }
      if (goal === 'macro') { renderMacroFromUpload(); closeModal(); return; }
      renderUserChart(true);
    });
    el('btn-split').addEventListener('click', renderSplitCharts);
    el('btn-rowrange').addEventListener('click', applyRowRange);
    el('btn-redetect').addEventListener('click', function () { showMapping(state.table); toast('已重新识别并推荐'); });
    el('render-all-btn').addEventListener('click', function () { renderDashboard(state.datasets, true); });

    window.addEventListener('resize', function () {
      ChartFactory.resizeAll();
      if (state.labelMode && state.labelMode !== 'off' && state.echartsEl) {
        var rinst = echarts.getInstanceByDom(state.echartsEl);
        if (rinst) applyExtremeLabels(rinst);
      }
    });
  }

  function handleFile(file) {
    var name = (file.name || '').toLowerCase();
    var ext = name.split('.').pop() || '';
    var reader = new FileReader();
    reader.onload = function (e) {
      try {
        if (ext === 'json') {
          showMapping(DataLoader.parseJSON(e.target.result));
        } else if (ext === 'csv' || ext === 'txt') {
          showMapping(DataLoader.parseCSV(e.target.result));
        } else {
          var datasets = DataLoader.readExcelAll(e.target.result);
          if (!datasets.length) { toast('未在文件中识别到数据表'); return; }
          if (datasets.length === 1) showMapping(datasets[0].table);
          else showDatasetPicker(datasets);
        }
      } catch (err) { toast('文件解析失败：' + err.message); }
    };
    if (ext === 'csv' || ext === 'txt' || ext === 'json') reader.readAsText(file, 'utf-8');
    else reader.readAsArrayBuffer(file);
  }

  /* ============================================================
   * Excel 多表自动解析
   * ============================================================ */
  function countSheets(datasets) {
    var set = {};
    datasets.forEach(function (d) { set[d.sheet] = true; });
    return Object.keys(set).length;
  }

  function datasetToChart(dataset) {
    var det = dataset.detection || DataLoader.detectTable(dataset.table);
    DataLoader.convertSerialTime(dataset.table, det);
    det = DataLoader.detectTable(dataset.table) || det;
    // 按时间升序（最新在右），无论 Excel 原顺序如何
    var rows = DataLoader.sortRowsByTime(dataset.rows || dataset.table.rows, det.timeCol);
    if (det.ohlc) {
      var o = det.ohlc;
      var ohlc = rows.map(function (r) {
        return {
          time: normalizeTime(r[o.time]),
          open: toNum(r[o.open]), high: toNum(r[o.high]),
          low: toNum(r[o.low]), close: toNum(r[o.close]),
          volume: o.volume ? toNum(r[o.volume]) : 0
        };
      }).filter(function (d) { return isFinite(d.open) && isFinite(d.close); });
      return { type: 'candlestick', ohlc: ohlc };
    }
    var timeCol = det.timeCol;
    var numericCols = det.numericCols.filter(function (c) { return c !== timeCol; });
    if (!numericCols.length) numericCols = det.numericCols.slice();
    var labels = rows.map(function (r) { return String(r[timeCol]); });
    var series = numericCols.map(function (col) {
      return { name: col, values: rows.map(function (r) { return vnum(r[col]); }) };
    });
    var trimmed = trimToDataRange(labels, series);
    labels = trimmed.labels; series = trimmed.series;
    var type = det.isTimeSeries ? 'area' : 'bar';
    return { type: type, data: { labels: labels, series: series } };
  }

  function showDatasetPicker(datasets) {
    state.datasets = datasets;
    el('mapping-area').style.display = 'none';
    el('dataset-picker').style.display = '';
    el('dataset-summary').textContent = '已识别 ' + datasets.length + ' 个数据表（来自 ' + countSheets(datasets) + ' 个工作表），自动判断结构与图表类型：';

    var list = el('dataset-list');
    list.innerHTML = '';
    datasets.forEach(function (ds, i) {
      var det = ds.detection;
      var type = DataLoader.suggestType(det);
      var typeName = TYPE_LABELS[type] || '表格';
      var meta = ds.rows.length + ' 行 × ' + ds.columns.length + ' 列';
      if (det.ohlc) meta += ' · 已识别 OHLC K线';
      else if (det.isTimeSeries) meta += ' · 时间列：' + det.timeCol;
      var nums = det.numericCols.filter(function (c) { return c !== det.timeCol; });
      if (nums.length) meta += ' · 数值：' + nums.slice(0, 3).join('、') + (nums.length > 3 ? '…' : '');

      var card = document.createElement('div');
      card.className = 'dataset-card';
      card.innerHTML =
        '<div class="ds-head"><span class="ds-name">' + ds.name + '</span>' +
        '<span class="ds-badge">' + typeName + '</span></div>' +
        '<div class="ds-meta">' + meta + '</div>' +
        '<div class="ds-actions"><button class="btn sm" data-render="' + i + '">渲染此表</button></div>';
      list.appendChild(card);
    });

    list.querySelectorAll('[data-render]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        renderDatasetSingle(state.datasets[+btn.dataset.render]);
        closeModal();
      });
    });
  }

  function renderDatasetSingle(dataset) {
    var chart = datasetToChart(dataset);
    clearStage();
    state.mode = 'dataset';
    state.dataset = dataset;
    state.isImported = false;
    state.currentTemplate = null; state.dashboardDatasets = null;
    state.viewKey = 'ds:' + dataset.name;
    highlightNav(null);
    el('btn-events').style.display = 'none';
    el('stat-badge').style.display = 'none';
    var theme = getChartTheme();
    var stage = el('chart-stage');

    if (chart.type === 'candlestick') {
      if (!chart.ohlc.length) { toast('K 线数据无效'); return; }
      var pc = document.createElement('div'); pc.className = 'chart-canvas'; stage.appendChild(pc);
      var inst = PriceChart.create(pc, theme);
      PriceChart.setData(inst, chart.ohlc);
      applyPriceAnnotations(inst);
      attachPriceAnnotationHandler(inst, pc);
      state.priceInsts.push(inst);
      state.priceEl = pc;
    } else {
      chart.data.annotations = echartsAnnotations(state.viewKey);
      chart.data.seriesColors = state.seriesColors;
      var c = document.createElement('div'); c.className = 'chart-canvas'; stage.appendChild(c);
      var dsi = ChartFactory.render(c, chart.type, chart.data, theme);
      attachAnnotationHandler(dsi);
      attachExtremeLabels(dsi);
      state.echartsEl = c;
      if (chart.data && chart.data.labels && chart.data.series) renderAnalysis(chart.data.labels, chart.data.series);
    }
    setHead({ title: dataset.name, subtitle: '', unit: '', source: '' });
    el('hint').textContent = '已加载 Excel 数据表';
    syncToolbar();
  }

  function renderDashboard(datasets, closeAfter) {
    clearStage();
    state.mode = 'dashboard';
    state.dashboardDatasets = datasets;
    state.isImported = false;
    state.currentTemplate = null; state.dataset = null;
    highlightNav(null);
    el('btn-events').style.display = 'none';
    el('stat-badge').style.display = 'none';
    setHead({ title: 'Excel 数据仪表盘', subtitle: '', unit: '', source: '' });
    el('hint').textContent = '已加载 Excel · ' + datasets.length + ' 个数据表';

    var theme = getChartTheme();
    var stage = el('chart-stage');
    var grid = document.createElement('div');
    grid.className = 'dash-grid';
    var insts = [];
    datasets.forEach(function (ds) {
      var chart = datasetToChart(ds);
      if (chart.data) chart.data.seriesColors = state.seriesColors;
      var panel = document.createElement('div');
      panel.className = 'dash-panel';
      panel.innerHTML =
        '<div class="dash-panel-head"><span class="dash-panel-title">' + ds.name + '</span>' +
        '<span class="ds-badge">' + (TYPE_LABELS[chart.type] || chart.type) + '</span></div>' +
        '<div class="dash-panel-body"></div>';
      grid.appendChild(panel);
      var body = panel.querySelector('.dash-panel-body');
      if (chart.type === 'candlestick') {
        if (chart.ohlc.length) {
          var inst = PriceChart.create(body, theme);
          PriceChart.setData(inst, chart.ohlc);
          state.priceInsts.push(inst);
        }
      } else {
        insts.push(ChartFactory.render(body, chart.type, chart.data, theme));
      }
    });
    stage.appendChild(grid);
    // 联动缩放（同组图表时间轴同步）
    if (insts.length > 1) {
      try {
        insts.forEach(function (i) { i.group = 'dash-' + Date.now(); });
        echarts.connect(insts[0].group);
      } catch (e) {}
    }
    syncToolbar();
    if (closeAfter !== false) closeModal();
  }

  /* 多指标拆分为多个图表（每个指标一张图） */
  function renderSplitCharts() {
    var table = state.table, timeCol = state.mapping.timeCol;
    var cols = state.mapping.yCols.slice();
    if (cols.length < 2) { toast('至少选择 2 个数值列'); return; }
    closeModal();
    clearStage();
    hideBack();
    state.mode = 'dashboard';
    state.dashboardDatasets = null; state.currentTemplate = null; state.dataset = null;
    state.splitCols = cols.slice();
    highlightNav(null);
    var theme = getChartTheme();
    var stage = el('chart-stage');
    var grid = document.createElement('div'); grid.className = 'dash-grid';
    cols.forEach(function (col) {
      var panel = document.createElement('div'); panel.className = 'dash-panel split-panel';
      panel.innerHTML = '<div class="dash-panel-head"><span class="dash-panel-title">' + col + '</span><span class="ds-badge">点击查看</span></div><div class="dash-panel-body"></div>';
      panel.addEventListener('click', function () { openSplitDetail(col); });
      grid.appendChild(panel);
      var body = panel.querySelector('.dash-panel-body');
      var data = { labels: table.rows.map(function (r) { return String(r[timeCol]); }), series: [{ name: col, values: table.rows.map(function (r) { return vnum(r[col]); }) }], seriesColors: state.seriesColors };
      ChartFactory.render(body, 'line', data, theme);
    });
    stage.appendChild(grid);
    setHead({ title: '多指标拆分视图', subtitle: '点击任一卡片查看单个指标走势', unit: '', source: '用户数据' });
    el('hint').textContent = '已拆分为 ' + cols.length + ' 个走势图';
    syncToolbar();
  }

  function openSplitDetail(col) {
    var table = state.table, timeCol = state.mapping.timeCol;
    clearStage();
    state.mode = 'imported'; state.isImported = true; state.viewKey = 'split-detail';
    state.macroItem = null; state.chartConfig = null;
    highlightNav(null);
    el('btn-events').style.display = 'none';
    el('stat-badge').style.display = 'none';
    showBack(function () { renderSplitCharts(); });
    var theme = getChartTheme();
    if (state.isPriceData) {
      // 金融资产：单点进去用基金业绩模版（净值 + 回撤 + 指标，随缩放更新）
      var nav = [];
      table.rows.forEach(function (r) { var v = DataLoader.toNum(r[col]); if (!isNaN(v) && v > 0) nav.push({ date: String(r[timeCol]), value: v }); });
      var c = document.createElement('div'); c.className = 'chart-canvas'; el('chart-stage').appendChild(c);
      var ci = ChartFactory.render(c, 'perf', { name: col, nav: nav }, theme);
      renderPerfMetrics({ name: col, nav: nav }, ci);
      state.echartsEl = c;
      setHead({ title: col + ' · 业绩评估', subtitle: '', unit: '净值', source: '用户数据' });
      el('hint').textContent = '业绩评估 · 单个资产';
    } else {
      var labels = table.rows.map(function (r) { return String(r[timeCol]); });
      var values = table.rows.map(function (r) { return vnum(r[col]); });
      var c2 = document.createElement('div'); c2.className = 'chart-canvas'; el('chart-stage').appendChild(c2);
      var ci2 = ChartFactory.render(c2, 'line', { labels: labels, series: [{ name: col, values: values }], seriesColors: state.seriesColors }, theme);
      attachExtremeLabels(ci2);
      state.echartsEl = c2;
      setHead({ title: col, subtitle: '走势图 · 仅展示有数据的区间', unit: '', source: '用户数据' });
      el('hint').textContent = '单个指标走势';
    }
    syncToolbar();
  }

  function showBack(fn) {
    state.backFn = fn;
    var b = el('back-btn');
    if (b) b.style.display = '';
  }
  function hideBack() {
    state.backFn = null;
    var b = el('back-btn');
    if (b) b.style.display = 'none';
  }

  /* ============================================================
   * 宏观数据变换（变频 / 同比环比累计 / 自定义公式）
   * ============================================================ */
  function currentTable() {
    if (state.mode === 'imported' && state.table) return { table: state.table, timeCol: state.mapping.timeCol };
    if (state.mode === 'dataset' && state.dataset) return { table: state.dataset.table, timeCol: state.dataset.detection.timeCol };
    // 内置数据/探索图：从当前图表数据构造临时表，让数据变换也能用
    var lc = state.lastChart;
    var lcData = (lc && lc.data && lc.data.labels) ? lc.data : lc;
    if (lcData && lcData.labels && lcData.series) {
      var labels = lcData.labels;
      var ser = lcData.series;
      var cols = ['时间'].concat(ser.map(function (x) { return x.name; }));
      var rows = labels.map(function (l, i) {
        var row = {}; row['时间'] = l;
        ser.forEach(function (x) { row[x.name] = x.values[i]; });
        return row;
      });
      return { table: { columns: cols, rows: rows }, timeCol: '时间' };
    }
    return null;
  }

  function openTransform() {
    var src = currentTable();
    if (!src || !src.table) { toast('请先导入数据或选择一个数据表'); return; }
    state.tfTable = src.table;
    state.tfTimeCol = src.timeCol;
    // 填充指标运算下拉
    var cols = state.mapping.yCols.slice();
    if (!cols.length) cols = src.table.columns.filter(function (c) { return c !== src.timeCol && !isNaN(toNum(src.table.rows[0][c])); });
    [el('tf-colA'), el('tf-colB')].forEach(function (sel, i) {
      if (!sel) return;
      sel.innerHTML = '';
      cols.forEach(function (c) { var o = document.createElement('option'); o.value = c; o.textContent = c; sel.appendChild(o); });
      if (cols.length > 1) sel.value = cols[i === 0 ? 0 : 1];
    });
    el('transform-overlay').classList.add('open');
    updateTransformPreview();
  }
  function closeTransform() { el('transform-overlay').classList.remove('open'); }

  function updateTransformPreview() {
    var tbl = el('tf-preview');
    if (!tbl) return;
    var t = state.tfTable;
    var html = '<thead><tr>' + t.columns.map(function (c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead><tbody>';
    t.rows.slice(0, 8).forEach(function (r) {
      html += '<tr>' + t.columns.map(function (c) { return '<td>' + r[c] + '</td>'; }).join('') + '</tr>';
    });
    tbl.innerHTML = html + '</tbody>';
  }

  function doTransform(action, arg) {
    var t = state.tfTable, tc = state.tfTimeCol;
    try {
      if (action === 'q') state.tfTable = DataLoader.freqToQuarter(t, tc, arg);
      else if (action === 'y') state.tfTable = DataLoader.freqToYear(t, tc, arg);
      else if (action === 'yoy') {
        var f = DataLoader.inferFreq(t.rows.map(function (r) { return r[tc]; }));
        var lag = f === 'month' ? 12 : f === 'quarter' ? 4 : f === 'year' ? 1 : 1;
        state.tfTable = DataLoader.pctChange(t, tc, lag);
      }
      else if (action === 'mom') state.tfTable = DataLoader.pctChange(t, tc, 1);
      else if (action === 'cum') state.tfTable = DataLoader.cumulative(t, tc);
      updateTransformPreview();
    } catch (e) { toast('变换失败：' + e.message); }
  }

  function doFormula() {
    var A = el('tf-colA').value, B = el('tf-colB').value, op = el('tf-op').value;
    if (!A || !B) { toast('请选择两个指标列'); return; }
    if (A === B) { toast('请选择两个不同的指标列'); return; }
    var name = A + ' ' + op + ' ' + B;
    var expr = A + ' ' + op + ' ' + B;
    try {
      state.tfTable = DataLoader.formula(state.tfTable, state.tfTimeCol, name, expr);
      updateTransformPreview();
      toast('已生成新列：' + name);
    } catch (e) { toast('公式错误：' + e.message); }
  }

  function commitTransform() {
    var t = state.tfTable;
    var prevTitle = (state.lastChart && state.lastChart.title) || '';
    var prevType = (state.lastChart && state.lastChart.type) || '';
    if (['line', 'area', 'bar', 'stacked', 'stackedLine'].indexOf(prevType) < 0) prevType = state.det && state.det.isTimeSeries ? 'line' : 'bar';
    state.table = t;
    state.det = DataLoader.detectTable(t);
    state.mapping.timeCol = state.tfTimeCol;
    state.mapping.yCols = state.det.numericCols.filter(function (c) { return c !== state.tfTimeCol; });
    state.mapping.chartType = state.det.isTimeSeries ? (prevType || 'area') : 'bar';
    state.isImported = true; state.mode = 'imported';
    state.viewKey = 'imported';
    if (prevTitle) state.customTitles['imported'] = prevTitle + ' · 变换';
    closeTransform();
    renderUserChart(false);
  }

  /* ============================================================
   * 图片数据识别（图表描点取数）
   * ============================================================ */

  /* ---------- 图表配置 JSON（大模型输出 / 分享链接） ---------- */
  function applyChartConfig(cfg) {
    var type = cfg.type || 'area';
    if (!ChartFactory.BUILDERS[type] || type === 'candlestick') { toast('不支持的图表类型: ' + type); return; }
    state.chartConfig = cfg;
    if (cfg && cfg.labels && cfg.series) state.lastChart = cfg;
    // 应用主题（链接可携带）
    if (cfg.theme && Themes.getTheme(cfg.theme)) {
      state.theme = cfg.theme;
      Themes.applyTheme(cfg.theme);
      var ts = el('theme-select');
      if (ts) ts.value = cfg.theme;
    }
    var data = {};
    if (cfg.labels !== undefined && cfg.series !== undefined) data = { labels: cfg.labels, series: cfg.series };
    else if (cfg.indicators !== undefined && cfg.series !== undefined) data = { indicators: cfg.indicators, series: cfg.series };
    else if (cfg.data) data = cfg.data;
    else { toast('JSON 缺少 labels/series 或 indicators/series'); return; }
    if (data.labels !== undefined && data.series !== undefined) {
      if (type === 'season') {
        data.maxYears = ({ '1y': 1, '5y': 5, '10y': 10 })[state.timeRange] || undefined;
      } else {
        var ranged = applyTimeRange(data.labels, data.series);
        data.labels = ranged.labels; data.series = ranged.series;
      }
    }
    // agent 生成的图：把用户通过「＋指标」叠加的系列合并进来
    if (data.labels !== undefined && data.series !== undefined && state.overlaySeries && state.overlaySeries.length) {
      var mg = mergeOverlaySeries(data.labels, data.series, state.overlaySeries);
      data = { labels: mg.labels, series: mg.series };
    }
    data.seriesColors = state.seriesColors;
    clearStage();
    state.mode = 'imported'; state.isImported = true; state.viewKey = cfg.viewKey || 'imported';
    state.currentTemplate = null; state.dataset = null; state.dashboardDatasets = null;
    state.table = null; state.det = null;
    highlightNav(null);
    el('btn-events').style.display = 'none';
    el('stat-badge').style.display = 'none';
    var theme = getChartTheme();
    var c = document.createElement('div'); c.className = 'chart-canvas'; el('chart-stage').appendChild(c);
    var ci = renderAutoDual(c, type, data, theme);
    attachAnnotationHandler(ci);
    attachExtremeLabels(ci);
    state.echartsEl = c;
    setHead({ title: cfg.title || '图表', subtitle: '', unit: cfg.unit || '', source: '' });
    el('hint').textContent = 'AI 生成 · 可编辑图表类型/区间/＋指标后导出';
    if (data.labels && data.series) renderAnalysis(data.labels, data.series);
    syncToolbar();
  }

  function tryParsePasted(txt) {
    if (txt.charAt(0) === '[' || txt.charAt(0) === '{') {
      var obj = JSON.parse(txt);
      if (obj && obj.type && (obj.labels !== undefined || obj.indicators !== undefined || obj.data)) { applyChartConfig(obj); closeModal(); return; }
      showMapping(DataLoader.parseJSON(txt));
    } else {
      showMapping(DataLoader.parseCSV(txt));
    }
  }

  function buildChartConfig() {
    var type = state.mapping.chartType;
    var labels = state.table.rows.map(function (r) { return String(r[state.mapping.timeCol]); });
    var series = state.mapping.yCols.map(function (col) { return { name: col, values: state.table.rows.map(function (r) { return vnum(r[col]); }) }; });
    var title = state.customTitles[state.viewKey] || (state.currentMeta && state.currentMeta.title) || '图表';
    return { type: type, title: title, labels: labels, series: series };
  }

  function b64Encode(str) { return btoa(unescape(encodeURIComponent(str))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function b64Decode(str) {
    var s = str.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return decodeURIComponent(escape(atob(s)));
  }

  function copyShareLink() {
    var cfg;
    if (state.mode === 'imported' && state.table) cfg = buildChartConfig();
    else if (state.lastChart) cfg = state.lastChart;
    else if (state.chartConfig) cfg = state.chartConfig;
    else { toast('当前图表暂不支持复制链接'); return; }
    var json = JSON.stringify(cfg);
    var b64 = b64Encode(json);
    var url = location.href.split('?')[0] + '?chart=' + b64;
    function done() { toast('图表链接已复制（部署后可分享）'); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done, done);
    } else {
      var ta = document.createElement('textarea'); ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      ta.remove(); done();
    }
  }

  /* 数据归一化：所有序列按日期升序排列（最新数据在右） */
  function normalizeSeriesData(D) {
    if (!D || !D.sections) return D;
    D.sections.forEach(function (sec) {
      (sec.items || []).forEach(function (it) {
        if (!it.labels || !it.series || !it.series.length) return;
        var vals = it.series[0].values;
        var pairs = [];
        for (var i = 0; i < it.labels.length; i++) pairs.push({ l: String(it.labels[i]), v: vals[i] });
        pairs.sort(function (a, b) { return a.l < b.l ? -1 : (a.l > b.l ? 1 : 0); });
        it.labels = pairs.map(function (p) { return p.l; });
        it.series[0].values = pairs.map(function (p) { return p.v; });
      });
    });
    return D;
  }

  /* 用真实最新数据填充示例模板 */
  function hydrateSamples() {
    var S = DataLoader.SAMPLES;
    if (!S) return;
    function each(D, cb) { ((D && D.sections) || []).forEach(function (s) { (s.items || []).forEach(cb); }); }
    function mFind(t) { var r = null; each(window.CHINA_MACRO, function (i) { if (!r && i.title === t) r = i; }); return r; }
    function iFind(t) { var r = null; each(window.INTL_MACRO, function (i) { if (!r && i.title === t) r = i; }); return r; }
    function fFind(t) { var r = null; each(window.FINANCE_DATA, function (i) { if (!r && i.title === t) r = i; }); return r; }
    function tailOf(item, n) {
      if (!item || !item.series || !item.series.length) return null;
      var L = item.labels, V = item.series[0].values;
      var k = Math.max(0, L.length - n);
      return { labels: L.slice(k), values: V.slice(k) };
    }
    function alignTo(baseItem, item) {
      return alignSeriesToBase(baseItem.labels, item.labels, item.series[0].values);
    }
    function multi(base, items) {
      if (!base) return null;
      var labels = base.labels, series = [{ name: base._name || '指标', values: base.series[0].values }];
      (items || []).forEach(function (it) {
        if (!it) return;
        series.push({ name: it.title, values: alignTo(base, it) });
      });
      return { labels: labels, series: series };
    }
    function setSample(key, data, meta) {
      if (!S[key] || !data) return;
      S[key].data = data;
      if (meta) S[key].meta = Object.assign({}, S[key].meta, meta);
    }
    function lastN(arr, n) { return arr.slice(Math.max(0, arr.length - n)); }
    function pctChange(item, n) {
      var t = tailOf(item, n + 1);
      if (!t) return null;
      var v = t.values, out = [];
      for (var i = 0; i < v.length; i++) out.push(v[i]);
      return { labels: t.labels, values: out };
    }

    /* 1. 渐变面积 · GDP 增速 → 中国 GDP + 工业增加值 + 社零 */
    var gdp = mFind('GDP 当季同比');
    if (gdp) {
      var d = multi({ labels: gdp.labels, series: gdp.series, _name: gdp.title }, [mFind('规模以上工业增加值'), mFind('社会消费品零售总额')]);
      d.labels = d.labels.slice(-12); d.series.forEach(function (s) { s.values = s.values.slice(-12); });
      setSample('macro-gdp-area', d, { title: '中国 GDP 增速（最新）', subtitle: 'GDP 当季同比 · 工业增加值 · 社零', unit: '%', source: '国家统计局 · akshare 实时' });
    }

    /* 2. 双轴组合 · 社零总额 → 社零(柱) + CPI(线) */
    var retail = mFind('社会消费品零售总额'), cpi = mFind('CPI 整体');
    if (retail && cpi) {
      var base2 = tailOf(retail, 24), cpi2 = alignTo({ labels: base2.labels, series: [{ values: base2.values }] }, cpi).slice(-24);
      setSample('macro-dual', { labels: base2.labels, bars: [{ name: '社会消费品零售总额', values: base2.values }], lines: [{ name: 'CPI 整体', values: cpi2 }] },
        { title: '社零总额 与 CPI（最新）', subtitle: '柱：社零同比 · 线：CPI', unit: '%', source: '国家统计局 · akshare 实时' });
    }

    /* 3. 阶梯线 · 政策利率 → LPR 1年/5年 */
    var lpr1 = mFind('LPR 1年'), lpr5 = mFind('LPR 5年');
    if (lpr1 && lpr5) {
      var t1 = tailOf(lpr1, 60), t5 = alignTo({ labels: t1.labels, series: [{ values: t1.values }] }, lpr5).slice(-60);
      setSample('macro-step', { labels: t1.labels, series: [{ name: 'LPR 1年', values: t1.values }, { name: 'LPR 5年', values: t5 }] },
        { title: 'LPR 走势（最新）', subtitle: '贷款市场报价利率', unit: '%', source: '全国银行间同业拆借中心 · akshare 实时' });
    }

    /* 4. 热力矩阵 → 各国 GDP 增速（统一季度 + 前向填充） */
    var gdpItems = ['欧元区GDP同比', '美国GDP', '英国GDP同比', '德国GDP同比'].map(iFind).filter(Boolean);
    if (gdpItems.length >= 2) {
      function periodOrd(l) {
        var s = String(l);
        var m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (m1) { var q = Math.ceil(parseInt(m1[2], 10) / 3); return parseInt(m1[1], 10) * 4 + q; }
        var m2 = s.match(/^(\d{4})年(\d{2})月/);
        if (m2) return parseInt(m2[1], 10) * 4 + Math.ceil(parseInt(m2[2], 10) / 3);
        var m3 = s.match(/^(\d{4})第(\d)季度/);
        if (m3) return parseInt(m3[1], 10) * 4 + parseInt(m3[2], 10);
        return null;
      }
      function ordLabel(ord) { var y = Math.floor((ord - 1) / 4), q = ((ord - 1) % 4) + 1; return y + '-Q' + q; }
      var ordSet = {};
      gdpItems.forEach(function (it) { it.labels.forEach(function (l) { var o = periodOrd(l); if (o) ordSet[o] = true; }); });
      var ords = Object.keys(ordSet).map(Number).sort(function (a, b) { return a - b; }).slice(-8);
      var gdpMaps = gdpItems.map(function (it) {
        var m = {};
        it.labels.forEach(function (l, k) { var o = periodOrd(l); if (o) m[o] = it.series[0].values[k]; });
        return m;
      });
      var vals = [];
      gdpItems.forEach(function (it, ri) {
        ords.forEach(function (ord, ci) {
          // 前向填充：找 <= ord 的最近一期
          var v = null;
          for (var oo = ord; oo >= ord - 4; oo--) { if (gdpMaps[ri][oo] !== undefined) { v = gdpMaps[ri][oo]; break; } }
          if (v !== null && v !== undefined && !isNaN(v)) vals.push([ci, ri, Math.round(v * 100) / 100]);
        });
      });
      setSample('macro-heatmap', {
        xLabels: ords.map(ordLabel),
        yLabels: gdpItems.map(function (i) { return i.title.replace('GDP同比', '').replace('GDP', '').trim() || i.title; }),
        values: vals
      }, { title: '全球主要经济体 GDP 增速矩阵（最新）', subtitle: '季度同比（%）', unit: '%', source: '各国统计局 · akshare 实时' });
    }

    /* 5. 横向排名 → 全球股指近1年涨幅 */
    var stocks = ['沪深300', '中证500', '日经225', '德国DAX', '纳斯达克', '标普500', '英国富时100', '法国CAC40'].map(fFind).filter(Boolean);
    if (stocks.length >= 3) {
      var cats = [], vs = [];
      stocks.forEach(function (it) {
        var t = tailOf(it, 53); if (!t || t.values.length < 2) return;
        var a = t.values[0], b = t.values[t.values.length - 1];
        if (a > 0) { cats.push(it.title); vs.push(Math.round(((b / a - 1) * 100) * 100) / 100); }
      });
      setSample('industry-rank', { categories: cats, values: vs },
        { title: '全球股指近一年涨幅排名', subtitle: '涨幅（%）', unit: '%', source: '公开行情 · 实时' });
    }

    /* 6. 气泡矩阵 → PMI vs GDP */
    var pmi = mFind('制造业 PMI');
    if (pmi && gdp) {
      var baseP = { labels: gdp.labels, series: [{ values: gdp.series[0].values }] };
      var pmiAligned = alignSeriesToBase(gdp.labels, pmi.labels, pmi.series[0].values);
      var pts = [];
      for (var i = 0; i < gdp.labels.length; i++) if (pmiAligned[i] != null && gdp.series[0].values[i] != null) pts.push([pmiAligned[i], gdp.series[0].values[i], Math.abs(gdp.series[0].values[i]) + 1, gdp.labels[i]]);
      if (pts.length > 4) setSample('industry-bubble', { xName: '制造业 PMI', yName: 'GDP 当季同比', sizeName: '量级', data: pts.slice(-40) },
        { title: 'PMI 与 GDP 关系（最新）', subtitle: '每个点 = 一个季度', unit: '', source: '国家统计局 · akshare 实时' });
    }

    /* 7. 板块热力/树图 → 全球股指最新点位 */
    if (stocks.length >= 3) {
      var td = stocks.slice(0, 8).map(function (it) { var v = it.series[0].values; return { name: it.title, value: Math.round(v[v.length - 1]) }; });
      setSample('industry-treemap', { data: td }, { title: '全球股指体量分布', subtitle: '按最新点位', unit: '点', source: '公开行情 · 实时' });
    }

    /* 8. 社融 → 近4年季节性折线 + 产业结构（堆叠） */
    var shRong = mFind('社融结构（人民币贷款/企业债/政府债）');
    if (shRong) {
      var sr = shRong;
      // 季节性：只取「人民币贷款」月度序列，按年叠放最近 4 年
      var seasonLabels = sr.labels.map(function (l) { return String(l).slice(0, 7); });
      setSample('macro-sheirong-stack', { labels: seasonLabels, series: [{ name: '社融·人民币贷款', values: sr.series[0].values }], maxYears: 4 },
        { title: '社融人民币贷款 · 近4年季节性对比', subtitle: '各年同期月度走势（亿元）', unit: '亿元', source: '中国人民银行 · akshare 实时' });
      if (S['macro-sheirong-stack']) S['macro-sheirong-stack'].type = 'season';
      // 产业结构：保持堆叠面积
      var k0 = Math.max(0, sr.labels.length - 24);
      setSample('industry-stacked', { labels: sr.labels.slice(k0), series: sr.series.map(function (s) { return { name: s.name, values: s.values.slice(k0) }; }) },
        { title: '社融结构（最新）', subtitle: '人民币贷款 / 企业债 / 政府债', unit: '亿元', source: '中国人民银行 · akshare 实时' });
    }
    if (shRong) {
      setSample('fin-sankey', {
        nodes: [{ name: '社融增量' }, { name: '人民币贷款' }, { name: '企业债券' }, { name: '政府债券' }],
        links: [
          { source: '人民币贷款', target: '社融增量', value: Math.abs(shRong.series[0].values[shRong.series[0].values.length - 1]) || 1 },
          { source: '企业债券', target: '社融增量', value: Math.abs(shRong.series[1].values[shRong.series[1].values.length - 1]) || 1 },
          { source: '政府债券', target: '社融增量', value: Math.abs(shRong.series[2].values[shRong.series[2].values.length - 1]) || 1 }
        ]
      }, { title: '社融结构流向（最新月度）', subtitle: '人民币贷款 / 企业债 / 政府债', unit: '亿元', source: '中国人民银行 · akshare 实时' });
    }

    /* 9. 双轴组合 · 收入毛利 → 沪深300(柱) + VIX(线) */
    var hs300 = fFind('沪深300'), vix = fFind('标普500波动率(VIX)');
    if (hs300 && vix) {
      var h1 = tailOf(hs300, 60), v1 = alignTo({ labels: h1.labels, series: [{ values: h1.values }] }, vix).slice(-60);
      setSample('fin-combo', { labels: h1.labels, bars: [{ name: '沪深300', values: h1.values }], lines: [{ name: 'VIX 波动率', values: v1 }] },
        { title: '沪深300 与 VIX（最新）', subtitle: '柱：沪深300 · 线：VIX', unit: '', source: '公开行情 · 实时' });
    }

    /* 10. 环形图 → 全球股指近一年涨幅占比（绝对值） */
    if (stocks.length >= 3) {
      var donutData = [];
      stocks.slice(0, 6).forEach(function (it) {
        var t = tailOf(it, 53); if (!t || t.values.length < 2) return;
        var ch = t.values[t.values.length - 1] / t.values[0] - 1;
        donutData.push({ name: it.title, value: Math.abs(Math.round(ch * 10000) / 100) || 0.01 });
      });
      setSample('fin-donut', { data: donutData }, { title: '主要股指近一年涨幅强度', subtitle: '绝对值占比', unit: '%', source: '公开行情 · 实时' });
    }

    /* 11. 指标卡 → 金融最新值 */
    var kpiItems = [fFind('沪深300'), fFind('COMEX黄金'), fFind('美元指数'), fFind('WTI原油'), fFind('中国10年期国债')].filter(Boolean);
    if (kpiItems.length) {
      var cards = kpiItems.map(function (it) {
        var v = it.series[0].values; var last = v[v.length - 1], prev = v.length > 1 ? v[v.length - 2] : null;
        var chg = (prev != null && prev !== 0) ? (last - prev) / Math.abs(prev) * 100 : 0;
        return { label: it.title, value: fmtNum(last), delta: (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%', dir: chg >= 0 ? 'pos' : 'neg', spark: v.slice(-12) };
      });
      setSample('fin-kpi', { cards: cards }, { title: '金融核心指标（最新）', subtitle: '一键看盘', unit: '', source: '公开行情 · 实时' });
    }

    /* 12. ML 趋势/预测/聚类/相关性/分布 → 真实数据 */
    if (hs300) {
      var t2 = tailOf(hs300, 60);
      setSample('ml-trend', { labels: t2.labels, values: t2.values },
        { title: '沪深300 趋势拟合（最新）', subtitle: '线性趋势', unit: '点', source: '公开行情 · 实时' });
      var fcLabels = []; (function(){ var d0 = new Date(); for (var q=1;q<=6;q++){ var dd=new Date(d0.getTime()); dd.setMonth(dd.getMonth()+q*3); fcLabels.push(dd.getFullYear()+'Q'+(Math.floor(dd.getMonth()/3)+1)); } })();
      setSample('ml-forecast', { labels: t2.labels, values: t2.values, horizon: 6, forecastLabels: fcLabels },
        { title: '沪深300 走势与预测（最新）', subtitle: '未来 6 期', unit: '点', source: '公开行情 · 实时' });
      setSample('ml-dist', { values: (function () { var r = []; for (var i = 1; i < t2.values.length; i++) r.push(t2.values[i] / t2.values[i - 1] - 1); return r; })() },
        { title: '沪深300 收益分布（最新）', subtitle: '日收益直方图', unit: '', source: '公开行情 · 实时' });
    }
    if (gdp && pmi) {
      var pmiAl = alignSeriesToBase(gdp.labels, pmi.labels, pmi.series[0].values);
      var cl = [];
      for (var j = 0; j < gdp.labels.length; j++) if (pmiAl[j] != null && gdp.series[0].values[j] != null) cl.push([pmiAl[j], gdp.series[0].values[j], gdp.labels[j]]);
      if (cl.length > 6) {
        setSample('ml-cluster', { xName: '制造业 PMI', yName: 'GDP 同比', k: 3,
          data: cl.slice(-40).map(function (p) { return { name: String(p[2]), x: p[0], y: p[1] }; }) },
          { title: 'PMI 与 GDP 聚类（最新）', subtitle: 'K-means 分 3 类', unit: '', source: '国家统计局 · akshare 实时' });
        setSample('macro-corr-explore', { series: [{ name: '制造业 PMI', values: pmiAl }, { name: 'GDP 当季同比', values: gdp.series[0].values }] },
          { title: 'PMI 与 GDP 相关性（最新）', subtitle: '散点矩阵', unit: '', source: '国家统计局 · akshare 实时' });
      }
    }
    /* 相关性热力图：用经济活动核心指标 */
    var corrItems = ['GDP 当季同比', '制造业 PMI', '规模以上工业增加值', '社会消费品零售总额', 'CPI 整体', 'PPI（出厂）'].map(mFind).filter(Boolean);
    if (corrItems.length >= 3) {
      var baseC = corrItems[0];
      var serC = corrItems.map(function (it) { return { name: it.title, values: alignSeriesToBase(baseC.labels, it.labels, it.series[0].values) }; });
      setSample('ml-corr', { series: serC }, { title: '宏观指标相关性（最新）', subtitle: '相关系数矩阵', unit: '', source: '国家统计局 · akshare 实时' });
    }

    /* 13. 雷达图 → 中国宏观最新景气 */
    var radarItems = ['制造业 PMI', '服务业 PMI', '规模以上工业增加值', '社会消费品零售总额', '出口（美元计）', '固定资产投资'].map(mFind).filter(Boolean);
    if (radarItems.length >= 3) {
      var ind = radarItems.map(function (it) { return { name: it.title }; });
      var vals = radarItems.map(function (it) { var v = it.series[0].values; return v[v.length - 1]; });
      setSample('macro-pmi-radar', { indicators: ind, series: [{ name: '最新值', values: vals }] },
        { title: '中国宏观景气雷达（最新）', subtitle: '各指标最新值', unit: '%', source: '国家统计局 · akshare 实时' });
    }

    /* 14. 业绩评估 → 沪深300 净值 */
    if (hs300) {
      var nav = [];
      hs300.labels.forEach(function (l, i) { var v = hs300.series[0].values[i]; if (v > 0) nav.push({ date: l, value: v }); });
      setSample('fund-perf', { name: '沪深300', nav: nav.slice(-250) }, { title: '沪深300 业绩评估（最新）', subtitle: '净值 · 回撤 · 指标', unit: '点', source: '公开行情 · 实时' });
    }

    /* 15. 世界地图 → 各国通胀（GeoJSON 用英文国名） */
    var CN2EN = { '中国': 'China', '美国': 'United States', '英国': 'United Kingdom', '德国': 'Germany', '加拿大': 'Canada', '日本': 'Japan', '澳大利亚': 'Australia', '印度': 'India', '巴西': 'Brazil', '韩国': 'Korea', '法国': 'France', '意大利': 'Italy', '俄罗斯': 'Russia' };
    var mapVals = [];
    ['美国CPI同比', '日本CPI同比', '英国CPI同比', '德国CPI同比', '澳大利亚CPI同比', '加拿大CPI同比'].map(iFind).forEach(function (it) {
      if (!it) return;
      var v = it.series[0].values; var last = v[v.length - 1];
      var zh = it.title.replace('CPI同比', '').trim();
      var en = CN2EN[zh]; if (!en) return;
      mapVals.push({ name: en, value: Math.round(last * 100) / 100, label: zh });
    });
    if (cpi) { var cv = cpi.series[0].values; mapVals.push({ name: 'China', value: Math.round(cv[cv.length - 1] * 100) / 100, label: '中国' }); }
    if (mapVals.length >= 3) {
      setSample('macro-world-map', { values: mapVals }, { title: '全球通胀地图（最新 CPI 同比）', subtitle: '各国最新 CPI 同比（%）', unit: '%', source: '各国统计局 · akshare 实时' });
      if (S['macro-world-map']) S['macro-world-map'].meta.unit = '%';
    }

    /* 16. 多国对比线 → 全球 GDP 增速 */
    if (gdpItems.length >= 2) {
      var baseG = gdpItems[0];
      var serG = gdpItems.map(function (it) { return { name: it.title, values: alignSeriesToBase(baseG.labels, it.labels, it.series[0].values) }; });
      var kk = Math.max(0, baseG.labels.length - 24);
      setSample('macro-country-groups', { labels: baseG.labels.slice(kk), series: serG.map(function (s) { return { name: s.name, values: s.values.slice(kk) }; }) },
        { title: '全球主要经济体 GDP 增速（最新）', subtitle: '季度同比', unit: '%', source: '各国统计局 · akshare 实时' });
    }

    /* 17. CPI / M2 / PMI 单指标 */
    if (cpi) { var tc = tailOf(cpi, 60); setSample('macro-cpi', { labels: tc.labels, series: [{ name: 'CPI 整体', values: tc.values }] }, { title: '中国 CPI（最新）', subtitle: '当月同比', unit: '%', source: '国家统计局 · akshare 实时' }); }
    var m2 = mFind('M2 同比');
    if (m2) { var tm = tailOf(m2, 60); setSample('macro-m2', { labels: tm.labels, series: [{ name: 'M2 同比', values: tm.values }] }, { title: '中国 M2 增速（最新）', subtitle: '同比', unit: '%', source: '中国人民银行 · akshare 实时' }); }
    var pmiS = mFind('服务业 PMI');
    if (pmi && pmiS) {
      var tp = tailOf(pmi, 36), tsp = alignSeriesToBase({ labels: tp.labels, series: [{ values: tp.values }] }, pmiS).slice(-36);
      setSample('macro-pmi-monthly', { labels: tp.labels, series: [{ name: '制造业 PMI', values: tp.values }, { name: '服务业 PMI', values: tsp }] },
        { title: '中国 PMI（最新）', subtitle: '制造业 / 服务业', unit: '', source: '国家统计局 · akshare 实时' });
    }

    /* 18. 瀑布图 → 用社融三项构成 */
    if (shRong) {
      var names = ['人民币贷款', '企业债券', '政府债券', '合计'];
      var vv = [shRong.series[0].values[shRong.series[0].values.length - 1], shRong.series[1].values[shRong.series[1].values.length - 1], shRong.series[2].values[shRong.series[2].values.length - 1]];
      var total = vv.reduce(function (a, b) { return a + (b || 0); }, 0);
      setSample('fin-waterfall', { labels: names.concat(['社融合计']), values: vv.concat([Math.round(total)]) },
        { title: '社融增量构成（最新月度）', subtitle: '瀑布图 · 亿元', unit: '亿元', source: '中国人民银行 · akshare 实时' });
    }

    /* ========== 19. PMI 雷达 → 13 项核心景气指标 · 最近3个月 ========== */
    var radarTitles = ['制造业 PMI', '服务业 PMI', '规模以上工业增加值', '固定资产投资', '社会消费品零售总额',
      '出口（美元计）', '进口（美元计）', 'PPI（出厂）', 'CPI 整体', 'M1 同比', 'M2 同比', '新增人民币贷款', '人民币贷款余额同比'];
    var radarItems2 = radarTitles.map(mFind).filter(function (x) { return x && x.series && x.series[0].values.length >= 3; });
    if (radarItems2.length >= 6) {
      var inds = radarItems2.map(function (it) { return { name: it.title }; });
      var series3 = [];
      for (var back = 0; back < 3; back++) {
        var vals = radarItems2.map(function (it) { var v = it.series[0].values; return v[v.length - 1 - back]; });
        var lbl = radarItems2[0].labels[radarItems2[0].labels.length - 1 - back];
        series3.push({ name: String(lbl).slice(0, 7), values: vals });
      }
      series3.reverse();
      setSample('macro-pmi-radar', { indicators: inds, series: series3 },
        { title: '中国宏观景气雷达 · 近3个月', subtitle: '13 项核心指标（PMI/工业/消费/进出口/物价/货币）', unit: '', source: '国家统计局 · 中国人民银行 · akshare 实时' });
    }

    /* ========== 20. 行业数据（akshare 行业板块） ========== */
    var AK = window.AKSHARE_DATA;
    if (AK && AK.industries && AK.industries.length) {
      var inds2 = AK.industries.slice().filter(function (x) { return isFinite(x.change); });
      inds2.sort(function (a, b) { return b.change - a.change; });
      // 排名
      var topR = inds2.slice(0, 15);
      setSample('industry-rank', { categories: topR.map(function (x) { return x.name; }), values: topR.map(function (x) { return Math.round(x.change * 100) / 100; }) },
        { title: '行业板块涨幅榜（最新）', subtitle: '申万行业 · 涨跌幅（%）', unit: '%', source: '东方财富 · akshare 实时' });
      // 气泡：换手率 vs 涨跌幅，大小=市值
      var bubbleData = inds2.filter(function (x) { return Math.abs(x.change) < 30 && x.mcap > 0; }).slice(0, 80)
        .map(function (x) { return { name: x.name, value: [Math.round(x.turnover * 100) / 100, Math.round(x.change * 100) / 100, Math.round(x.mcap / 1e8) / 100] }; });
      if (bubbleData.length >= 10) {
        setSample('industry-bubble', { xName: '换手率', yName: '涨跌幅', sizeName: '总市值', data: bubbleData },
          { title: '行业景气气泡图（最新）', subtitle: '换手率 vs 涨跌幅 · 气泡=市值', unit: '%', source: '东方财富 · akshare 实时' });
      }
      // 树图：市值前 20
      var byCap = AK.industries.slice().sort(function (a, b) { return b.mcap - a.mcap; }).slice(0, 20);
      setSample('industry-treemap', { data: byCap.map(function (x) { return { name: x.name, value: Math.round(x.mcap / 1e8) }; }) },
        { title: '行业市值分布（最新）', subtitle: '前 20 大行业 · 单位：亿元', unit: '亿元', source: '东方财富 · akshare 实时' });
    }

    /* ========== 21. 公司财务（贵州茅台，akshare） ========== */
    if (AK && AK.company) {
      var co = AK.company;
      var L = co.labels || [];
      var rev = co.revenue || [], cost = co.cost || [], net = co.netProfit || [], roe = co.roe || [];
      var lastIdx = L.length - 1;
      var rv = rev[lastIdx], cs = cost[lastIdx], np = net[lastIdx];
      if (rv && cs && np) {
        var period = L[lastIdx] + '（累计）';
        setSample('fin-waterfall', { labels: ['营业总收入', '营业成本', '期间费用等', '净利润'], values: [rv, -cs, -(rv - cs - np), np] },
          { title: co.name + ' 营收桥接（' + period + '）', subtitle: '营业总收入 → 成本 → 费用 → 净利润', unit: '元', source: '公司财报 · akshare 实时' });
        // 环形：成本/费用/净利
        var donutV = [{ name: '营业成本', value: Math.round(cs / 1e8) }, { name: '期间费用等', value: Math.round((rv - cs - np) / 1e8) }, { name: '净利润', value: Math.round(np / 1e8) }];
        setSample('fin-donut', { data: donutV }, { title: co.name + ' 收入结构（' + period + '）', subtitle: '成本 / 费用 / 净利（亿元）', unit: '亿元', source: '公司财报 · akshare 实时' });
        // 桑基
        setSample('fin-sankey', {
          nodes: [{ name: '营业总收入' }, { name: '营业成本' }, { name: '毛利' }, { name: '期间费用' }, { name: '净利润' }],
          links: [
            { source: '营业总收入', target: '营业成本', value: Math.round(cs / 1e8) },
            { source: '营业总收入', target: '毛利', value: Math.round((rv - cs) / 1e8) },
            { source: '毛利', target: '期间费用', value: Math.round((rv - cs - np) / 1e8) },
            { source: '毛利', target: '净利润', value: Math.round(np / 1e8) }
          ]
        }, { title: co.name + ' 收入流向（' + period + '）', subtitle: '营收 → 成本 / 毛利 → 费用 / 净利', unit: '亿元', source: '公司财报 · akshare 实时' });
      }
      // 双轴：营收(柱) + 净利率(线)
      var validIdx = [];
      L.forEach(function (_, i) { if (rev[i] && net[i]) validIdx.push(i); });
      if (validIdx.length >= 6) {
        var L2 = validIdx.map(function (i) { return L[i]; });
        var revBars = validIdx.map(function (i) { return Math.round(rev[i] / 1e8); });
        var margin = validIdx.map(function (i) { return Math.round((net[i] / rev[i]) * 10000) / 100; });
        setSample('fin-combo', { labels: L2, bars: [{ name: '营业总收入', values: revBars }], lines: [{ name: '净利率', values: margin }] },
          { title: co.name + ' 营收与净利率', subtitle: '柱：营业总收入（亿元） · 线：净利率（%）', unit: '亿元', source: '公司财报 · akshare 实时' });
      }
      // 指标卡
      var roeLast = roe[lastIdx];
      var gm = rv ? (rv - cs) / rv * 100 : null;
      if (rv && np) {
        var cards2 = [
          { label: '营业总收入', value: (rv / 1e8).toFixed(1) + ' 亿', delta: '', dir: 'pos', spark: rev.filter(function (x) { return x; }).slice(-12).map(function (x) { return x / 1e8; }) },
          { label: '净利润', value: (np / 1e8).toFixed(1) + ' 亿', delta: '', dir: 'pos', spark: net.filter(function (x) { return x; }).slice(-12).map(function (x) { return x / 1e8; }) },
          { label: '毛利率', value: gm !== null ? gm.toFixed(1) + '%' : '—', delta: '', dir: 'pos', spark: [] },
          { label: 'ROE', value: roeLast !== null && roeLast !== undefined ? roeLast.toFixed(1) + '%' : '—', delta: '', dir: 'pos', spark: roe.filter(function (x) { return x !== null && x !== undefined; }).slice(-12) }
        ];
        setSample('fin-kpi', { cards: cards2 }, { title: co.name + ' 经营概览（' + period + '）', subtitle: '营收 / 净利润 / 毛利率 / ROE', unit: '', source: '公司财报 · akshare 实时' });
      }
    }

    /* ========== 22. 金融资产（新增） ========== */
    if (stocks.length >= 3) {
      // 年度收益热力
      var years = {};
      stocks.slice(0, 8).forEach(function (it) {
        var m = {};
        it.labels.forEach(function (l, i) { var y = String(l).slice(0, 4); if (/^\d{4}$/.test(y)) m[y] = it.series[0].values[i]; });
        years[it.title] = m;
      });
      var allYears = {};
      Object.keys(years).forEach(function (k) { Object.keys(years[k]).forEach(function (y) { allYears[y] = true; }); });
      var ys = Object.keys(allYears).sort().slice(-8);
      var heatVals = [], heatYs = [];
      stocks.slice(0, 8).forEach(function (it, ri) {
        var m = years[it.title];
        heatYs.push(it.title);
        // 年初值：取该年第一个有值点
        var prev = null;
        it.labels.forEach(function (l, i) {
          var y = String(l).slice(0, 4);
          if (!/^\d{4}$/.test(y)) return;
          if (m[y] === undefined) return;
          if (m['__first' + y] === undefined) m['__first' + y] = it.series[0].values[i];
        });
      });
      stocks.slice(0, 8).forEach(function (it, ri) {
        var m = years[it.title];
        ys.forEach(function (y, ci) {
          // 该年最后值与首个值
          var valsInYear = [];
          it.labels.forEach(function (l, i) { if (String(l).slice(0, 4) === y) valsInYear.push(it.series[0].values[i]); });
          if (valsInYear.length >= 2 && valsInYear[0] > 0) {
            heatVals.push([ci, ri, Math.round((valsInYear[valsInYear.length - 1] / valsInYear[0] - 1) * 10000) / 100]);
          }
        });
      });
      if (heatVals.length > 10) {
        var S2 = S['asset-heat'] || (S['asset-heat'] = { meta: {}, type: 'heatmap', data: {} });
        S2.type = 'heatmap';
        S2.data = { xLabels: ys, yLabels: heatYs, values: heatVals };
        S2.meta = Object.assign({}, S2.meta, { title: '全球股指年度收益热力', subtitle: '年度涨跌幅（%）', unit: '%', source: '公开行情 · 实时' });
      }
    }
    if (stocks.length >= 3 && hs300) {
      var S3 = S['asset-rank'] || (S['asset-rank'] = { meta: {}, type: 'rank', data: {} });
      var cats3 = [], vs3 = [];
      ['沪深300', '中证500', '日经225', '德国DAX', '纳斯达克', '标普500', '英国富时100', '法国CAC40'].map(fFind).forEach(function (it) {
        if (!it) return;
        var v = it.series[0].values; if (v.length < 2 || !(v[0] > 0)) return;
        cats3.push(it.title); vs3.push(Math.round((v[v.length - 1] / v[0] - 1) * 10000) / 100);
      });
      S3.type = 'rank';
      S3.data = { categories: cats3, values: vs3 };
      S3.meta = Object.assign({}, S3.meta, { title: '全球股指累计涨幅排名', subtitle: '自上市/起始以来累计涨幅（%）', unit: '%', source: '公开行情 · 实时' });
    }
  }

  /* ---------- 启动 ---------- */
  function init() {
    var q = {};
    try { new URLSearchParams(location.search).forEach(function (v, k) { q[k] = v; }); } catch (e) {}
    if (q.theme && Themes.getTheme(q.theme)) state.theme = q.theme;
    if (q.tpl && DataLoader.SAMPLES[q.tpl]) state.currentTemplate = q.tpl;
    Themes.applyTheme(state.theme);
    if (window.WORLD_GEOJSON) { try { echarts.registerMap('world', window.WORLD_GEOJSON); } catch (e) {} }
    normalizeSeriesData(window.CHINA_MACRO);
    normalizeSeriesData(window.INTL_MACRO);
    normalizeSeriesData(window.FINANCE_DATA);
    hydrateSamples();
    buildThemeSelect();
    buildSidebar();
    buildTabs();
    buildSampleTab();
    buildGoalCards();
    bindEvents();
    if (el('btn-watermark')) el('btn-watermark').classList.add('active');
    el('footer-note').textContent = 'Advanced-Financial-Graph (AFG) · 数据仅本地处理 · 生成于 ' + new Date().toLocaleDateString('zh-CN');
    if (q.chart) {
      try {
        var cfg = JSON.parse(b64Decode(q.chart));
        applyChartConfig(cfg);
        return;
      } catch (e) { toast('图表链接无效'); }
    }
    if (q.tpl && DataLoader.SAMPLES[q.tpl]) renderTemplate(q.tpl);
    else if (q.view === 'macro') renderChinaMacro();
    else if (q.view === 'finance') renderFinance();
    else if (q.view === 'intl') renderIntlMacro();
    else renderHome();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
