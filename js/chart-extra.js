/* ADV 扩展图表构建器：覆盖 9 大分类的全部图表类型 */
(function (global) {
  'use strict';

  var B = {};   // type -> builder(el, data, theme)

  /* ---------- 通用工具 ---------- */
  function rgba(hex, a) {
    if (!hex) return 'rgba(26,26,46,' + a + ')';
    var h = hex.charAt(0) === '#' ? hex.slice(1) : hex;
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (h.length !== 6) return 'rgba(26,26,46,' + a + ')';
    var r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
  }
  function axes(theme, opts) {
    return Object.assign({
      axisLine: { lineStyle: { color: rgba(theme.text, 0.25) } },
      axisTick: { show: false },
      axisLabel: { color: theme.muted, fontSize: 11 },
      splitLine: { lineStyle: { color: theme.grid } }
    }, opts || {});
  }
  function base(theme) { return { backgroundColor: theme.bg, animationDuration: 600 }; }
  function tip(theme) {
    return Object.assign({ trigger: 'item', confine: true }, {
      backgroundColor: theme.panel, borderColor: rgba(theme.accent, 0.4), borderWidth: 1,
      textStyle: { color: theme.text, fontSize: 11 }
    });
  }
  function legend(theme, opts) {
    return Object.assign({ textStyle: { color: theme.muted, fontSize: 11 }, itemWidth: 10, itemHeight: 10, top: 4, left: 8 }, opts || {});
  }
  function color(theme, i) { return (theme.series && theme.series[i % theme.series.length]) || theme.accent; }
  function num(v) { return (v === null || v === undefined || isNaN(v)) ? '—' : (Math.abs(v) >= 1000 ? v.toLocaleString('en-US', { maximumFractionDigits: 0 }) : String(Number(Number(v).toFixed(2)))); }

  /* ================= 1. 比较与排序 ================= */
  B.groupedBar = function (el, d, theme) {
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'axis' }),
      legend: legend(theme),
      grid: { left: 40, right: 16, top: 34, bottom: 26 },
      xAxis: Object.assign({ type: 'category', data: d.labels }, axes(theme, { splitLine: { show: false } })),
      yAxis: Object.assign({ type: 'value' }, axes(theme)),
      series: d.series.map(function (s, i) {
        return { name: s.name, type: 'bar', data: s.values, barGap: '10%', barWidth: '32%',
          itemStyle: { color: color(theme, i), borderRadius: [3, 3, 0, 0] } };
      })
    });
  };

  B.tornado = function (el, d, theme) {
    var n = d.labels.length;
    return Object.assign(base(theme), {
      tooltip: tip(theme), legend: legend(theme, { data: [d.leftName, d.rightName] }),
      grid: { left: 10, right: 10, top: 34, bottom: 26, containLabel: true },
      xAxis: Object.assign({ type: 'value', axisLabel: { color: theme.muted, fontSize: 10, formatter: function (v) { return Math.abs(v); } } }, axes(theme)),
      yAxis: Object.assign({ type: 'category', data: d.labels.slice().reverse(), axisLabel: { color: theme.text, fontSize: 11 } }, axes(theme, { splitLine: { show: false } })),
      series: [
        { name: d.leftName, type: 'bar', stack: 't', data: d.left.slice().reverse().map(function (v) { return -v; }),
          itemStyle: { color: color(theme, 0), borderRadius: [3, 0, 0, 3] }, label: { show: true, position: 'left', color: theme.muted, fontSize: 10, formatter: function (p) { return Math.abs(p.value); } } },
        { name: d.rightName, type: 'bar', stack: 't', data: d.right.slice().reverse(),
          itemStyle: { color: color(theme, 1), borderRadius: [0, 3, 3, 0] }, label: { show: true, position: 'right', color: theme.muted, fontSize: 10 } }
      ]
    });
  };

  B.lollipop = function (el, d, theme) {
    var idx = d.labels.map(function (_, i) { return i; });
    return Object.assign(base(theme), {
      tooltip: tip(theme),
      grid: { left: 10, right: 30, top: 20, bottom: 26, containLabel: true },
      xAxis: Object.assign({ type: 'value' }, axes(theme)),
      yAxis: Object.assign({ type: 'category', data: d.labels, axisLabel: { color: theme.text, fontSize: 11 } }, axes(theme, { splitLine: { show: false } })),
      series: [
        { type: 'bar', data: d.values, barWidth: 2.5, itemStyle: { color: rgba(theme.text, 0.22) }, silent: true, z: 1 },
        { type: 'scatter', data: d.values, symbolSize: 13, itemStyle: { color: theme.accent }, z: 2,
          label: { show: true, position: 'right', color: theme.text, fontSize: 11, fontWeight: 600, formatter: function (p) { return num(p.value); } } }
      ]
    });
  };

  B.bullet = function (el, d, theme) {
    var rows = d.rows || [];
    var names = rows.map(function (r) { return r.name; });
    var maxV = 0;
    rows.forEach(function (r) { maxV = Math.max(maxV, r.target, r.value, r.ranges[r.ranges.length - 1]); });
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'axis' }),
      grid: { left: 10, right: 26, top: 16, bottom: 24, containLabel: true },
      xAxis: Object.assign({ type: 'value', max: Math.ceil(maxV * 1.1) }, axes(theme)),
      yAxis: Object.assign({ type: 'category', data: names, axisLabel: { color: theme.text, fontSize: 11 } }, axes(theme, { splitLine: { show: false } })),
      series: [
        { type: 'bar', data: rows.map(function (r) { return r.ranges[2]; }), barWidth: 22, itemStyle: { color: rgba(theme.text, 0.06) }, silent: true, z: 1 },
        { type: 'bar', data: rows.map(function (r) { return r.ranges[1]; }), barWidth: 22, itemStyle: { color: rgba(theme.text, 0.1) }, silent: true, z: 1 },
        { type: 'bar', data: rows.map(function (r) { return r.value; }), barWidth: 11, itemStyle: { color: theme.accent, borderRadius: 2 }, z: 3,
          label: { show: true, position: 'right', color: theme.text, fontSize: 11, fontWeight: 600, formatter: function (p) { return num(p.value); } } },
        { type: 'scatter', data: rows.map(function (r) { return r.target; }), symbol: 'rect', symbolSize: [3, 20], itemStyle: { color: theme.text }, z: 4 }
      ]
    });
  };

  /* 词云：螺旋布局 + 粗略防重叠 */
  B.wordcloud = function (el, d, theme) {
    var words = (d.words || []).slice().sort(function (a, b) { return b.weight - a.weight; });
    var W = (el && el.clientWidth) || 700, H = (el && el.clientHeight) || 380;
    var maxW = words[0] ? words[0].weight : 100;
    var minW = words[words.length - 1] ? words[words.length - 1].weight : 10;
    var boxes = [];
    var els = [];
    var colors = theme.series;
    words.forEach(function (w, i) {
      var fs = Math.round(12 + (w.weight - minW) / Math.max(1, maxW - minW) * 26);
      var tw = w.text.length * fs * 1.05, th = fs * 1.25;
      var placed = false, a = 0, r = 0;
      while (!placed && r < Math.max(W, H)) {
        var x = W / 2 + r * Math.cos(a) - tw / 2;
        var y = H / 2 + r * Math.sin(a) * 0.62 - th / 2;
        var ok = x > 4 && y > 4 && x + tw < W - 4 && y + th < H - 4 &&
          !boxes.some(function (b) { return x < b.x + b.w + 3 && x + tw + 3 > b.x && y < b.y + b.h + 3 && y + th + 3 > b.y; });
        if (ok) {
          boxes.push({ x: x, y: y, w: tw, h: th });
          els.push({ type: 'text', left: Math.round(x), top: Math.round(y),
            style: { text: w.text, fill: colors[i % colors.length], font: (i < 3 ? '700 ' : '500 ') + fs + 'px Inter, "PingFang SC", sans-serif' } });
          placed = true;
        } else { a += 0.45; r += 0.55; }
      }
    });
    return Object.assign(base(theme), {
      tooltip: { show: false },
      graphic: els,
      _noPolish: true
    });
  };

  /* ================= 3. 构成与占比 ================= */
  B.pie = function (el, d, theme) {
    var data = d.data || [];
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { formatter: function (p) { return p.name + '：' + p.value + '%'; } }),
      legend: legend(theme, { orient: 'vertical', right: 10, top: 'middle' }),
      series: [{
        type: 'pie', radius: ['0%', '68%'], center: ['38%', '52%'], roseType: false,
        itemStyle: { borderColor: theme.bg, borderWidth: 2 },
        label: { color: theme.text, fontSize: 11, formatter: '{b}\n{d}%' },
        labelLine: { lineStyle: { color: rgba(theme.text, 0.3) } },
        data: data.map(function (x, i) { return { name: x.name, value: x.value, itemStyle: { color: color(theme, i) } }; })
      }]
    });
  };

  B.percentBar = function (el, d, theme) {
    var totals = d.labels.map(function (_, i) { return d.series.reduce(function (s, se) { return s + se.values[i]; }, 0); });
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'axis', valueFormatter: function (v) { return v + '%'; } }),
      legend: legend(theme),
      grid: { left: 10, right: 16, top: 34, bottom: 24, containLabel: true },
      xAxis: Object.assign({ type: 'value', max: 100, axisLabel: { color: theme.muted, fontSize: 10, formatter: '{value}%' } }, axes(theme)),
      yAxis: Object.assign({ type: 'category', data: d.labels, axisLabel: { color: theme.text, fontSize: 11 } }, axes(theme, { splitLine: { show: false } })),
      series: d.series.map(function (s, i) {
        return { name: s.name, type: 'bar', stack: 'p', barWidth: '46%',
          data: s.values.map(function (v, j) { return Math.round(v / totals[j] * 1000) / 10; }),
          itemStyle: { color: color(theme, i) },
          label: { show: true, color: '#fff', fontSize: 10, formatter: function (p) { return p.value >= 8 ? p.value + '%' : ''; } } };
      })
    });
  };

  B.sunburst = function (el, d, theme) {
    return Object.assign(base(theme), {
      tooltip: { trigger: 'item', formatter: function (p) { return p.name + '：' + num(p.value); } },
      series: [{
        type: 'sunburst', data: d.data, radius: ['16%', '86%'], center: ['50%', '52%'],
        itemStyle: { borderColor: theme.bg, borderWidth: 2 },
        label: { color: theme.text, fontSize: 10, rotate: 'radial' },
        levels: [{}, { r0: '16%', r: '48%', label: { rotate: 0 } }, { r0: '48%', r: '86%' }],
        color: theme.series
      }]
    });
  };

  /* ================= 4. 分布 ================= */
  function bin(values, n) {
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var step = (max - min) / n || 1;
    var bins = [], counts = [];
    for (var i = 0; i < n; i++) { bins.push(Math.round((min + step * i) * 10) / 10 + '–' + Math.round((min + step * (i + 1)) * 10) / 10); counts.push(0); }
    values.forEach(function (v) { var k = Math.min(n - 1, Math.floor((v - min) / step)); counts[k]++; });
    return { bins: bins, counts: counts };
  }
  B.histogram = function (el, d, theme) {
    var h = bin(d.values, 12);
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'axis' }),
      grid: { left: 40, right: 16, top: 20, bottom: 30 },
      xAxis: Object.assign({ type: 'category', data: h.bins, axisLabel: { color: theme.muted, fontSize: 9, interval: 1, rotate: 30 } }, axes(theme, { splitLine: { show: false } })),
      yAxis: Object.assign({ type: 'value', name: '频数', nameTextStyle: { color: theme.muted, fontSize: 10 } }, axes(theme)),
      series: [{ type: 'bar', data: h.counts, barWidth: '86%', itemStyle: { color: theme.accent, borderRadius: [2, 2, 0, 0] } }]
    });
  };

  B.boxplot = function (el, d, theme) {
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'item' }),
      grid: { left: 44, right: 16, top: 20, bottom: 26 },
      xAxis: Object.assign({ type: 'category', data: d.categories, boundaryGap: true }, axes(theme, { splitLine: { show: false } })),
      yAxis: Object.assign({ type: 'value', scale: true }, axes(theme)),
      series: [{ type: 'boxplot', data: d.boxes, boxWidth: [12, 34],
        itemStyle: { color: rgba(theme.accent, 0.22), borderColor: theme.accent, borderWidth: 1.4 } }]
    });
  };

  function kde(values, min, max, n) {
    var h = 1.06 * std(values) * Math.pow(values.length, -0.2) || 1;
    var out = [];
    for (var i = 0; i < n; i++) {
      var x = min + (max - min) * i / (n - 1), s = 0;
      values.forEach(function (v) { s += Math.exp(-0.5 * Math.pow((x - v) / h, 2)); });
      out.push([x, s / (values.length * h * Math.sqrt(2 * Math.PI))]);
    }
    return out;
  }
  function std(v) {
    var m = v.reduce(function (a, b) { return a + b; }, 0) / v.length;
    return Math.sqrt(v.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / v.length);
  }
  B.violin = function (el, d, theme) {
    var cats = d.categories || [], groups = d.groups || [];
    var all = [].concat.apply([], groups);
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var series = [];
    groups.forEach(function (g, gi) {
      var pts = kde(g, lo, hi, 24);
      var maxD = Math.max.apply(null, pts.map(function (p) { return p[1]; }));
      var right = pts.map(function (p) { return [p[0], gi + 0.34 * p[1] / maxD]; });
      var left = pts.map(function (p) { return [p[0], gi - 0.34 * p[1] / maxD]; }).reverse();
      series.push({ type: 'line', data: right, showSymbol: false, smooth: true, silent: true,
        lineStyle: { color: color(theme, gi), width: 1.4 }, areaStyle: { color: rgba(color(theme, gi), 0.25), origin: 'start' }, z: 2 });
      series.push({ type: 'line', data: left, showSymbol: false, smooth: true, silent: true,
        lineStyle: { color: color(theme, gi), width: 1.4 }, z: 2 });
      var q1 = quantile(g, .25), q2 = quantile(g, .5), q3 = quantile(g, .75);
      series.push({ type: 'scatter', data: [[q2, gi]], symbolSize: 5, itemStyle: { color: theme.text }, z: 5 });
      series.push({ type: 'line', data: [[q1, gi], [q3, gi]], silent: true, lineStyle: { color: theme.text, width: 8, opacity: .25 }, z: 4 });
    });
    return Object.assign(base(theme), {
      tooltip: { trigger: 'item', backgroundColor: theme.panel, borderColor: rgba(theme.accent, .4), textStyle: { color: theme.text, fontSize: 11 } },
      grid: { left: 50, right: 18, top: 18, bottom: 26 },
      xAxis: Object.assign({ type: 'value', scale: true }, axes(theme)),
      yAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: theme.text, fontSize: 11 } }, axes(theme, { splitLine: { show: false } })),
      series: series
    });
  };
  function quantile(arr, q) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var pos = (a.length - 1) * q, base = Math.floor(pos), rest = pos - base;
    return a[base + 1] !== undefined ? a[base] + rest * (a[base + 1] - a[base]) : a[base];
  }

  B.beeswarm = function (el, d, theme) {
    var cats = d.categories || [], groups = d.groups || [];
    var pts = [];
    groups.forEach(function (g, gi) {
      var sorted = g.slice().sort(function (a, b) { return a - b; });
      var offsets = [];
      sorted.forEach(function (v, i) {
        var jx = 0, k = 0;
        while (offsets.some(function (o) { return Math.abs(o.v - v) < 2 && Math.abs(o.jx - jx) < 0.09; }) && k < 20) { jx = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.09; k++; }
        offsets.push({ v: v, jx: jx });
        pts.push([v, gi + jx]);
      });
    });
    return Object.assign(base(theme), {
      tooltip: { trigger: 'item', formatter: function (p) { return num(p.value[0]); }, backgroundColor: theme.panel, borderColor: rgba(theme.accent, .4), textStyle: { color: theme.text, fontSize: 11 } },
      grid: { left: 52, right: 18, top: 18, bottom: 26 },
      xAxis: Object.assign({ type: 'value', scale: true }, axes(theme)),
      yAxis: Object.assign({ type: 'category', data: cats, axisLabel: { color: theme.text, fontSize: 11 } }, axes(theme, { splitLine: { show: false } })),
      series: [{ type: 'scatter', data: pts, symbolSize: 5, itemStyle: { color: rgba(theme.accent, 0.75) } }]
    });
  };

  B.ridge = function (el, d, theme) {
    var labels = d.labels || [], groups = d.groups || [];
    var all = [].concat.apply([], groups);
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var series = [];
    groups.forEach(function (g, gi) {
      var pts = kde(g, lo, hi, 40);
      var maxD = Math.max.apply(null, pts.map(function (p) { return p[1]; }));
      var offset = (groups.length - 1 - gi) * 1.0;
      series.push({
        type: 'line', smooth: true, showSymbol: false, silent: true,
        data: pts.map(function (p) { return [p[0], offset + 0.85 * p[1] / maxD]; }),
        lineStyle: { color: color(theme, gi), width: 1.3 },
        areaStyle: { color: rgba(color(theme, gi), 0.35), origin: 'start' },
        z: 2 + gi
      });
    });
    return Object.assign(base(theme), {
      tooltip: { show: false },
      grid: { left: 50, right: 20, top: 14, bottom: 24 },
      xAxis: Object.assign({ type: 'value', scale: true }, axes(theme, { splitLine: { show: false } })),
      yAxis: Object.assign({ type: 'value', min: 0, max: groups.length + 0.2, show: false }, axes(theme, { splitLine: { show: false } })),
      graphic: labels.map(function (lb, i) {
        return { type: 'text', left: 6, top: (14 + (groups.length - 1 - i) * ((el && el.clientHeight || 380) - 40) / Math.max(1, groups.length)) + 'px',
          style: { text: lb, fill: theme.muted, font: '11px Inter, "PingFang SC", sans-serif' } };
      }),
      series: series
    });
  };

  B.ecdf = function (el, d, theme) {
    var s = (d.samples || []).slice().sort(function (a, b) { return a - b; });
    var n = s.length;
    var ecdf = s.map(function (v, i) { return [v, Math.round((i + 1) / n * 1000) / 10]; });
    return Object.assign(base(theme), {
      tooltip: { trigger: 'axis', backgroundColor: theme.panel, borderColor: rgba(theme.accent, .4), textStyle: { color: theme.text, fontSize: 11 } },
      legend: legend(theme),
      grid: { left: 46, right: 20, top: 32, bottom: 28 },
      xAxis: Object.assign({ type: 'value', scale: true, name: '样本值', nameTextStyle: { color: theme.muted, fontSize: 10 } }, axes(theme)),
      yAxis: Object.assign({ type: 'value', max: 100, axisLabel: { color: theme.muted, fontSize: 10, formatter: '{value}%' } }, axes(theme)),
      series: [
        { name: 'ECDF', type: 'line', data: ecdf, showSymbol: false, step: 'end',
          lineStyle: { color: theme.accent, width: 2 }, areaStyle: { color: rgba(theme.accent, 0.12) } },
        { name: '理论分位', type: 'line', showSymbol: false,
          data: [[s[0], 0], [s[Math.floor(n / 2)], 50], [s[n - 1], 100]],
          lineStyle: { color: rgba(theme.text, 0.35), type: 'dashed', width: 1.2 } }
      ]
    });
  };

  /* ================= 5. 关系与相关 ================= */
  B.scatter = function (el, d, theme) {
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'item', formatter: function (p) { return p.seriesName + '<br/>' + d.xName + '：' + p.value[0] + '<br/>' + d.yName + '：' + p.value[1]; } }),
      grid: { left: 48, right: 20, top: 22, bottom: 40 },
      xAxis: Object.assign({ type: 'value', scale: true, name: d.xName, nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: theme.muted, fontSize: 11 } }, axes(theme)),
      yAxis: Object.assign({ type: 'value', scale: true, name: d.yName, nameTextStyle: { color: theme.muted, fontSize: 11 } }, axes(theme)),
      series: [{ name: d.seriesName || '样本', type: 'scatter', data: d.points, symbolSize: 9,
        itemStyle: { color: rgba(theme.accent, 0.7), borderColor: theme.panel, borderWidth: 1 } }]
    });
  };

  B.corrMatrix = function (el, d, theme) {
    var names = d.names, m = d.matrix;
    var data = [];
    for (var i = 0; i < names.length; i++) for (var j = 0; j < names.length; j++) data.push([j, i, m[i][j]]);
    return Object.assign(base(theme), {
      tooltip: { trigger: 'item', backgroundColor: theme.panel, borderColor: rgba(theme.accent, .4), textStyle: { color: theme.text, fontSize: 11 },
        formatter: function (p) { return names[p.value[1]] + ' × ' + names[p.value[0]] + '<br/>相关系数：' + p.value[2].toFixed(2); } },
      grid: { left: 90, right: 20, top: 20, bottom: 70 },
      xAxis: Object.assign({ type: 'category', data: names, splitArea: { show: false }, axisLabel: { color: theme.muted, fontSize: 10, rotate: 35 } }, axes(theme, { splitLine: { show: false } })),
      yAxis: Object.assign({ type: 'category', data: names, axisLabel: { color: theme.muted, fontSize: 10 } }, axes(theme, { splitLine: { show: false } })),
      visualMap: { min: -1, max: 1, calculable: false, orient: 'horizontal', left: 'center', bottom: 6, itemWidth: 10, itemHeight: 80,
        textStyle: { color: theme.muted, fontSize: 9 }, inRange: { color: ['#6F8FA8', '#F5F2EA', '#C9A96A'] } },
      series: [{ type: 'heatmap', data: data,
        label: { show: true, color: theme.text, fontSize: 10, formatter: function (p) { return p.value[2].toFixed(2); } },
        itemStyle: { borderColor: theme.bg, borderWidth: 2 } }]
    });
  };

  B.venn = function (el, d, theme) {
    var W = (el && el.clientWidth) || 700, H = (el && el.clientHeight) || 380;
    var cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) * 0.26;
    var sets = d.sets || [];
    var centers = [[cx - R * 0.55, cy - R * 0.32], [cx + R * 0.55, cy - R * 0.32], [cx, cy + R * 0.55]];
    var els = sets.slice(0, 3).map(function (s, i) {
      return { type: 'circle', shape: { cx: centers[i][0], cy: centers[i][1], r: R },
        style: { fill: rgba(color(theme, i), 0.28), stroke: color(theme, i), lineWidth: 1.4 }, silent: true };
    });
    sets.slice(0, 3).forEach(function (s, i) {
      els.push({ type: 'text', left: centers[i][0] - s.name.length * 6, top: centers[i][1] - 26,
        style: { text: s.name + ' (' + s.value + ')', fill: theme.text, font: '600 12px Inter, "PingFang SC", sans-serif' } });
    });
    els.push({ type: 'text', left: cx - 34, top: cy - R * 0.5, style: { text: d.overlapAB || '', fill: theme.text, font: '700 12px Inter' } });
    els.push({ type: 'text', left: cx - 16, top: cy + R * 0.22, style: { text: d.overlapAll || '', fill: theme.text, font: '700 12px Inter' } });
    return Object.assign(base(theme), { tooltip: { show: false }, graphic: els, _noPolish: true });
  };

  B.arc = function (el, d, theme) {
    var nodes = (d.nodes || []).map(function (n, i) {
      return { name: n, x: i * 100, y: 0, symbolSize: 12, itemStyle: { color: theme.accent } };
    });
    var idx = {};
    d.nodes.forEach(function (n, i) { idx[n] = i; });
    var links = (d.links || []).map(function (l) {
      return { source: l[0], target: l[1], lineStyle: { color: rgba(theme.text, 0.4), width: 1.5, curveness: 0.5 } };
    });
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'item' }),
      series: [{
        type: 'graph', layout: 'none', data: nodes, links: links,
        roam: false, symbolSize: 12, edgeSymbol: ['none', 'none'],
        lineStyle: { color: rgba(theme.text, 0.35), curveness: 0.5, width: 1.4 },
        label: { show: true, position: 'bottom', color: theme.text, fontSize: 11 },
        itemStyle: { color: theme.accent, borderColor: theme.bg, borderWidth: 2 },
        top: '42%', bottom: '42%', left: 30, right: 30
      }]
    });
  };

  /* ================= 6. 流动与转化 ================= */
  B.funnel = function (el, d, theme) {
    var steps = d.steps || [];
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { formatter: function (p) { return p.name + '：' + p.value; } }),
      legend: legend(theme, { orient: 'vertical', right: 10, top: 'middle' }),
      series: [{
        type: 'funnel', left: '8%', right: '28%', top: 26, bottom: 20,
        minSize: '22%', maxSize: '96%', sort: 'descending', gap: 3,
        label: { show: true, position: 'inside', color: '#fff', fontSize: 11, formatter: function (p) { return p.name + ' ' + p.value; } },
        itemStyle: { borderColor: theme.bg, borderWidth: 1 },
        data: steps.map(function (s, i) { return { name: s.name, value: s.value, itemStyle: { color: color(theme, i) } }; })
      }]
    });
  };

  B.chord = function (el, d, theme) {
    var names = d.names, m = d.matrix;
    var nodes = names.map(function (n, i) {
      return { name: n, symbolSize: 10, itemStyle: { color: color(theme, i) }, label: { color: theme.text, fontSize: 11 } };
    });
    var links = [];
    for (var i = 0; i < names.length; i++) {
      for (var j = i + 1; j < names.length; j++) {
        var v = m[i][j] + m[j][i];
        if (v > 0) links.push({ source: names[i], target: names[j], value: v,
          lineStyle: { color: color(theme, i), width: Math.max(1, v / 6), opacity: 0.45 } });
      }
    }
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'item' }),
      series: [{
        type: 'graph', layout: 'circular', circular: { rotateLabel: true },
        data: nodes, links: links, roam: false, symbolSize: 10,
        lineStyle: { curveness: 0.4, opacity: 0.5 },
        label: { show: true, color: theme.text, fontSize: 11 },
        itemStyle: { borderColor: theme.bg, borderWidth: 2 },
        top: 30, bottom: 30
      }]
    });
  };

  /* ================= 7. 地理空间 ================= */
  function geoBase(theme, series) {
    return Object.assign(base(theme), {
      tooltip: { trigger: 'item', backgroundColor: theme.panel, borderColor: rgba(theme.accent, .4), textStyle: { color: theme.text, fontSize: 11 } },
      geo: {
        map: 'world', roam: true, zoom: 1.15, center: [30, 22],
        itemStyle: { areaColor: rgba(theme.text, 0.05), borderColor: rgba(theme.text, 0.16), borderWidth: 0.5 },
        emphasis: { itemStyle: { areaColor: rgba(theme.accent, 0.18) }, label: { show: false } },
        silent: false
      },
      series: series
    });
  }
  B.symbolMap = function (el, d, theme) {
    var pts = d.points || [];
    var max = Math.max.apply(null, pts.map(function (p) { return p.value; }));
    return geoBase(theme, [{
      type: 'scatter', coordinateSystem: 'geo', data: pts.map(function (p) { return { name: p.name, value: p.coord.concat(p.value) }; }),
      symbolSize: function (v) { return 8 + Math.sqrt(v[2] / max) * 24; },
      itemStyle: { color: rgba(theme.accent, 0.65), borderColor: theme.accent, borderWidth: 1 },
      label: { show: true, position: 'right', formatter: function (p) { return p.name; }, color: theme.text, fontSize: 10 }
    }]);
  };
  B.heatMapGeo = function (el, d, theme) {
    var pts = [];
    var hubs = [[121.47, 31.23], [-74.01, 40.71], [-0.13, 51.51], [139.69, 35.69], [103.82, 1.35], [55.27, 25.20], [151.21, -33.87], [-46.63, -23.55]];
    hubs.forEach(function (h, i) {
      for (var k = 0; k < 22; k++) pts.push([h[0] + (Math.sin(k * 7 + i) * 6), h[1] + (Math.cos(k * 5 + i) * 5), Math.round(30 + Math.abs(Math.sin(k + i)) * 90)]);
    });
    var opt = geoBase(theme, [{
      type: 'heatmap', coordinateSystem: 'geo', data: pts, pointSize: 8, blurSize: 12,
      minOpacity: 0.15, maxOpacity: 0.85
    }]);
    opt.visualMap = { min: 0, max: 120, calculable: false, show: false,
      inRange: { color: ['rgba(201,169,106,0.05)', 'rgba(201,169,106,0.55)', 'rgba(168,118,62,0.9)'] } };
    return opt;
  };
  B.trajectory = function (el, d, theme) {
    var path = d.path || [];
    var pts = path.map(function (p, i) { return { name: 'P' + (i + 1), value: p }; });
    return geoBase(theme, [
      { type: 'lines', coordinateSystem: 'geo', polyline: true, data: [{ coords: path }],
        lineStyle: { color: theme.accent, width: 2, opacity: 0.8, curveness: 0 }, effect: { show: true, period: 5, trailLength: 0.25, symbol: 'arrow', symbolSize: 7 } },
      { type: 'scatter', coordinateSystem: 'geo', data: pts, symbolSize: 7, itemStyle: { color: theme.text } }
    ]);
  };
  B.migration = function (el, d, theme) {
    var flows = d.flows || [];
    return geoBase(theme, [{
      type: 'lines', coordinateSystem: 'geo', zlevel: 2,
      data: flows.map(function (f) { return { coords: [f.from, f.to], value: f.value }; }),
      lineStyle: { color: theme.accent, width: 1.6, opacity: 0.6, curveness: 0.25 },
      effect: { show: true, period: 4, trailLength: 0.2, symbol: 'circle', symbolSize: 4 }
    }]);
  };
  B.flowMap = function (el, d, theme) {
    var flows = d.flows || [];
    return geoBase(theme, [
      { type: 'lines', coordinateSystem: 'geo', data: flows.map(function (f) { return { coords: [f.from, f.to], value: f.value }; }),
        lineStyle: { color: theme.accent, width: 1.8, opacity: 0.65, curveness: 0.28 },
        effect: { show: true, period: 4.5, trailLength: 0.22, symbol: 'arrow', symbolSize: 6 } },
      { type: 'effectScatter', coordinateSystem: 'geo', data: (d.hubs || []).map(function (h) { return { name: h.name, value: h.coord }; }),
        symbolSize: 9, rippleEffect: { brushType: 'stroke', scale: 3 }, itemStyle: { color: theme.accent } }
    ]);
  };
  B.hexMap = function (el, d, theme) {
    var pts = d.points || [];
    var max = Math.max.apply(null, pts.map(function (p) { return p.value; }));
    return geoBase(theme, [{
      type: 'scatter', coordinateSystem: 'geo',
      data: pts.map(function (p) { return { name: p.name, value: p.coord.concat(p.value) }; }),
      symbol: 'hexagon', symbolSize: function (v) { return 14 + (v[2] / max) * 26; },
      itemStyle: { color: rgba(theme.accent, 0.7), borderColor: theme.bg, borderWidth: 1 },
      label: { show: true, formatter: function (p) { return p.name; }, color: theme.text, fontSize: 9, position: 'bottom' }
    }]);
  };

  /* ================= 8. 层级与流程 ================= */
  B.tree = function (el, d, theme) {
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'item' }),
      series: [{
        type: 'tree', data: [d.tree], layout: 'orthogonal', orient: 'LR',
        left: 24, right: 90, top: 20, bottom: 20,
        symbol: 'circle', symbolSize: 8,
        lineStyle: { color: rgba(theme.text, 0.28), width: 1.4, curveness: 0.4 },
        label: { position: 'left', verticalAlign: 'middle', align: 'right', color: theme.text, fontSize: 11 },
        leaves: { label: { position: 'right', align: 'left' } },
        itemStyle: { color: theme.accent, borderColor: theme.bg, borderWidth: 1 },
        expandAndCollapse: false, initialTreeDepth: -1
      }]
    });
  };
  B.orgChart = function (el, d, theme) {
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'item' }),
      series: [{
        type: 'tree', data: [d.tree], layout: 'orthogonal', orient: 'TB',
        top: 30, bottom: 60, left: 40, right: 40,
        symbol: 'roundRect', symbolSize: [76, 26],
        lineStyle: { color: rgba(theme.text, 0.3), width: 1.4, curveness: 0 },
        label: { position: 'inside', color: theme.text, fontSize: 10 },
        itemStyle: { color: rgba(theme.accent, 0.16), borderColor: theme.accent, borderWidth: 1 },
        expandAndCollapse: false, initialTreeDepth: -1
      }]
    });
  };
  B.icicle = function (el, d, theme) {
    /* 用横向堆叠条模拟冰柱图（层级占比） */
    var rows = [];
    function walk(node, depth, start) {
      var total = node.value || (node.children || []).reduce(function (a, c) { return a + (c.value || 0); }, 0);
      rows.push({ name: node.name, depth: depth, start: start, value: total });
      var acc = start;
      (node.children || []).forEach(function (c) { walk(c, depth + 1, acc); acc += (c.value || 0); });
      return total;
    }
    walk(d.tree, 0, 0);
    var series = [];
    var maxDepth = Math.max.apply(null, rows.map(function (r) { return r.depth; }));
    for (var dep = 0; dep <= maxDepth; dep++) {
      var items = rows.filter(function (r) { return r.depth === dep; });
      series.push({
        name: 'L' + (dep + 1), type: 'bar', stack: 'ic', barWidth: '52%',
        data: items.map(function (it) {
          var arr = [];
          return { value: [it.start, it.start + it.value], name: it.name };
        }),
        encode: { x: [0, 1] },
        itemStyle: { color: rgba(theme.accent, 0.85 - dep * 0.22), borderColor: theme.bg, borderWidth: 1 },
        label: { show: true, position: 'inside', color: dep === 0 ? '#fff' : theme.text, fontSize: 10, formatter: function (p) { return p.name; } }
      });
    }
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'item' }),
      grid: { left: 20, right: 20, top: 20, bottom: 20 },
      xAxis: Object.assign({ type: 'value', show: false }, axes(theme)),
      yAxis: Object.assign({ type: 'category', data: ['层级'], show: false }, axes(theme)),
      series: series
    });
  };
  B.flowchart = function (el, d, theme) {
    var steps = d.steps || [];
    var n = steps.length;
    var W = (el && el.clientWidth) || 700;
    var gap = (W - 60) / Math.max(1, n);
    var nodes = steps.map(function (s, i) {
      var shape = s.type === 'decision' ? 'diamond' : (s.type === 'start' || s.type === 'end' ? 'roundRect' : 'rect');
      return { name: s.name, x: 30 + gap * i + gap / 2, y: 1, symbol: shape,
        symbolSize: s.type === 'decision' ? [64, 44] : [gap * 0.72, 34],
        itemStyle: { color: s.type === 'decision' ? rgba(theme.accent, 0.18) : rgba(theme.text, 0.06),
          borderColor: s.type === 'decision' ? theme.accent : rgba(theme.text, 0.3), borderWidth: 1.2 },
        label: { color: theme.text, fontSize: 10 } };
    });
    var idx = {}; steps.forEach(function (s, i) { idx[s.name] = i; });
    var links = [];
    for (var i = 0; i < n - 1; i++) links.push({ source: steps[i].name, target: steps[i + 1].name });
    return Object.assign(base(theme), {
      tooltip: { show: false },
      series: [{
        type: 'graph', layout: 'none', data: nodes, links: links, roam: false,
        lineStyle: { color: rgba(theme.text, 0.35), width: 1.4, curveness: 0 },
        edgeSymbol: ['none', 'arrow'], edgeSymbolSize: 7,
        label: { show: true, position: 'inside', color: theme.text, fontSize: 10 }
      }]
    });
  };
  B.swimlane = function (el, d, theme) {
    var lanes = d.lanes || [], tasks = d.tasks || [];
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'item', formatter: function (p) { return p.name; } }),
      grid: { left: 70, right: 20, top: 20, bottom: 26 },
      xAxis: Object.assign({ type: 'value', min: 0, max: Math.max.apply(null, tasks.map(function (t) { return t.start + t.span; })) + 1, show: true, axisLabel: { color: theme.muted, fontSize: 10 } }, axes(theme)),
      yAxis: Object.assign({ type: 'category', data: lanes, axisLabel: { color: theme.text, fontSize: 11 } }, axes(theme, { splitLine: { show: true } })),
      series: [{
        type: 'custom', renderItem: function (params, api) {
          var lane = api.value(0), start = api.value(1), span = api.value(2);
          var p0 = api.coord([start, lane]), p1 = api.coord([start + span, lane]);
          var h = api.size([0, 1])[1] * 0.42;
          return { type: 'rect', shape: { x: p0[0] + 1, y: p0[1] - h / 2, width: Math.max(6, p1[0] - p0[0] - 2), height: h },
            style: api.style({ fill: rgba(theme.accent, 0.75) }), styleEmphasis: api.styleEmphasis() };
        },
        encode: { x: [1, 2], y: 0 },
        data: tasks.map(function (t) { return { name: t.name, value: [t.lane, t.start, t.span],
          itemStyle: { color: rgba(color(theme, t.lane), 0.8) } }; }),
        label: { show: true, position: 'inside', color: '#fff', fontSize: 10, formatter: function (p) { return p.name; } }
      }]
    });
  };

  /* ================= 9. 特殊 ================= */
  B.control = function (el, d, theme) {
    var line = { type: 'line', data: d.values, showSymbol: false, smooth: true, lineStyle: { color: theme.accent, width: 2 }, z: 3 };
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'axis' }),
      grid: { left: 44, right: 46, top: 24, bottom: 26 },
      xAxis: Object.assign({ type: 'category', data: d.labels, axisLabel: { color: theme.muted, fontSize: 9, interval: 5 } }, axes(theme, { splitLine: { show: false } })),
      yAxis: Object.assign({ type: 'value', scale: true }, axes(theme)),
      series: [line,
        { type: 'line', data: d.values.map(function () { return d.ucl; }), showSymbol: false, silent: true, lineStyle: { color: rgba(theme.down, 0.7), type: 'dashed', width: 1.3 },
          endLabel: { show: true, formatter: 'UCL', color: theme.down, fontSize: 9 } },
        { type: 'line', data: d.values.map(function () { return d.lcl; }), showSymbol: false, silent: true, lineStyle: { color: rgba(theme.down, 0.7), type: 'dashed', width: 1.3 },
          endLabel: { show: true, formatter: 'LCL', color: theme.down, fontSize: 9 } },
        { type: 'line', data: d.values.map(function () { return d.mean; }), showSymbol: false, silent: true, lineStyle: { color: rgba(theme.text, 0.45), width: 1.2 },
          endLabel: { show: true, formatter: 'CL', color: theme.muted, fontSize: 9 } },
        { type: 'scatter', data: d.values.map(function (v, i) { return (v > d.ucl || v < d.lcl) ? [i, v] : null; }).filter(Boolean),
          symbolSize: 8, itemStyle: { color: theme.down }, z: 4 }
      ]
    });
  };
  B.parallel = function (el, d, theme) {
    var dims = d.dims || [];
    var schema = dims.map(function (n) { return { name: n, min: 0, max: 100 }; });
    return Object.assign(base(theme), {
      tooltip: { trigger: 'item', backgroundColor: theme.panel, borderColor: rgba(theme.accent, .4), textStyle: { color: theme.text, fontSize: 11 } },
      legend: legend(theme),
      parallelAxis: dims.map(function (n) { return { dim: dims.indexOf(n), name: n, nameTextStyle: { color: theme.muted, fontSize: 10 },
        axisLine: { lineStyle: { color: rgba(theme.text, 0.25) } }, axisLabel: { color: theme.muted, fontSize: 9 }, axisTick: { show: false } }; }),
      parallel: { left: 50, right: 40, top: 40, bottom: 24, parallelAxisDefault: {} },
      series: (d.rows || []).map(function (r, i) {
        return { name: r.name, type: 'parallel', data: [r.values], lineStyle: { width: 2, color: color(theme, i), opacity: 0.85 }, smooth: true };
      })
    });
  };
  B.streamgraph = function (el, d, theme) {
    var data = [];
    d.topics.forEach(function (t) {
      t.values.forEach(function (v, i) { data.push([d.labels[i], v, t.name]); });
    });
    return Object.assign(base(theme), {
      tooltip: Object.assign(tip(theme), { trigger: 'axis' }),
      legend: legend(theme),
      singleAxis: { type: 'category', data: d.labels, bottom: 26, top: 40, left: 30, right: 30,
        axisLabel: { color: theme.muted, fontSize: 9, interval: 4 }, axisLine: { lineStyle: { color: rgba(theme.text, 0.2) } }, axisTick: { show: false } },
      series: [{
        type: 'themeRiver', data: data, emphasis: { focus: 'series' },
        label: { show: false },
        itemStyle: { opacity: 0.85 },
        color: theme.series
      }]
    });
  };

  /* 分级统计图（世界地图着色） */
  B.choropleth = function (el, d, theme) {
    var vals = [
      { name: 'China', value: 5.2 }, { name: 'United States', value: 2.8 }, { name: 'Germany', value: 1.6 },
      { name: 'Japan', value: 1.2 }, { name: 'India', value: 6.8 }, { name: 'Brazil', value: 2.9 },
      { name: 'United Kingdom', value: 1.4 }, { name: 'France', value: 1.1 }, { name: 'Canada', value: 2.0 },
      { name: 'Australia', value: 2.4 }, { name: 'Russia', value: 1.3 }, { name: 'Indonesia', value: 5.0 },
      { name: 'Mexico', value: 2.6 }, { name: 'Saudi Arabia', value: 3.9 }, { name: 'South Africa', value: 0.9 },
      { name: 'Nigeria', value: 3.1 }, { name: 'Egypt', value: 4.2 }, { name: 'Argentina', value: -1.2 },
      { name: 'South Korea', value: 2.2 }, { name: 'Italy', value: 0.8 }
    ];
    return Object.assign(base(theme), {
      tooltip: { trigger: 'item', formatter: function (p) { return p.name + '：' + (p.value !== undefined && !isNaN(p.value) ? p.value + '%' : '无数据'); },
        backgroundColor: theme.panel, borderColor: rgba(theme.accent, .4), textStyle: { color: theme.text, fontSize: 11 } },
      visualMap: { min: -2, max: 7, calculable: false, orient: 'vertical', right: 10, top: 'middle',
        itemWidth: 10, itemHeight: 110, textStyle: { color: theme.muted, fontSize: 10 },
        inRange: { color: ['#8FA8C8', '#EDE9DF', '#C9A96A', '#A8763E'] } },
      series: [{
        type: 'map', map: 'world', roam: true, zoom: 1.2, nameProperty: 'name',
        itemStyle: { areaColor: rgba(theme.text, 0.06), borderColor: rgba(theme.text, 0.2), borderWidth: 0.6 },
        emphasis: { itemStyle: { areaColor: rgba(theme.accent, 0.35) }, label: { show: true, color: theme.text, fontSize: 10 } },
        label: { show: false }, data: vals
      }]
    });
  };

  global.ADV_BUILDERS = B;
})(window);
