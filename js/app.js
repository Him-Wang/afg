/* ============================================================
 * 主应用 — 导航、渲染调度、主题切换、数据导入、导出
 * ============================================================ */
(function () {
  'use strict';

  var el = function (id) { return document.getElementById(id); };
  var toNum = DataLoader.toNum;

  var TEMPLATES = [
    { category: '宏观数据', items: [
      { id: 'macro-gdp-area', label: '渐变面积 · GDP 增速' },
      { id: 'macro-dual', label: '双轴组合 · 社零总额' },
      { id: 'macro-step', label: '阶梯线 · 政策利率' },
      { id: 'macro-heatmap', label: '热力矩阵 · 全球增速' },
      { id: 'macro-sheirong-stack', label: '堆叠柱状 · 社融月度' },
      { id: 'macro-pmi-radar', label: '雷达图 · PMI 分项' },
      { id: 'macro-country-groups', label: '分组对比 · G7/新兴/欧元区' },
      { id: 'macro-world-map', label: '世界地图 · GDP 着色' },
      { id: 'macro-corr-explore', label: '关联探索 · 散点矩阵' }
    ]},
    { category: '行业数据', items: [
      { id: 'industry-rank', label: '横向排名 · 营收增速' },
      { id: 'industry-bubble', label: '气泡矩阵 · 景气定位' },
      { id: 'industry-treemap', label: '板块热力 · 市值分布' },
      { id: 'industry-stacked', label: '堆叠面积 · 产业结构' }
    ]},
    { category: '公司财务', items: [
      { id: 'fin-waterfall', label: '瀑布图 · 营收桥接' },
      { id: 'fin-combo', label: '双轴组合 · 收入毛利' },
      { id: 'fin-donut', label: '环形图 · 收入结构' },
      { id: 'fin-kpi', label: '指标卡 · 经营概览' }
    ]},
    { category: '基金业绩', items: [
      { id: 'fund-perf', label: '业绩评估 · 收益/回撤/夏普' }
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
    annotations: {},
    customTitles: {},
    viewKey: 'tpl:macro-gdp-area',
    priceEl: null, echartsEl: null, priceInsts: [],
    table: null, det: null,
    dataset: null, datasets: null, dashboardDatasets: null,
    mapping: { timeCol: '', yCols: [], chartType: 'line' }
  };

  function fmtNum(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
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
    ChartFactory.disposeAll();
    state.priceInsts.forEach(function (inst) { PriceChart.destroy(inst); });
    state.priceInsts = [];
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
      if (!state.annotateMode && state.labelMode !== 'one') return;
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
      if (state.labelMode === 'one') {
        var t = Themes.active().chart;
        inst.setOption({ series: [{ markPoint: {
          symbolSize: 6, itemStyle: { color: t.accent },
          label: { show: true, position: 'top', distance: 4, formatter: fmtNum(val), color: t.text, fontSize: 10, fontWeight: 600, backgroundColor: t.panel, borderColor: t.accent, borderWidth: 1, borderRadius: 4, padding: [3, 7] },
          data: [{ xAxis: cat, yAxis: val }]
        } }] });
        return;
      }
      showAnnotationInput(px, py, function (text) {
        var list = state.annotations[state.viewKey] || (state.annotations[state.viewKey] = []);
        list.push({ cat: cat, val: val, text: text });
        rerender();
        toast('已添加说明');
      });
    });
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
    var theme = Themes.active().chart;
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
  function renderHome() {
    clearStage();
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
        '<div class="home-step"><span class="hs-num">1</span><div><b>上传数据</b><p>支持 Excel（多工作表）/ CSV / JSON / 图片描点取数，数据仅在本地浏览器处理、不上传。</p></div></div>' +
        '<div class="home-step"><span class="hs-num">2</span><div><b>智能识别</b><p>自动判断时间列、数值列、OHLC 与行列方向，并推荐合适的图表类型；不准确可手动交换 X/Y 或改图表。</p></div></div>' +
        '<div class="home-step"><span class="hs-num">3</span><div><b>自由定制</b><p>一键切换图表、5 套配色、时间缩放、标注、数据变换、业绩指标、世界地图、雷达图等。</p></div></div>' +
      '</div>' +
      '<button class="btn primary home-cta" id="home-import">＋ 上传数据开始</button>' +
      '<div class="home-note">想看效果？左侧「示例图表库」任点一张即可预览。</div>';
    el('chart-stage').appendChild(h);
    setHead({ title: 'AFG · 智能制图', subtitle: '上传数据 → 自动识别 → 推荐图表 → 自由定制', unit: '', source: '' });
    h.querySelector('#home-import').addEventListener('click', openModal);
    syncToolbar();
  }

  /* ---------- 侧边导航 ---------- */
  function buildSidebar() {
    var sb = el('sidebar');
    sb.innerHTML = '';
    var startLabel = document.createElement('div');
    startLabel.className = 'nav-group-label';
    startLabel.textContent = '开始';
    sb.appendChild(startLabel);
    var home = document.createElement('div');
    home.className = 'nav-item'; home.dataset.id = 'home';
    home.innerHTML = '<span class="dot"></span><span>🏠 首页 · 使用说明</span>';
    home.addEventListener('click', function () { renderHome(); });
    sb.appendChild(home);
    var libLabel = document.createElement('div');
    libLabel.className = 'nav-group-label';
    libLabel.textContent = '示例图表库 · 点击预览';
    sb.appendChild(libLabel);
    TEMPLATES.forEach(function (group) {
      var label = document.createElement('div');
      label.className = 'nav-group-label';
      label.textContent = group.category;
      sb.appendChild(label);
      group.items.forEach(function (item) {
        var nav = document.createElement('div');
        nav.className = 'nav-item';
        nav.dataset.id = item.id;
        nav.innerHTML = '<span class="dot"></span><span>' + item.label + '</span>';
        nav.addEventListener('click', function () { renderTemplate(item.id); });
        sb.appendChild(nav);
      });
    });
  }

  function highlightNav(id) {
    document.querySelectorAll('.nav-item').forEach(function (n) {
      n.classList.toggle('active', n.dataset.id === id);
    });
  }

  /* ---------- 渲染内置模版 ---------- */
  function renderTemplate(id) {
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

    var evBtn = el('btn-events');
    if (evBtn) {
      evBtn.style.display = hasEvents ? '' : 'none';
      evBtn.classList.toggle('active', hasEvents && state.showEvents);
    }

    updateStatBadge(sample);

    var theme = Themes.active().chart;
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
      state.echartsEl = c;
      renderPerfMetrics(sample.data, ci);
    } else if (sample.type === 'worldMap' && state.tableView) {
      renderWorldTable(sample.data);
    } else {
      var c2 = document.createElement('div'); c2.className = 'chart-canvas'; stage.appendChild(c2);
      var ci2 = ChartFactory.render(c2, sample.type, sample.data, theme);
      attachAnnotationHandler(ci2);
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
    var full = ML.perfMetrics(nav.map(function (p) { return p.value; }));
    var win = (slice && slice.length >= 2) ? ML.perfMetrics(slice.map(function (p) { return p.value; })) : full;
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
    if (state.mode === 'dashboard') renderDashboard(state.dashboardDatasets, false);
    else if (state.mode === 'dataset') renderDatasetSingle(state.dataset);
    else if (state.mode === 'imported') renderUserChart(false);
    else if (state.mode === 'home') renderHome();
    else renderTemplate(state.currentTemplate);
  }

  /* ---------- 导出 ---------- */
  function exportImage() {
    var theme = Themes.active().chart;
    var url = null;
    try {
      if (state.priceEl) {
        var canvas = state.priceEl.querySelector('canvas');
        if (canvas) url = canvas.toDataURL('image/png');
      } else if (state.echartsEl) {
        var inst = echarts.getInstanceByDom(state.echartsEl);
        if (inst) url = inst.getDataURL({ type: 'png', pixelRatio: 2, backgroundColor: theme.bg });
      }
      if (!url) { toast('当前模版暂不支持导出图片'); return; }
      var a = document.createElement('a');
      a.href = url; a.download = 'chart.png'; a.click();
      toast('图片已导出');
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

  function syncLabelsBtn() {
    var b = el('btn-labels');
    if (!b) return;
    var labels = { off: '标签', all: '标签:全部', one: '标签:单点' };
    b.textContent = labels[state.labelMode] || '标签';
    b.classList.toggle('active', state.labelMode !== 'off');
  }

  function syncToolbar() {
    var tb = el('chart-toolbar');
    if (tb) tb.style.display = (state.mode === 'home') ? 'none' : '';
    syncLabelsBtn();
    var sel = el('toolbar-chart-type');
    if (!sel) return;
    var isData = (state.mode === 'imported' || state.mode === 'dataset');
    sel.disabled = !isData;
    if (isData) {
      var t = state.mode === 'imported' ? state.mapping.chartType : '';
      if (t && sel.querySelector('option[value="' + t + '"]')) sel.value = t;
    }
    if (el('tb-swapxy')) el('tb-swapxy').classList.toggle('active', state.transposed);
  }

  function showMapping(table) {
    state.table = table;
    var det0 = DataLoader.detectTable(table);
    if (!det0) { toast('无法解析数据'); return; }
    // 转换 Excel 日期序列号（如 46295 → 2026-09-28）后重新识别
    DataLoader.convertSerialTime(table, det0);
    state.det = DataLoader.detectTable(table) || det0;
    state.mapping.timeCol = state.det.timeCol;
    state.mapping.yCols = state.det.ohlc ? [] : state.det.numericCols.filter(function (c) { return c !== state.det.timeCol; });
    state.mapping.chartType = state.det.ohlc ? 'candlestick' : (state.det.isTimeSeries ? 'area' : 'bar');
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
    el('detect-info').textContent = info;
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
    var html = '<thead><tr>';
    table.columns.forEach(function (c) { html += '<th>' + c + '</th>'; });
    html += '</tr></thead><tbody>';
    table.rows.slice(0, 8).forEach(function (r) {
      html += '<tr>';
      table.columns.forEach(function (c) { html += '<td>' + r[c] + '</td>'; });
      html += '</tr>';
    });
    html += '</tbody>';
    tbl.innerHTML = html;
  }

  /* 构建雷达图数据：wide=转置方向（首列为维度、数值列为实体），否则实体为行、维度为列 */
  function buildRadarData(rows, timeCol, yCols, wide) {
    function ceilMax(vals) { return Math.ceil(Math.max.apply(null, vals.concat([0])) * 1.3); }
    if (wide) {
      var labels = rows.map(function (r) { return String(r[timeCol]); });
      return {
        indicators: labels.map(function (lbl, i) {
          var vals = yCols.map(function (col) { return toNum(rows[i][col]); }).filter(function (v) { return isFinite(v); });
          return { name: lbl, max: ceilMax(vals) };
        }),
        series: yCols.map(function (col) {
          return { name: col, values: rows.map(function (r) { return toNum(r[col]); }) };
        })
      };
    }
    return {
      indicators: yCols.map(function (col) {
        var vals = rows.map(function (r) { return toNum(r[col]); }).filter(function (v) { return isFinite(v); });
        return { name: col, max: ceilMax(vals) };
      }),
      series: rows.map(function (r) {
        return { name: String(r[timeCol]), values: yCols.map(function (col) { return toNum(r[col]); }) };
      })
    };
  }

  function renderUserChart(closeAfter) {
    var m = state.mapping;
    var table = state.table;
    if (!table) return;
    state.viewKey = 'imported';
    el('btn-events').style.display = 'none';
    el('stat-badge').style.display = 'none';
    var rows = DataLoader.sortRowsByTime(table.rows, state.mapping.timeCol);
    var theme = Themes.active().chart;

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
        data = { categories: labels, values: rows.map(function (r) { return toNum(r[col]); }) };
      } else if (type === 'radar') {
        var wide = state.det && state.det.orientation === 'wide';
        if (state.transposed) wide = !wide;
        data = buildRadarData(rows, state.mapping.timeCol, yCols, wide);
      } else {
        data = { labels: labels, series: yCols.map(function (col) {
          return { name: col, values: rows.map(function (r) { return toNum(r[col]); }) };
        })};
      }
      data.annotations = echartsAnnotations(state.viewKey);
      data.showAllLabels = (state.labelMode === 'all');
      renderAnalysis(labels, yCols.map(function (col) { return { name: col, values: rows.map(function (r) { return toNum(r[col]); }) }; }));
      clearStage();
      var c = document.createElement('div'); c.className = 'chart-canvas'; el('chart-stage').appendChild(c);
      var uinst = ChartFactory.render(c, type, data, theme);
      attachAnnotationHandler(uinst);
      state.echartsEl = c;
      setHead({ title: '用户数据 · ' + (TYPE_LABELS[type] || type), subtitle: '', unit: '', source: '' });
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
      state.labelMode = state.labelMode === 'off' ? 'all' : (state.labelMode === 'all' ? 'one' : 'off');
      syncLabelsBtn();
      if (state.mode === 'imported' || state.mode === 'dataset') rerender();
      else if (state.labelMode !== 'off') toast('数据标注适用于导入的数据');
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
      if (state.mode === 'imported') { state.mapping.chartType = this.value; rerender(); }
      else toast('图表类型切换适用于导入的数据');
    });

    // 图片数据识别（在导入弹层内）
    el('img-calx').addEventListener('click', function () { dgSetMode('x1'); });
    el('img-caly').addEventListener('click', function () { dgSetMode('y1'); });
    el('img-point-mode').addEventListener('click', function () { dgSetMode('point'); });
    el('img-clear').addEventListener('click', dgClear);
    el('img-generate').addEventListener('click', dgGenerate);

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
    el('render-btn').addEventListener('click', function () { renderUserChart(true); });
    el('btn-split').addEventListener('click', renderSplitCharts);
    el('render-all-btn').addEventListener('click', function () { renderDashboard(state.datasets, true); });

    window.addEventListener('resize', function () {
      ChartFactory.resizeAll();
    });
  }

  function loadImageIntoDigitizer(file) {
    var imgTab = document.querySelector('.tab[data-tab="image"]');
    if (imgTab) imgTab.click();
    var img = new Image();
    img.onload = function () {
      digitizer.img = img;
      digitizer.calib = { x1: null, x2: null, y1: null, y2: null };
      digitizer.points = [];
      var canvas = el('img-canvas'), wrap = el('img-canvas-wrap');
      canvas.width = wrap.clientWidth || 600; canvas.height = wrap.clientHeight || 320;
      dgRedraw();
      dgUpdateUI();
    };
    img.src = URL.createObjectURL(file);
  }

  function handleFile(file) {
    var name = (file.name || '').toLowerCase();
    var isImage = (file.type && file.type.indexOf('image/') === 0) || /\.(png|jpe?g|gif|webp|bmp)$/.test(name);
    if (isImage) { loadImageIntoDigitizer(file); return; }
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
      return { name: col, values: rows.map(function (r) { return toNum(r[col]); }) };
    });
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
    var theme = Themes.active().chart;
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
      chart.data.showAllLabels = (state.labelMode === 'all');
      var c = document.createElement('div'); c.className = 'chart-canvas'; stage.appendChild(c);
      var dsi = ChartFactory.render(c, chart.type, chart.data, theme);
      attachAnnotationHandler(dsi);
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

    var theme = Themes.active().chart;
    var stage = el('chart-stage');
    var grid = document.createElement('div');
    grid.className = 'dash-grid';
    datasets.forEach(function (ds) {
      var chart = datasetToChart(ds);
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
        ChartFactory.render(body, chart.type, chart.data, theme);
      }
    });
    stage.appendChild(grid);
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
    state.mode = 'dashboard';
    state.dashboardDatasets = null; state.currentTemplate = null; state.dataset = null;
    highlightNav(null);
    var theme = Themes.active().chart;
    var stage = el('chart-stage');
    var grid = document.createElement('div'); grid.className = 'dash-grid';
    cols.forEach(function (col) {
      var panel = document.createElement('div'); panel.className = 'dash-panel';
      panel.innerHTML = '<div class="dash-panel-head"><span class="dash-panel-title">' + col + '</span></div><div class="dash-panel-body"></div>';
      grid.appendChild(panel);
      var body = panel.querySelector('.dash-panel-body');
      var data = { labels: table.rows.map(function (r) { return String(r[timeCol]); }), series: [{ name: col, values: table.rows.map(function (r) { return toNum(r[col]); }) }] };
      ChartFactory.render(body, (state.det && state.det.isTimeSeries) ? 'area' : 'bar', data, theme);
    });
    stage.appendChild(grid);
    setHead({ title: '多指标拆分视图', subtitle: '', unit: '', source: '' });
    el('hint').textContent = '已拆分为 ' + cols.length + ' 个图表';
    syncToolbar();
  }

  /* ============================================================
   * 宏观数据变换（变频 / 同比环比累计 / 自定义公式）
   * ============================================================ */
  function currentTable() {
    if (state.mode === 'imported' && state.table) return { table: state.table, timeCol: state.mapping.timeCol };
    if (state.mode === 'dataset' && state.dataset) return { table: state.dataset.table, timeCol: state.dataset.detection.timeCol };
    return null;
  }

  function openTransform() {
    var src = currentTable();
    if (!src || !src.table) { toast('请先导入数据或选择一个数据表'); return; }
    state.tfTable = src.table;
    state.tfTimeCol = src.timeCol;
    // 填充指标运算下拉
    var cols = src.table.columns.filter(function (c) { return c !== src.timeCol && !isNaN(toNum(src.table.rows[0][c])); });
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
    state.table = t;
    state.det = DataLoader.detectTable(t);
    state.mapping.timeCol = state.tfTimeCol;
    state.mapping.yCols = state.det.numericCols.filter(function (c) { return c !== state.tfTimeCol; });
    state.mapping.chartType = state.det.isTimeSeries ? 'area' : 'bar';
    state.isImported = true; state.mode = 'imported';
    state.viewKey = 'imported';
    closeTransform();
    renderUserChart(false);
  }

  /* ============================================================
   * 图片数据识别（图表描点取数）
   * ============================================================ */
  var digitizer = {
    img: null, ctx: null, canvas: null,
    calib: { x1: null, x2: null, y1: null, y2: null },
    mode: null, points: []
  };

  function dgNum(v) { var n = Number(v); return isNaN(n) ? 0 : n; }
  function dgInterp(px, p1, p2, v1, v2) { return p2 === p1 ? v1 : v1 + (px - p1) * (v2 - v1) / (p2 - p1); }

  function dgRedraw() {
    var ctx = digitizer.ctx, canvas = digitizer.canvas;
    if (!ctx || !digitizer.img) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var cw = canvas.width, ch = canvas.height;
    var scale = Math.min(cw / digitizer.img.naturalWidth, ch / digitizer.img.naturalHeight);
    var dw = digitizer.img.naturalWidth * scale, dh = digitizer.img.naturalHeight * scale;
    var ox = (cw - dw) / 2, oy = (ch - dh) / 2;
    ctx.drawImage(digitizer.img, ox, oy, dw, dh);
    var names = { x1: 'X1', x2: 'X2', y1: 'Y1', y2: 'Y2' };
    Object.keys(digitizer.calib).forEach(function (k) {
      var c = digitizer.calib[k];
      if (!c) return;
      ctx.fillStyle = (k.indexOf('x') === 0) ? '#2962FF' : '#26A69A';
      ctx.beginPath(); ctx.arc(c.px, c.py, 5, 0, Math.PI * 2); ctx.fill();
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(names[k], c.px + 8, c.py - 6);
    });
    digitizer.points.forEach(function (p) {
      ctx.fillStyle = '#C9A96A';
      ctx.beginPath(); ctx.arc(p.px, p.py, 3.5, 0, Math.PI * 2); ctx.fill();
    });
  }

  function dgClick(px, py) {
    var m = digitizer.mode;
    if (m === 'x1' || m === 'x2' || m === 'y1' || m === 'y2') {
      digitizer.calib[m] = { px: px, py: py };
      digitizer.mode = (m === 'x1') ? 'x2' : (m === 'x2') ? null : (m === 'y1') ? 'y2' : null;
      dgRedraw();
      dgUpdateUI();
    } else if (m === 'point') {
      if (!digitizer.calib.x1 || !digitizer.calib.x2 || !digitizer.calib.y1 || !digitizer.calib.y2) { toast('请先完成 X、Y 轴两点标定'); return; }
      var xv = dgInterp(px, digitizer.calib.x1.px, digitizer.calib.x2.px, dgNum(el('img-x1').value), dgNum(el('img-x2').value));
      var yv = dgInterp(py, digitizer.calib.y1.py, digitizer.calib.y2.py, dgNum(el('img-y1').value), dgNum(el('img-y2').value));
      digitizer.points.push({ px: px, py: py, x: xv, y: yv });
      dgRedraw();
      dgUpdateUI();
    }
  }

  function dgUpdateUI() {
    var list = el('img-points');
    list.innerHTML = '';
    digitizer.points.slice().sort(function (a, b) { return a.x - b.x; }).forEach(function (p) {
      list.innerHTML += '<div class="img-point">x=' + Math.round(p.x * 100) / 100 + '　y=' + Math.round(p.y * 1000) / 1000 + '</div>';
    });
    el('img-status').textContent = '已取 ' + digitizer.points.length + ' 个点';
  }

  function dgSetMode(m) { digitizer.mode = m; dgUpdateUI(); toast(m === 'point' ? '现在点击图表数据点取数' : '请依次点击两点'); }

  function dgClear() { digitizer.points = []; digitizer.calib = { x1: null, x2: null, y1: null, y2: null }; dgRedraw(); dgUpdateUI(); }

  function dgGenerate() {
    if (digitizer.points.length < 2) { toast('至少取 2 个数据点'); return; }
    var pts = digitizer.points.slice().sort(function (a, b) { return a.x - b.x; });
    var table = { columns: ['x', 'y'], rows: pts.map(function (p) { var o = {}; o['x'] = Math.round(p.x * 100) / 100; o['y'] = Math.round(p.y * 1000) / 1000; return o; }) };
    state.table = table;
    state.det = DataLoader.detectTable(table);
    state.mapping.timeCol = 'x';
    state.mapping.yCols = ['y'];
    state.mapping.chartType = 'area';
    state.isImported = true; state.mode = 'imported'; state.viewKey = 'imported';
    closeModal();
    renderUserChart(false);
    toast('已从图片提取 ' + pts.length + ' 个数据点');
  }

  function setupDigitizer() {
    var canvas = el('img-canvas');
    var wrap = el('img-canvas-wrap');
    digitizer.canvas = canvas;
    digitizer.ctx = canvas.getContext('2d');
    el('img-file').addEventListener('change', function () {
      var f = this.files[0]; if (!f) return;
      var img = new Image();
      img.onload = function () {
        digitizer.img = img;
        digitizer.calib = { x1: null, x2: null, y1: null, y2: null };
        digitizer.points = [];
        canvas.width = wrap.clientWidth; canvas.height = wrap.clientHeight;
        dgRedraw();
        dgUpdateUI();
      };
      img.src = URL.createObjectURL(f);
    });
    canvas.addEventListener('click', function (e) {
      if (!digitizer.img) { toast('请先上传图片'); return; }
      var rect = canvas.getBoundingClientRect();
      dgClick(e.clientX - rect.left, e.clientY - rect.top);
    });
  }

  /* ---------- 图表配置 JSON（大模型输出 / 分享链接） ---------- */
  function applyChartConfig(cfg) {
    var type = cfg.type || 'area';
    if (!ChartFactory.BUILDERS[type] || type === 'candlestick') { toast('不支持的图表类型: ' + type); return; }
    var data = {};
    if (cfg.labels !== undefined && cfg.series !== undefined) data = { labels: cfg.labels, series: cfg.series };
    else if (cfg.indicators !== undefined && cfg.series !== undefined) data = { indicators: cfg.indicators, series: cfg.series };
    else if (cfg.data) data = cfg.data;
    else { toast('JSON 缺少 labels/series 或 indicators/series'); return; }
    clearStage();
    state.mode = 'imported'; state.isImported = true; state.viewKey = 'imported';
    state.currentTemplate = null; state.dataset = null; state.dashboardDatasets = null;
    state.table = null; state.det = null;
    highlightNav(null);
    el('btn-events').style.display = 'none';
    el('stat-badge').style.display = 'none';
    var theme = Themes.active().chart;
    var c = document.createElement('div'); c.className = 'chart-canvas'; el('chart-stage').appendChild(c);
    var ci = ChartFactory.render(c, type, data, theme);
    attachAnnotationHandler(ci);
    state.echartsEl = c;
    setHead({ title: cfg.title || '图表', subtitle: '', unit: cfg.unit || '', source: '' });
    el('hint').textContent = '已加载图表配置';
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
    var series = state.mapping.yCols.map(function (col) { return { name: col, values: state.table.rows.map(function (r) { return toNum(r[col]); }) }; });
    var title = state.customTitles[state.viewKey] || (state.currentMeta && state.currentMeta.title) || '图表';
    return { type: type, title: title, labels: labels, series: series };
  }

  function copyShareLink() {
    if (state.mode !== 'imported' || !state.table) { toast('复制链接仅适用于已导入的数据'); return; }
    var json = JSON.stringify(buildChartConfig());
    var b64 = btoa(unescape(encodeURIComponent(json)));
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

  /* ---------- 启动 ---------- */
  function init() {
    var q = {};
    try { new URLSearchParams(location.search).forEach(function (v, k) { q[k] = v; }); } catch (e) {}
    if (q.theme && Themes.getTheme(q.theme)) state.theme = q.theme;
    if (q.tpl && DataLoader.SAMPLES[q.tpl]) state.currentTemplate = q.tpl;
    Themes.applyTheme(state.theme);
    if (window.WORLD_GEOJSON) { try { echarts.registerMap('world', window.WORLD_GEOJSON); } catch (e) {} }
    buildThemeSelect();
    buildSidebar();
    buildTabs();
    buildSampleTab();
    bindEvents();
    setupDigitizer();
    if (el('btn-watermark')) el('btn-watermark').classList.add('active');
    el('footer-note').textContent = 'Advanced-Financial-Graph (AFG) · 数据仅本地处理 · 生成于 ' + new Date().toLocaleDateString('zh-CN');
    if (q.chart) {
      try {
        var cfg = JSON.parse(decodeURIComponent(escape(atob(q.chart))));
        applyChartConfig(cfg);
        return;
      } catch (e) { toast('图表链接无效'); }
    }
    if (q.tpl && DataLoader.SAMPLES[q.tpl]) renderTemplate(q.tpl);
    else renderHome();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
