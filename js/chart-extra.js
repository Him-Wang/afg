/* ADV 图表构建器 v2 —— 顶级咨询 / 金融机构 / 学术期刊风格
   设计原则：最大化数据墨水比、去掉无意义网格与边框、直接标注、
   克制的低饱和配色、精确的留白与字号层级。 */
(function (global) {
  'use strict';

  var B = {};

  /* ================= 设计系统 ================= */
  var FONT = '"Inter","Helvetica Neue","PingFang SC","Hiragino Sans GB",sans-serif';

  function rgba(hex, a) {
    if (!hex) return 'rgba(26,26,46,' + a + ')';
    var h = hex.charAt(0) === '#' ? hex.slice(1) : hex;
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    if (h.length !== 6) return 'rgba(26,26,46,' + a + ')';
    return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')';
  }
  function ink(t) { return (t && t.text) || '#1A1A2E'; }
  function muted(t) { return (t && t.muted) || '#8A8A99'; }
  function accent(t) { return (t && t.accent) || '#A67C3D'; }
  function rule(t) { return rgba(ink(t), 0.07); }
  function seriesColor(t, i) {
    var arr = (t && t.series && t.series.length) ? t.series : ['#1A1A2E', '#A67C3D', '#6F8FA8', '#7A5C3E', '#8A8A99', '#3E5A4E'];
    return arr[i % arr.length];
  }
  function num(v) {
    if (v === null || v === undefined || (typeof v === 'number' && isNaN(v))) return '—';
    var n = Number(v);
    if (!isFinite(n)) return String(v);
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (Math.abs(n) >= 1e4) return (n / 1e3).toFixed(1) + 'k';
    if (Math.abs(n) >= 1000) return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
    return String(Math.round(n * 100) / 100);
  }

  /* 统一的坐标轴：无轴线、极浅横向网格、灰字 */
  function xAxis(t, extra) {
    return Object.assign({
      type: 'category', axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: muted(t), fontSize: 9.5, fontFamily: FONT, margin: 10, interval: 0, hideOverlap: true, overflow: 'break', width: 74, lineHeight: 11 },
      splitLine: { show: false }
    }, extra || {});
  }
  function yAxis(t, extra) {
    return Object.assign({
      type: 'value', axisLine: { show: false }, axisTick: { show: false },
      axisLabel: { color: muted(t), fontSize: 9.5, fontFamily: FONT, margin: 8 },
      splitNumber: 4,
      splitLine: { show: true, lineStyle: { color: rule(t), width: 1 } }
    }, extra || {});
  }
  function grid(extra) {
    return Object.assign({ left: 6, right: 18, top: 26, bottom: 6, containLabel: true }, extra || {});
  }
  function tipBox(t) {
    return {
      backgroundColor: '#FFFFFF', borderColor: rgba(ink(t), 0.12), borderWidth: 1,
      padding: [8, 11], extraCssText: 'box-shadow:0 8px 24px rgba(20,20,35,.12);border-radius:8px;',
      textStyle: { color: ink(t), fontSize: 11.5, fontFamily: FONT }
    };
  }
  function tip(t, extra) { return Object.assign({ confine: true, backgroundColor: '#FFFFFF', borderColor: rgba(ink(t), 0.12), borderWidth: 1, textStyle: { color: ink(t), fontSize: 11.5, fontFamily: FONT }, extraCssText: 'box-shadow:0 8px 24px rgba(20,20,35,.12);border-radius:8px;' }, extra || {}); }
  function legend(t, extra) {
    return Object.assign({
      top: 0, left: 0, itemWidth: 8, itemHeight: 8, itemGap: 14,
      icon: 'circle', textStyle: { color: muted(t), fontSize: 10.5, fontFamily: FONT }
    }, extra || {});
  }
  function base(t, extra) {
    return Object.assign({ backgroundColor: 'transparent', textStyle: { fontFamily: FONT }, animationDuration: 560, animationEasing: 'cubicOut' }, extra || {});
  }
  /* 末点标注：小圆点 + 数值 */
  function endLabel(t, fmt) {
    return {
      show: true, position: 'right', distance: 6,
      formatter: function (p) { return fmt ? fmt(p.value) : num(p.value); },
      color: ink(t), fontSize: 11, fontWeight: 600, fontFamily: FONT
    };
  }


  /* 取当前色板的明度梯度 */
  function rampOf(t) {
    if (t && t.paletteRamp && t.paletteRamp.length) return t.paletteRamp;
    var pid = (t && t.paletteId) || 'consult';
    var p = (window.ADV_PALETTES || []).filter(function (x) { return x.id === pid; })[0];
    return (p && p.ramp) ? p.ramp : [(t.text || '#051C2C'), '#1B4B72', '#4A7FA8', '#A8C4D8', '#E4EBF1'];
  }
  function upOf(t) {
    if (t && t.up && t._dark) return t.up;
    var pid = (t && t.paletteId) || 'consult';
    var p = (window.ADV_PALETTES || []).filter(function (x) { return x.id === pid; })[0];
    return (p && p.up) || '#1E7A46';
  }
  function downOf(t) {
    if (t && t.down && t._dark) return t.down;
    var pid = (t && t.paletteId) || 'consult';
    var p = (window.ADV_PALETTES || []).filter(function (x) { return x.id === pid; })[0];
    return (p && p.down) || '#B5484B';
  }
  function accentOf(t) {
    if (t && t._dark && t.accent) return t.accent;
    var pid = (t && t.paletteId) || 'consult';
    var p = (window.ADV_PALETTES || []).filter(function (x) { return x.id === pid; })[0];
    return (p && p.accent) ? p.accent : (t.accent || '#B08A4F');
  }
  function vGrad(c1, c2) {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: c1 }, { offset: 1, color: c2 }]);
  }


  /* 机构级标注：均值参考线 */
  function meanMark(t, values, label) {
    var vs = (values || []).filter(function (v) { return v !== null && v !== undefined && !isNaN(v); });
    if (!vs.length) return null;
    var m = vs.reduce(function (a, b) { return a + b; }, 0) / vs.length;
    return {
      silent: true, symbol: 'none',
      data: [{
        yAxis: Math.round(m * 100) / 100,
        lineStyle: { color: rgba(accentOf(t), 0.85), width: 1.1, type: 'dashed' },
        label: { show: true, position: 'insideStartTop', distance: 3, color: accentOf(t),
          font: '700 8.5px ' + FONT, formatter: (label || 'avg') + ' ' + Math.round(m) }
      }]
    };
  }
  /* 机构级标注：最高/最低点数值 */
  function extremeMarks(t, labels, values, opts) {
    opts = opts || {};
    var out = [];
    var vs = [];
    (values || []).forEach(function (v, i) { if (v !== null && v !== undefined && !isNaN(v)) vs.push({ v: v, i: i }); });
    if (vs.length < 4) return out;
    var hi = vs.reduce(function (a, b) { return b.v > a.v ? b : a; });
    var lo = vs.reduce(function (a, b) { return b.v < a.v ? b : a; });
    if (opts.max !== false) out.push({ coord: [hi.i, hi.v], symbol: 'circle', symbolSize: 4.5,
      itemStyle: { color: downOf(t) },
      label: { show: true, position: 'top', distance: 6, color: downOf(t),
        font: '800 11.5px ' + FONT, textBorderColor: (t && t._dark) ? '#0E0F12' : '#fff', textBorderWidth: 3,
        formatter: function () { return num(hi.v); } } });
    if (opts.min !== false) out.push({ coord: [lo.i, lo.v], symbol: 'circle', symbolSize: 4.5,
      itemStyle: { color: upOf(t) },
      label: { show: true, position: 'bottom', distance: 6, color: upOf(t),
        font: '800 11.5px ' + FONT, textBorderColor: (t && t._dark) ? '#0E0F12' : '#fff', textBorderWidth: 3,
        formatter: function () { return num(lo.v); } } });
    return out;
  }

  /* ================= 1. 比较与排序 ================= */
  B.groupedBar = function (el, d, t) {
    var n = d.series.length;
    var W = (el && el.clientWidth) || 600;
    var ramp = rampOf(t);
    var acc = accentOf(t);
    var labels = d.labels;
    var last = d.series[n - 1].values;
    var bench = last.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, last.length);
    var maxV = 0;
    d.series.forEach(function (s) { s.values.forEach(function (v) { if (v > maxV) maxV = v; }); });
    return base(t, {
      tooltip: tip(t, { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: rgba(ink(t), 0.045) } } }),
      legend: legend(t, { data: d.series.map(function (s) { return s.name; }), itemGap: W < 480 ? 8 : 14 }),
      grid: grid({ left: 6, right: 16, top: 34, bottom: 16 }),
      xAxis: xAxis(t, { data: labels, axisLabel: { color: muted(t), fontSize: W < 480 ? 8 : 9.5, fontFamily: FONT, interval: 0, margin: 10 } }),
      yAxis: yAxis(t, { name: d.unit || '', nameTextStyle: { color: muted(t), fontSize: 9, align: 'left' } }),
      series: d.series.map(function (s, i) {
        var isLast = (i === n - 1);
        var multi = !!(window.ADV_PALETTES || []).filter(function (x) { return x.id === ((t && t.paletteId) || 'consult'); })[0];
        multi = !!(multi && multi.multiHue);
        var c1, c2, flat = false;
        if (multi) {
          c1 = seriesColor(t, i); c2 = c1; flat = true;      // 多色系：柱状图纯色不渐变
        } else {
          c1 = ramp[Math.min(i, ramp.length - 1)];
          c2 = isLast ? acc : ramp[Math.min(i + 1, ramp.length - 1)];
        }
        return {
          name: s.name, type: 'bar', data: s.values,
          barGap: '14%', barWidth: n > 4 ? (W < 480 ? 3.5 : 7) : 11,
          itemStyle: { color: flat ? c1 : vGrad(c1, c2), borderRadius: [1.5, 1.5, 0, 0] },
          z: isLast ? 4 : 3,
          markLine: isLast ? {
            silent: true, symbol: 'none',
            data: [{
              yAxis: Math.round(bench * 10) / 10,
              lineStyle: { color: rgba(acc, 0.9), width: 1.2, type: 'dashed' },
              label: { show: true, position: 'insideStartTop', distance: 3, color: acc,
                font: '700 9px ' + FONT, formatter: 'avg ' + Math.round(bench) }
            }]
          } : undefined,
          label: { show: false }
        };
      })
    });
  };

  B.tornado = function (el, d, t) {
    var labels = d.labels.slice().reverse();
    return base(t, {
      tooltip: tip(t, { trigger: 'axis' }),
      legend: legend(t, { data: [d.leftName, d.rightName] }),
      grid: grid({ left: 6, right: 6, top: 34, bottom: 18 }),
      xAxis: yAxis(t, { type: 'value', axisLabel: { color: muted(t), fontSize: 10, fontFamily: FONT, margin: 8, formatter: function (v) { return Math.abs(v); } } }),
      yAxis: xAxis(t, { data: labels, axisLabel: { color: ink(t), fontSize: 11, fontFamily: FONT, margin: 10 } }),
      series: [
        { name: d.leftName, type: 'bar', stack: 't', barWidth: 11,
          data: d.left.slice().reverse().map(function (v) { return -v; }),
          itemStyle: { color: seriesColor(t, 0) },
          label: { show: true, position: 'left', distance: 6, color: muted(t), fontSize: 10, fontFamily: FONT, formatter: function (p) { return num(Math.abs(p.value)); } } },
        { name: d.rightName, type: 'bar', stack: 't', barWidth: 11,
          data: d.right.slice().reverse(), itemStyle: { color: seriesColor(t, 1) },
          label: { show: true, position: 'right', distance: 6, color: muted(t), fontSize: 10, fontFamily: FONT, formatter: function (p) { return num(p.value); } } }
      ]
    });
  };

  B.lollipop = function (el, d, t) {
    var idx = d.labels.map(function (_, i) { return i; });
    return base(t, {
      tooltip: tip(t, { trigger: 'item' }),
      grid: grid({ left: 6, right: ((el && el.clientWidth) || 600) < 480 ? 30 : 44, top: 16, bottom: 18 }),
      xAxis: yAxis(t, { type: 'value', splitLine: { show: true, lineStyle: { color: rule(t) } } }),
      yAxis: xAxis(t, { data: d.labels, axisLabel: { color: ink(t), fontSize: 11, fontFamily: FONT } }),
      series: [
        { type: 'bar', data: d.values.map(function (v, i) { return [i, v]; }), barWidth: 1.5,
          itemStyle: { color: rgba(ink(t), 0.18) }, silent: true, z: 1 },
        { type: 'scatter', data: idx.map(function (i) { return [d.values[i], i]; }), symbolSize: 9,
          itemStyle: { color: accent(t) }, z: 3,
          label: { show: true, position: 'right', distance: 8, color: ink(t), fontSize: 11, fontWeight: 600, fontFamily: FONT, formatter: function (p) { return num(p.value[0]); } } }
      ]
    });
  };

  B.bullet = function (el, d, t) {
    var W = (el && el.clientWidth) || 600;
    var rows = d.rows || [];
    var names = rows.map(function (r) { return r.name; });
    var maxV = 0;
    rows.forEach(function (r) { maxV = Math.max(maxV, r.target || 0, r.value || 0); });
    var labelW = W < 480 ? 54 : 76;
    var cats = names.slice().reverse();           // y 轴自下而上
    var rv = rows.slice().reverse();
    return base(t, {
      tooltip: tip(t, { formatter: function (p) {
        var r = rv[p.dataIndex]; if (!r) return '';
        return r.name + '<br/>实际 ' + num(r.value) + ' · 目标 ' + num(r.target) + '<br/>区间 ' + (r.ranges || []).join(' / ');
      } }),
      grid: { left: labelW, right: W < 480 ? 34 : 46, top: 20, bottom: 22 },
      xAxis: yAxis(t, { type: 'value', min: 0, max: Math.ceil(maxV * 1.12), splitLine: { show: true, lineStyle: { color: rule(t) } } }),
      yAxis: xAxis(t, { data: cats, axisLabel: { color: ink(t), fontSize: W < 480 ? 9.5 : 10.5, fontFamily: FONT, width: labelW - 12, overflow: 'truncate' } }),
      series: [
        { type: 'bar', barWidth: W < 480 ? 10 : 13, barCategoryGap: '58%', data: rv.map(function (r) { return r.value; }),
          itemStyle: { color: seriesColor(t, 0), borderRadius: [0, 2, 2, 0] }, z: 3,
          label: { show: true, position: 'insideLeft', distance: 7, color: '#FFFFFF', fontSize: W < 480 ? 8.5 : 9.5, fontWeight: 700, fontFamily: FONT,
            formatter: function (p) { return num(p.value); } } },
        { type: 'scatter', silent: true, z: 5,
          data: rv.map(function (r) { return [r.target, rv.indexOf(r)]; }),
          symbol: 'rect', symbolSize: [3, W < 480 ? 14 : 18], itemStyle: { color: ink(t) } }
      ]
    });
  };

  /* 哑铃图：两期对比 + 变化幅度（替代棒棒糖） */
  B.dumbbell = function (el, d, t) {
    var W = (el && el.clientWidth) || 600;
    var narrow = W < 480;
    var up = '#1E7A46', down = '#B5484B';
    var rows = d.rows.slice().sort(function (a, b) { return (b.to - b.from) - (a.to - a.from); });
    var names = rows.map(function (r) { return r.name; });
    var allV = [];
    rows.forEach(function (r) { allV.push(r.from, r.to); });
    var lo = Math.min.apply(null, allV), hi = Math.max.apply(null, allV);
    var pad = (hi - lo) * 0.14 || 1;
    var series = [
      { type: 'custom', silent: true, z: 2,
        renderItem: function (params, api) {
          var i = params.dataIndex, r = rows[i];
          var p1 = api.coord([r.from, i]), p2 = api.coord([r.to, i]);
          var col = r.to >= r.from ? up : down;
          return { type: 'line', shape: { x1: p1[0], y1: p1[1], x2: p2[0], y2: p2[1] },
            style: { stroke: rgba(col, 0.32), lineWidth: narrow ? 2 : 3, lineCap: 'round' } };
        },
        data: rows.map(function (r, i) { return { value: [i, r.from, r.to] }; }) },
      { type: 'scatter', symbolSize: narrow ? 6 : 8, z: 3,
        itemStyle: { color: '#FFFFFF', borderColor: rgba(ink(t), 0.35), borderWidth: 1.4 },
        data: rows.map(function (r, i) { return { value: [r.from, i], name: r.name }; }),
        tooltip: { formatter: function (p) { var r = rows[p.dataIndex]; return r.name + '<br/>' + d.fromLabel + '：' + num(r.from); } } },
      { type: 'scatter', symbolSize: narrow ? 7 : 9, z: 4,
        itemStyle: { color: function (p) { var r = rows[p.dataIndex]; return r.to >= r.from ? up : down; } },
        data: rows.map(function (r, i) { return { value: [r.to, i], name: r.name }; }),
        tooltip: { formatter: function (p) { var r = rows[p.dataIndex]; return r.name + '<br/>' + d.toLabel + '：' + num(r.to); } } },
      { type: 'scatter', symbolSize: 0.1, silent: true, z: 5,
        data: rows.map(function (r, i) {
          var dv = r.to - r.from;
          return {
            value: [hi + pad * 1.15, i],
            label: {
              show: true, position: 'right', distance: 4, align: 'left',
              color: dv >= 0 ? up : down,
              font: '700 ' + (narrow ? 9 : 10.5) + 'px ' + FONT,
              formatter: (dv >= 0 ? '+' : '') + (Math.round(dv * 10) / 10)
            }
          };
        }) }
    ];
    return base(t, {
      tooltip: tip(t, { trigger: 'item' }),
      grid: { left: narrow ? 54 : 72, right: narrow ? 52 : 64, top: 30, bottom: 18 },
      xAxis: yAxis(t, { type: 'value', min: lo - pad * 0.6, max: hi + pad * 2.3,
        splitLine: { show: true, lineStyle: { color: rule(t) } },
        axisLabel: { color: muted(t), fontSize: 9.5, fontFamily: FONT, showMinLabel: false, showMaxLabel: false } }),
      yAxis: xAxis(t, { data: names, axisLabel: { color: ink(t), fontSize: narrow ? 9 : 10.5, fontFamily: FONT, width: narrow ? 50 : 68, overflow: 'truncate' } }),
      series: series,
      graphic: [
        { type: 'text', left: narrow ? 56 : 74, top: 6, style: { text: '● ' + d.toLabel, fill: ink(t), font: '700 9.5px ' + FONT } },
        { type: 'text', left: narrow ? 100 : 132, top: 6, style: { text: '○ ' + d.fromLabel, fill: muted(t), font: '600 9.5px ' + FONT } }
      ]
    });
  };

  B.radar = function (el, d, t) {
    var W = (el && el.clientWidth) || 600, H = (el && el.clientHeight) || 300;
    var narrow = W < 480;
    var n = d.indicators.length;
    var vals = d.series[d.series.length - 1].values;
    var prev = d.series.length > 1 ? d.series[d.series.length - 2].values : null;
    var maxI = -1, maxD = 0;
    if (prev) {
      for (var i = 0; i < n; i++) {
        var dv = Math.abs(vals[i] - prev[i]);
        if (dv > maxD) { maxD = dv; maxI = i; }
      }
    }
    var badge = null;
    if (maxI >= 0 && maxD > 0) {
      var dvv = vals[maxI] - prev[maxI];
      badge = '波动最大 · ' + d.indicators[maxI].name + '  ' + (dvv >= 0 ? '+' : '') + dvv.toFixed(1);
    }
    return base(t, {
      tooltip: tip(t, { trigger: 'item' }),
      legend: legend(t, { data: d.series.map(function (s) { return s.name; }) }),
      title: badge ? {
        text: badge, left: 12, bottom: 8, z: 30,
        textStyle: { color: '#B5484B', fontSize: narrow ? 9 : 11, fontWeight: 700, fontFamily: FONT,
          backgroundColor: 'rgba(181,72,75,0.08)', padding: [4, 8], borderRadius: 4 }
      } : undefined,
      radar: {
        center: ['50%', '52%'], radius: narrow ? '54%' : '68%',
        indicator: d.indicators.map(function (x, i) {
          var vs = d.series.map(function (ser) { return ser.values[i]; }).filter(function (v) { return isFinite(v); });
          if (!vs.length) return { name: x.name, min: 0, max: 100 };
          var mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs);
          var sp = (mx - mn) || Math.abs(mx) * 0.1 || 1;
          return { name: x.name, min: Math.floor((mn - sp * 0.6) * 10) / 10, max: Math.ceil((mx + sp * 0.6) * 10) / 10 };
        }),
        axisName: { color: muted(t), fontSize: narrow ? 8 : 9.5, fontFamily: FONT },
        axisLine: { lineStyle: { color: rule(t) } },
        splitLine: { lineStyle: { color: rule(t) } },
        splitArea: { show: false }
      },
      series: [{
        type: 'radar', symbolSize: 3,
        emphasis: { focus: 'series', lineStyle: { width: 3.2 }, areaStyle: { opacity: 0.22 } },
        blur: { lineStyle: { opacity: 0.12 }, areaStyle: { opacity: 0.02 }, itemStyle: { opacity: 0.15 }, label: { opacity: 0.1 } },
        data: d.series.map(function (s, si) {
          var isLast = si === d.series.length - 1;
          var c = seriesColor(t, si);
          return {
            name: s.name, value: s.values,
            lineStyle: { color: c, width: isLast ? 2.2 : 1.2, type: isLast ? 'solid' : 'dashed', opacity: isLast ? 1 : 0.65 },
            itemStyle: { color: c, opacity: isLast ? 1 : 0.5 },
            areaStyle: { color: rgba(c, isLast ? 0.13 : 0.04) },
            symbolSize: isLast ? 4 : 2
          };
        })
      }]
    });
  };

  /* ================= 2. 趋势与时间 ================= */
  function timeAxis(t, labels) {
    return xAxis(t, {
      data: labels, boundaryGap: false,
      axisLabel: { color: muted(t), fontSize: 9.5, fontFamily: FONT, margin: 10,
        hideOverlap: true,
        interval: function (idx, val) {
          var s = String(val);
          if (idx === 0) return false;
          var m = s.match(/^(\d{4})-(\d{2})$/);
          if (m) return m[2] === '01';
          return idx % Math.ceil(labels.length / 6) === 0;
        },
        formatter: function (v) {
          var s = String(v);
          var m = s.match(/^(\d{4})-(\d{2})$/);
          return m ? (m[2] === '01' ? m[1] : '') : s;
        } }
    });
  }

  function lineSeries(t, s, i, opts) {
    return Object.assign({
      name: s.name, type: 'line', data: s.values, showSymbol: false, smooth: false,
      lineStyle: { color: seriesColor(t, i), width: 1.8 }, itemStyle: { color: seriesColor(t, i) },
      emphasis: { focus: 'series', lineStyle: { width: 2.6 } }
    }, opts || {});
  }

  B.line = function (el, d, t) {
    var zero = d.values && d.values.some(function (v) { return v < 0; });
    var W = (el && el.clientWidth) || 700;
    var big = !(W < 480);   // 大图才做精细标注
    return base(t, {
      tooltip: tip(t, { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: rgba(ink(t), 0.2), width: 1 } } }),
      legend: legend(t, { data: d.series.map(function (s) { return s.name; }) }),
      grid: grid({ left: 8, right: W < 480 ? 40 : 64, top: 30, bottom: 10 }),
      xAxis: timeAxis(t, d.labels),
      yAxis: yAxis(t, { scale: !zero }),
      series: d.series.map(function (s, i) {
        var last = s.values.length - 1;
        var marks = [];
        if (i === 0) {
          var vs = s.values.map(function (v, k) { return { v: v, k: k }; }).filter(function (o) { return o.v !== null && o.v !== undefined && !isNaN(o.v); });
          if (vs.length > 4) {
            var mean = vs.reduce(function (a, b) { return a + b.v; }, 0) / vs.length;
            marks.push({ kind: 'mean', name: '均值', coord: [0, mean],
              symbol: 'none',
              lineStyle: { color: rgba(ink(t), 0.35), width: 1, type: 'dashed' },
              label: { show: big, position: 'insideStartTop', distance: 4, color: muted(t), font: '9px ' + FONT,
                formatter: function () { return 'avg ' + num(mean); } } });
          }
        }
        var axisHint = (s.yAxis !== undefined) ? { yAxisIndex: s.yAxis } : {};
        return lineSeries(t, s, i, Object.assign({}, axisHint, {
          markPoint: { silent: true, symbol: 'circle', symbolSize: 5,
            data: [{ coord: [last, s.values[last]], itemStyle: { color: seriesColor(t, i) } }].concat(
              marks.filter(function (m) { return m.kind !== 'mean'; }).map(function (m) {
                return { name: m.name, coord: m.coord, symbol: m.symbol, symbolSize: m.symbolSize, itemStyle: m.itemStyle, label: m.label };
              })) },
          markLine: marks.filter(function (m) { return m.kind === 'mean'; }).length
            ? { silent: true, symbol: 'none', data: marks.filter(function (m) { return m.kind === 'mean'; }).map(function (m) {
                return { name: m.name, yAxis: m.coord[1], lineStyle: m.lineStyle, label: m.label };
              }) }
            : undefined,
          endLabel: { show: false }
        }));
      })
    });
  };

  B.area = function (el, d, t) {
    var W = (el && el.clientWidth) || 700;
    return base(t, {
      tooltip: tip(t, { trigger: 'axis' }),
      legend: legend(t, { data: d.series.map(function (s) { return s.name; }) }),
      grid: grid({ left: 8, right: W < 480 ? 42 : 64, top: 28, bottom: 10 }),
      xAxis: timeAxis(t, d.labels),
      yAxis: yAxis(t, { scale: true }),
      series: d.series.map(function (s, i) {
        var c = seriesColor(t, i);
        return lineSeries(t, s, i, {
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: rgba(c, 0.28) }, { offset: 1, color: rgba(c, 0.02) }]) },
          markPoint: { silent: true, symbol: 'circle', symbolSize: 5,
            data: [{ coord: [s.values.length - 1, s.values[s.values.length - 1]], itemStyle: { color: c },
              label: { show: false } }] },
          markLine: i === 0 ? meanMark(t, s.values) : undefined,
          endLabel: { show: false }
        });
      })
    });
  };

  B.stacked = function (el, d, t) {
    return base(t, {
      tooltip: tip(t, { trigger: 'axis' }),
      legend: legend(t, { data: d.series.map(function (s) { return s.name; }) }),
      grid: grid({ left: 6, right: 20, top: 34, bottom: 12 }),
      xAxis: timeAxis(t, d.labels),
      yAxis: yAxis(t),
      series: d.series.map(function (s, i) {
        var c = seriesColor(t, i);
        var totals = d.labels.map(function (_, k) { return d.series.reduce(function (a, ss) { return a + (ss.values[k] || 0); }, 0); });
        return lineSeries(t, s, i, {
          stack: 'st', areaStyle: { color: rgba(c, 0.55) }, lineStyle: { color: rgba(c, 0.9), width: 1 },
          emphasis: { focus: 'series' },
          markPoint: (i === d.series.length - 1) ? {
            silent: true, symbol: 'circle', symbolSize: 5, itemStyle: { color: ink(t) },
            data: [{ coord: [totals.length - 1, totals[totals.length - 1]], itemStyle: { color: ink(t) },
              label: { show: true, position: 'top', distance: 6, color: ink(t), font: '800 10px ' + FONT,
                textBorderColor: (t && t._dark) ? '#0E0F12' : '#fff', textBorderWidth: 3, formatter: 'total ' + num(totals[totals.length - 1]) } }]
          } : undefined
        });
      })
    });
  };

  B.waterfall = function (el, d, t) {
    var vals = d.values, labels = d.labels;
    var helper = [], bars = [];
    var running = 0;
    vals.forEach(function (v, i) {
      var isTotal = (i === 0 || i === vals.length - 1);
      if (isTotal) { helper.push(0); bars.push(v); running = v; }
      else if (v >= 0) { helper.push(running); bars.push(v); running += v; }
      else { helper.push(running + v); bars.push(-v); running += v; }
    });
    var up = '#3E7A5A', down = '#B5484B';
    return base(t, {
      tooltip: tip(t, { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: rgba(ink(t), 0.04) } },
        formatter: function (ps) {
          var i = ps[0].dataIndex, v = vals[i];
          return labels[i] + '<br/>' + (v >= 0 ? '+' : '') + num(v);
        } }),
      grid: grid({ left: 6, right: 14, top: 20, bottom: 10 }),
      xAxis: xAxis(t, { data: labels }),
      yAxis: yAxis(t),
      series: [
        { type: 'bar', stack: 'w', silent: true, itemStyle: { color: 'transparent' }, data: helper, barWidth: '46%' },
        { type: 'bar', stack: 'w', barWidth: '46%', data: bars,
          itemStyle: {
            borderRadius: 2,
            color: function (p) {
              var i = p.dataIndex, v = vals[i];
              if (i === 0 || i === vals.length - 1) return ink(t);
              return v >= 0 ? up : down;
            }
          },
          label: { show: true, position: 'top', distance: 5, color: ink(t), fontSize: 10, fontWeight: 600, fontFamily: FONT,
            formatter: function (p) { var v = vals[p.dataIndex]; return (v >= 0 ? '+' : '−') + num(Math.abs(v)); } },
          labelLayout: { hideOverlap: true } }
      ]
    });
  };

  B.heatmap = function (el, d, t) {
    var data = [];
    d.yLabels.forEach(function (y, yi) { d.xLabels.forEach(function (x, xi) { data.push([xi, yi, d.values[yi][xi]]); }); });
    var vals = data.map(function (p) { return p[2]; });
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) { return d.yLabels[p.value[1]] + ' · ' + d.xLabels[p.value[0]] + '<br/>' + num(p.value[2]); } }),
      grid: { left: 6, right: 16, top: 14, bottom: 18, containLabel: true },
      xAxis: xAxis(t, { data: d.xLabels, splitArea: { show: false } }),
      yAxis: xAxis(t, { data: d.yLabels, axisLabel: { color: ink(t), fontSize: 10.5, fontFamily: FONT } }),
      visualMap: {
        min: Math.min.apply(null, vals), max: Math.max.apply(null, vals), show: false,
        inRange: { color: [rgba(ink(t), 0.05), rgba(accent(t), 0.45), accent(t)] }
      },
      series: [{
        type: 'heatmap', data: data, itemStyle: { borderColor: '#FFFFFF', borderWidth: 2 },
        label: { show: true, color: ink(t), fontSize: 10, fontFamily: FONT, formatter: function (p) { return num(p.value[2]); } }
      }]
    });
  };

  /* ================= 3. 构成与占比 ================= */
  B.pie = function (el, d, t) {
    var data = d.data || [];
    var sum = data.reduce(function (a, b) { return a + b.value; }, 0) || 1;
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return p.name + '<br/>' + p.value + ' (' + (p.value / sum * 100).toFixed(1) + '%)'; } }),
      series: [{
        type: 'pie', radius: ['0%', '72%'], center: ['50%', '52%'],
        itemStyle: { borderColor: '#FFFFFF', borderWidth: 2 },
        label: { color: ink(t), fontSize: 10.5, fontFamily: FONT, lineHeight: 15,
          formatter: function (p) { return p.name + '\n' + (p.value / sum * 100).toFixed(1) + '%'; } },
        labelLine: { length: 8, length2: 10, lineStyle: { color: rgba(ink(t), 0.25) } },
        data: data.map(function (x, i) { return { name: x.name, value: x.value, itemStyle: { color: seriesColor(t, i) } }; })
      }]
    });
  };

  B.donut = function (el, d, t) {
    var data = (d.data || []).slice().sort(function (a, b) { return b.value - a.value; });
    var sum = data.reduce(function (a, b) { return a + b.value; }, 0) || 1;
    var rp = rampOf(t);
    var W = (el && el.clientWidth) || 600;
    var narrow = W < 420;
    return base(t, {
      tooltip: tip(t, { formatter: function (p) {
        return '<b>' + p.name + '</b><br/>' + num(p.value) + (d.unit || '') + ' · 占比 ' + (p.value / sum * 100).toFixed(1) + '%';
      } }),
      graphic: [
        { type: 'text', left: 'center', top: narrow ? '36%' : '38%', z: 10,
          style: { text: (data[0].value / sum * 100).toFixed(1) + '%', fill: ink(t), font: '800 ' + (narrow ? 17 : 23) + 'px ' + FONT, textAlign: 'center' } },
        { type: 'text', left: 'center', top: narrow ? '48%' : '51%', z: 10,
          style: { text: '最大 · ' + data[0].name, fill: muted(t), font: '10px ' + FONT, textAlign: 'center' } },
        { type: 'text', left: 'center', top: narrow ? '56%' : '59%', z: 10,
          style: { text: (d.centerLabel || '构成') + ' · ' + data.length + ' 项',
            fill: rgba(ink(t), 0.42), font: '9px ' + FONT, textAlign: 'center' } }
      ],
      series: [{
        type: 'pie', radius: narrow ? ['48%', '70%'] : ['52%', '78%'], center: ['50%', '50%'],
        itemStyle: { borderColor: '#FFFFFF', borderWidth: 2.5, borderRadius: 3 },
        label: { color: ink(t), fontFamily: FONT, lineHeight: 14,
          formatter: function (p) {
            return '{n|' + p.name + '}  {v|' + (p.value / sum * 100).toFixed(1) + '%}';
          },
          rich: { n: { fontSize: 10.5, color: ink(t), fontWeight: 700, fontFamily: FONT },
                  v: { fontSize: 9.5, color: muted(t), fontFamily: FONT } } },
        labelLine: { length: 8, length2: 12, lineStyle: { color: rgba(ink(t), 0.22) } },
        emphasis: { scale: true, scaleSize: 6, itemStyle: { shadowBlur: 12, shadowColor: 'rgba(5,28,44,.18)' } },
        data: data.map(function (x, i) {
          var c = rp[Math.min(i, rp.length - 1)] || seriesColor(t, i);
          return { name: x.name, value: x.value,
            itemStyle: { color: c, borderWidth: i === 0 ? 0 : 2 },
            label: { fontWeight: i === 0 ? 800 : 400 } };
        })
      }]
    });
  };

  B.stackedBar = function (el, d, t) {
    return base(t, {
      tooltip: tip(t, { trigger: 'axis', axisPointer: { type: 'shadow', shadowStyle: { color: rgba(ink(t), 0.04) } } }),
      legend: legend(t, { data: d.series.map(function (s) { return s.name; }) }),
      grid: grid({ top: 32 }),
      xAxis: xAxis(t, { data: d.labels }),
      yAxis: yAxis(t),
      series: d.series.map(function (s, i) {
        return { name: s.name, type: 'bar', stack: 'b', barWidth: 22,
          itemStyle: { color: seriesColor(t, i) },
          label: { show: i === d.series.length - 1, position: 'top', color: ink(t), fontSize: 10, fontWeight: 600, fontFamily: FONT,
            formatter: function (p) { var tot = 0; d.series.forEach(function (ss) { tot += ss.values[p.dataIndex]; }); return num(tot); } } };
      })
    });
  };

  B.percentBar = function (el, d, t) {
    var rp = rampOf(t);
    var totals = d.labels.map(function (_, i) { return d.series.reduce(function (a, se) { return a + se.values[i]; }, 0) || 1; });
    var lastIdx = d.labels.length - 1;
    function pct(arr, i) { return Math.round(arr[i] / totals[i] * 1000) / 10; }
    return base(t, {
      tooltip: tip(t, { trigger: 'axis', formatter: function (ps) {
        var i = ps[0].dataIndex;
        var lines = ps.map(function (p) { return p.marker + p.seriesName + ' ' + p.value + '%'; });
        return '<b>' + d.labels[i] + '</b>（合计 ' + num(totals[i]) + '）<br/>' + lines.join('<br/>');
      } }),
      legend: legend(t, { data: d.series.map(function (x) { return x.name; }) }),
      grid: grid({ top: 34, left: 8, right: 64, bottom: 6 }),
      xAxis: yAxis(t, { type: 'value', max: 100,
        axisLabel: { color: muted(t), fontSize: 9.5, fontFamily: FONT, formatter: '{value}%' } }),
      yAxis: xAxis(t, { data: d.labels,
        axisLabel: { color: ink(t), fontSize: 10.5, fontFamily: FONT, fontWeight: 600 } }),
      series: d.series.map(function (sr, i) {
        var c = rp[Math.min(i + 1, rp.length - 1)] || seriesColor(t, i);
        return { name: sr.name, type: 'bar', stack: 'p', barWidth: 20,
          itemStyle: { color: c, borderColor: '#fff', borderWidth: 1 },
          data: sr.values.map(function (v, j) {
            var p = pct(sr.values, j);
            return { value: p,
              label: { show: p >= 8, color: '#fff', fontSize: 9.5, fontFamily: FONT, fontWeight: 700,
                formatter: Math.round(p) + '%' } };
          }) };
      }).concat([{
        /* 右侧合计 + 首末期结构变化 */
        name: '__total', type: 'bar', stack: 'p', silent: true, barWidth: 20,
        data: totals.map(function (tt) { return 0; }),
        label: { show: true, position: 'right', distance: 8, color: muted(t), fontSize: 9.5, fontFamily: FONT,
          formatter: function (p) { return num(totals[p.dataIndex]); } }
      }])
    });
  };

  B.treemap = function (el, d, t) {
    var rp = rampOf(t);
    var TW = (el && el.clientWidth) || 500, TH = (el && el.clientHeight) || 240;
    var root = d.data || [];
    var total = 0;
    root.forEach(function (g) { (g.children || []).forEach(function (c) { total += c.value; }); });
    total = total || 1;
    var groups = root.map(function (g, gi) {
      var base = rp[Math.min(gi * 2, rp.length - 1)] || seriesColor(t, gi);
      return {
        name: g.name,
        itemStyle: { color: base, borderColor: '#fff', borderWidth: 2, gapWidth: 2 },
        upperLabel: { show: true, height: 17, color: muted(t), fontSize: 9.5, fontFamily: FONT, fontWeight: 700,
          formatter: function (p) { return p.name; } },
        children: (g.children || []).map(function (c, ci) {
          var share = c.value / total * 100;
          return {
            name: c.name, value: c.value,
            itemStyle: { color: rgba(base, 1 - ci * 0.16), borderColor: '#fff', borderWidth: 1.5 },
            label: { show: share >= 4, color: '#fff', fontFamily: FONT,
              formatter: '{a|' + c.name + '}\n{b|' + share.toFixed(1) + '%}',
              rich: { a: { fontSize: 9.5, fontWeight: 700, color: '#fff', fontFamily: FONT },
                      b: { fontSize: 8.5, color: 'rgba(255,255,255,.85)', fontFamily: FONT } } }
          };
        })
      };
    });
    return base(t, {
      tooltip: tip(t, { formatter: function (p) {
        return '<b>' + p.name + '</b><br/>' + num(p.value) + ' · 占比 ' + (p.value / total * 100).toFixed(1) + '%';
      } }),
      series: [{
        type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false },
        left: 12, right: 12, top: 24, bottom: 12,
        levels: [
          { itemStyle: { borderWidth: 0, gapWidth: 4, borderColor: '#fff' },
            upperLabel: { show: true, height: 17, color: muted(t), fontSize: 9.5, fontFamily: FONT, fontWeight: 700 } },
          { itemStyle: { borderWidth: 1.5, gapWidth: 1.5 }, colorSaturation: [0.3, 0.42] }
        ],
        upperLabel: { show: true, height: 16, color: muted(t), fontFamily: FONT, fontSize: 9.5, fontWeight: 700 },
        label: { show: true },
        emphasis: { itemStyle: { shadowBlur: 14, shadowColor: 'rgba(5,28,44,.22)' } },
        data: groups
      }]
    });
  };

  B.sunburst = function (el, d, t) {
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return p.name + ' · ' + num(p.value); } }),
      series: [{
        type: 'sunburst', data: d.data, radius: ['18%', '88%'], center: ['50%', '52%'],
        itemStyle: { borderColor: '#FFFFFF', borderWidth: 2 },
        label: { color: ink(t), fontSize: 10, fontFamily: FONT, rotate: 0, minAngle: 6 },
        levels: [{}, { r0: '18%', r: '52%', label: { rotate: 0 } }, { r0: '52%', r: '88%', label: { rotate: 'tangential' } }],
        color: (t.series || ['#1A1A2E', '#A67C3D', '#6F8FA8', '#7A5C3E', '#8A8A99'])
      }]
    });
  };

  /* ================= 4. 分布 ================= */
  function bins(values, n) {
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var step = (max - min) / n || 1;
    var edges = [], counts = [];
    for (var i = 0; i <= n; i++) edges.push(Math.round((min + step * i) * 10) / 10);
    for (var j = 0; j < n; j++) counts.push(0);
    values.forEach(function (v) { var k = Math.min(n - 1, Math.floor((v - min) / step)); counts[k]++; });
    return { edges: edges, counts: counts, step: step, min: min, max: max };
  }
  function std(v) { var m = v.reduce(function (a, b) { return a + b; }, 0) / v.length; return Math.sqrt(v.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / v.length); }
  function kdePts(values, min, max, n) {
    var h = 1.06 * std(values) * Math.pow(values.length, -0.2) || 1;
    var out = [];
    for (var i = 0; i < n; i++) {
      var x = min + (max - min) * i / (n - 1), s = 0;
      for (var k = 0; k < values.length; k++) s += Math.exp(-0.5 * Math.pow((x - values[k]) / h, 2));
      out.push([x, s / (values.length * h * Math.sqrt(2 * Math.PI))]);
    }
    return out;
  }

  B.histogram = function (el, d, t) {
    var W = (el && el.clientWidth) || 600, H = (el && el.clientHeight) || 240;
    var nb0 = Math.max(12, Math.min(26, Math.round(W / 34)));
    var h = bins(d.values, W < 460 ? 10 : nb0);
    var labels = h.edges.slice(0, -1).map(function (e, i) { return Math.round(e) + '–' + Math.round(h.edges[i + 1]); });
    var dens = kdePts(d.values, h.min, h.max, 90);
    var maxC = Math.max.apply(null, h.counts) || 1;
    var peakD = Math.max.apply(null, dens.map(function (p) { return p[1]; })) || 1;
    var nb = labels.length;
    var curve = dens.map(function (p) {
      var idx = (p[0] - h.min) / (h.max - h.min) * nb - 0.5;
      idx = Math.max(0, Math.min(nb - 1, idx));
      return [idx, p[1] / peakD * maxC * 1.02];
    });
    var vs = d.values.filter(function (v) { return v !== null && !isNaN(v); }).sort(function (a, b) { return a - b; });
    var mean = vs.reduce(function (a, b) { return a + b; }, 0) / (vs.length || 1);
    var q = function (p) { var k = (vs.length - 1) * p; var f = Math.floor(k); var c = Math.ceil(k); return vs[f] + (vs[c] - vs[f]) * (k - f); };
    var med = q(0.5), p10 = q(0.1), p90 = q(0.9);
    var toX = function (x) { return (x - h.min) / (h.max - h.min) * nb - 0.5; };
    var modeI = h.counts.indexOf(maxC);
    return base(t, {
      tooltip: tip(t, { trigger: 'axis' }),
      grid: grid({ left: 8, right: 18, top: 34, bottom: 16 }),
      xAxis: xAxis(t, { data: labels, axisLabel: { color: muted(t), fontSize: 8.5, fontFamily: FONT, interval: Math.max(1, Math.floor(nb / 5)), margin: 8 } }),
      yAxis: yAxis(t, { max: Math.ceil(maxC * 1.08), axisLabel: { show: false }, splitLine: { show: false } }),
      graphic: [{ type: 'text', left: 10, top: 6, z: 10,
        style: { text: 'P10 ' + Math.round(p10) + '　Median ' + Math.round(med) + '　P90 ' + Math.round(p90) + '　σ ' + Math.round(ML.std(vs)),
          fill: muted(t), font: '9.5px ' + FONT } }],
      series: [
        { type: 'bar', data: h.counts, barWidth: '86%', silent: true,
          itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: rgba(seriesColor(t, 0), 0.72) },
            { offset: 1, color: rgba(seriesColor(t, 0), 0.18) }]),
            borderRadius: [2, 2, 0, 0] },
          markArea: { silent: true, itemStyle: { color: rgba(accentOf(t), 0.07) },
            data: [[{ xAxis: Math.round(toX(p10)) }, { xAxis: Math.round(toX(p90)) }]] } },
        { type: 'line', data: curve, showSymbol: false, smooth: 0.35, silent: true,
          lineStyle: { color: ink(t), width: 1.8 }, z: 5 },
        { type: 'line', data: [], silent: true, z: 6,
          markLine: { silent: true, symbol: ['none', 'none'], data: [
            { xAxis: Math.max(0, Math.round(toX(mean))), lineStyle: { color: '#B5484B', width: 1.3, type: 'dashed' },
              label: { show: false } },
            { xAxis: Math.max(0, Math.round(toX(med))), lineStyle: { color: rgba(ink(t), 0.55), width: 1.1, type: 'dotted' },
              label: { show: false } }
          ] } },
        { type: 'scatter', data: [[modeI, maxC]], symbolSize: 0, silent: true, z: 7,
          label: { show: true, position: 'top', distance: 10, color: ink(t), font: '800 9.5px ' + FONT,
            formatter: '峰值 ' + maxC, backgroundColor: (t && t._dark) ? 'rgba(22,24,30,.92)' : 'rgba(255,255,255,.9)', padding: [1, 4], borderRadius: 3 } }
      ]
    });
  };

  /* 分布条带图：P10–P90 全距 + IQR 实心 + 中位刻度（custom 系列，随尺寸自适应） */
  B.boxplot = function (el, d, t) {
    var cats = d.categories || [];
    var boxes = d.boxes || [];          // [min, Q1, median, Q3, max]
    var all = [];
    boxes.forEach(function (b) { b.forEach(function (v) { if (isFinite(v)) all.push(v); }); });
    var vmin = Math.min.apply(null, all), vmax = Math.max.apply(null, all);
    var pad = (vmax - vmin) * 0.07 || 1;
    vmin -= pad; vmax += pad;
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) {
        var b = boxes[p.dataIndex] || [];
        return '<b>' + cats[p.dataIndex] + '</b><br/>最大 ' + num(b[4]) + ' · Q3 ' + num(b[3]) +
          '<br/><b>中位 ' + num(b[2]) + '</b><br/>Q1 ' + num(b[1]) + ' · 最小 ' + num(b[0]);
      } }),
      grid: { left: 96, right: 54, top: 24, bottom: 26 },
      xAxis: { type: 'value', min: vmin, max: vmax, axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: muted(t), fontSize: 9, fontFamily: FONT },
        splitLine: { lineStyle: { color: rule(t) } } },
      yAxis: { type: 'category', data: cats, inverse: true,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: ink(t), fontSize: 9.5, fontFamily: FONT, fontWeight: 700 } },
      series: [{
        type: 'custom',
        renderItem: function (params, api) {
          var i = params.dataIndex;
          var b = boxes[i];
          var y = api.coord([api.value(0, 0), i])[1];
          var h = api.size([0, 1])[1];
          var barH = Math.max(8, Math.min(26, h * 0.52));
          var c = seriesColor(t, i);
          var x = function (v) { return api.coord([v, i])[0]; };
          var group = [];
          group.push({ type: 'line', shape: { x1: x(b[0]), y1: y, x2: x(b[4]), y2: y },
            style: { stroke: rgba(c, 0.42), lineWidth: 2.4 } });
          group.push({ type: 'circle', shape: { cx: x(b[0]), cy: y, r: 2.4 }, style: { fill: rgba(c, 0.85) } });
          group.push({ type: 'circle', shape: { cx: x(b[4]), cy: y, r: 2.4 }, style: { fill: rgba(c, 0.85) } });
          group.push({ type: 'rect', shape: { x: x(b[1]), y: y - barH / 2, width: Math.max(2, x(b[3]) - x(b[1])), height: barH, r: 3 },
            style: { fill: rgba(c, 0.62) } });
          group.push({ type: 'line', shape: { x1: x(b[2]), y1: y - barH * 0.62, x2: x(b[2]), y2: y + barH * 0.62 },
            style: { stroke: '#fff', lineWidth: 2.2 } });
          group.push({ type: 'text', x: x(b[3]) + 7, y: y, style: {
            text: num(b[2]), fill: ink(t), font: '800 9.5px ' + FONT, textAlign: 'left', textVerticalAlign: 'middle' } });
          return { type: 'group', children: group };
        },
        data: boxes.map(function (b, i) { return [i]; }),
        encode: { x: 0, y: 0 }
      }]
    });
  };

  B.violin = function (el, d, t) {
    var groups = d.groups || [], cats = d.categories || [];
    var all = [].concat.apply([], groups);
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var W = (el && el.clientWidth) || 640, H = (el && el.clientHeight) || 190;
    var halfW = Math.min(20, (H - 60) / Math.max(1, cats.length) / 2.6);
    var seriesData = groups.map(function (g, gi) {
      var pts = kdePts(g, lo, hi, 40);
      var maxD = Math.max.apply(null, pts.map(function (p) { return p[1]; })) || 1;
      var q1 = quantile(g, 0.25), q2 = quantile(g, 0.5), q3 = quantile(g, 0.75);
      return { value: [gi, ...pts.map(function (p) { return p[1] / maxD; }), { q1: q1, q2: q2, q3: q3 }], xs: pts.map(function (p) { return p[0]; }),
        q1: q1, q2: q2, q3: q3 };
    });
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return cats[p.value[0]] + '<br/>中位数 ' + num(p.data.q2); } }),
      grid: grid({ left: 6, right: 18, top: 14, bottom: 18 }),
      xAxis: yAxis(t, { type: 'value', min: lo, max: hi, splitLine: { show: true, lineStyle: { color: rule(t) } } }),
      yAxis: xAxis(t, { data: cats, axisLabel: { color: ink(t), fontSize: 11, fontFamily: FONT } }),
      series: [{
        type: 'custom',
        renderItem: function (params, api) {
          var gi = api.value(0);
          var cy = api.coord([0, gi])[1];
          var half = api.size([0, 1])[1] * 0.24;
          var item = seriesData[params.dataIndex];
          var pts = [];
          var n = item.xs.length;
          for (var i = 0; i < n; i++) {
            var x = api.coord([item.xs[i], gi])[0];
            pts.push([x, cy - item.value[i + 1] * half]);
          }
          var right = pts.slice();
          var left = [];
          for (var k = n - 1; k >= 0; k--) {
            var x2 = api.coord([item.xs[k], gi])[0];
            left.push([x2, cy + item.value[k + 1] * half]);
          }
          var poly = right.concat(left);
          var c = rampOf(t)[Math.min(params.dataIndex + 1, 3)] || seriesColor(t, params.dataIndex);
          return {
            type: 'group', children: [
              { type: 'polygon', shape: { points: poly }, style: { fill: rgba(c, 0.22), stroke: rgba(c, 0.85), lineWidth: 1.2 } },
              { type: 'line', shape: { x1: api.coord([item.q1, gi])[0], y1: cy, x2: api.coord([item.q3, gi])[0], y2: cy },
                style: { stroke: rgba(ink(t), 0.5), lineWidth: 3 } },
              { type: 'circle', shape: { cx: api.coord([item.q2, gi])[0], cy: cy, r: 2.4 }, style: { fill: ink(t) } }
            ]
          };
        },
        data: seriesData, encode: { x: 0, y: 1 }
      }]
    });
  };
  function quantile(arr, q) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    var pos = (a.length - 1) * q, b = Math.floor(pos), rest = pos - b;
    return a[b + 1] !== undefined ? a[b] + rest * (a[b + 1] - a[b]) : a[b];
  }

  B.beeswarm = function (el, d, t) {
    var cats = d.categories || [], groups = d.groups || [];
    var pts = [];
    groups.forEach(function (g, gi) {
      var sorted = g.slice().sort(function (a, b) { return a - b; });
      var placed = [];
      sorted.forEach(function (v) {
        var jx = 0, k = 0;
        while (placed.some(function (o) { return Math.abs(o.v - v) < 1.6 && Math.abs(o.jx - jx) < 0.10; }) && k < 26) {
          jx = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 0.10; k++;
        }
        placed.push({ v: v, jx: jx });
        pts.push([v, gi + Math.max(-0.36, Math.min(0.36, jx)) * 1.2]);
      });
    });
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return num(p.value[0]); } }),
      grid: grid({ left: 6, right: 18, top: 14, bottom: 18 }),
      xAxis: yAxis(t, { type: 'value', scale: true, splitLine: { show: true, lineStyle: { color: rule(t) } } }),
      yAxis: xAxis(t, { data: cats, axisLabel: { color: ink(t), fontSize: 11, fontFamily: FONT } }),
      series: [
        { type: 'scatter', data: pts, symbolSize: 4,
          itemStyle: { color: rgba(accent(t), 0.55), borderColor: rgba(accent(t), 0.9), borderWidth: 0.5 } },
        { type: 'scatter', silent: true, symbolSize: 0.1,
          data: groups.map(function (g, gi) { return [quantile(g, 0.5), gi]; }),
          label: { show: true, position: 'top', distance: 4, color: accent(t), fontSize: 9, fontWeight: 700, fontFamily: FONT,
            backgroundColor: '#fff', padding: [1, 3], borderRadius: 2,
            formatter: function (p) { return 'med ' + num(p.value[0]); } } }
      ]
    });
  };

  B.ridge = function (el, d, t) {
    /* 最新一组放最上面 */
    var labels = (d.labels || []).slice().reverse(), groups = (d.groups || []).slice().reverse();
    var all = [].concat.apply([], groups);
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var rows = groups.map(function (g, gi) {
      var pts = kdePts(g, lo, hi, 48);
      var maxD = Math.max.apply(null, pts.map(function (p) { return p[1]; })) || 1;
      return { gi: gi, xs: pts.map(function (p) { return p[0]; }), ys: pts.map(function (p) { return p[1] / maxD; }) };
    });
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return labels[p.value[0]] || ''; } }),
      grid: { left: 52, right: 18, top: 30, bottom: 24 },
      xAxis: yAxis(t, { type: 'value', min: lo, max: hi, splitLine: { show: false },
        axisLabel: { color: muted(t), fontSize: 9.5, fontFamily: FONT } }),
      yAxis: yAxis(t, { type: 'value', min: -0.15, max: groups.length + 0.15, show: false, splitLine: { show: false } }),
      graphic: labels.map(function (lb, i) {
        var topPct = ((i + 0.42) / labels.length) * 100;
        return { type: 'text', left: 4, top: topPct + '%', z: 20,
          style: { text: lb, fill: muted(t), font: '700 9.5px ' + FONT } };
      }),
      series: [{
        type: 'custom',
        renderItem: function (params, api) {
          var row = rows[params.dataIndex];
          var baseY = groups.length - 1 - row.gi;
          var pts = [];
          for (var i = 0; i < row.xs.length; i++) {
            var p = api.coord([row.xs[i], baseY + row.ys[i] * 0.95]);
            pts.push([p[0], p[1]]);
          }
          var bottomRight = api.coord([row.xs[row.xs.length - 1], baseY]);
          var bottomLeft = api.coord([row.xs[0], baseY]);
          pts.push([bottomRight[0], bottomRight[1]]);
          pts.push([bottomLeft[0], bottomLeft[1]]);
          var c = seriesColor(t, row.gi);
          return { type: 'polygon', shape: { points: pts },
            style: { fill: rgba(c, 0.30), stroke: rgba(c, 0.95), lineWidth: 1.1 },
            emphasis: { style: { fill: rgba(c, 0.45) } } };
        },
        data: rows.map(function (r) { return { value: [r.gi] }; })
      }]
    });
  };

  B.ecdf = function (el, d, t) {
    var s = (d.samples || []).slice().sort(function (a, b) { return a - b; });
    var n = s.length;
    var ecdf = s.map(function (v, i) { return [v, (i + 1) / n * 100]; });
    return base(t, {
      tooltip: tip(t, { trigger: 'axis' }),
      grid: grid({ left: 6, right: 24, top: 16, bottom: 20 }),
      xAxis: yAxis(t, { type: 'value', scale: true, splitLine: { show: false },
        name: 'sample', nameLocation: 'end', nameGap: 6, nameTextStyle: { color: muted(t), fontSize: 9.5, fontFamily: FONT, align: 'right' } }),
      yAxis: yAxis(t, { type: 'value', max: 100, axisLabel: { color: muted(t), fontSize: 10, fontFamily: FONT, formatter: '{value}%' } }),
      series: [
        { type: 'line', data: ecdf, showSymbol: false, step: 'end', silent: false,
          lineStyle: { color: ink(t), width: 2 }, areaStyle: { color: rgba(ink(t), 0.05) } },
        { type: 'line', data: [[s[0], 0], [s[Math.floor(n / 2)], 50], [s[n - 1], 100]], showSymbol: false,
          lineStyle: { color: rgba(accent(t), 0.9), type: 'dashed', width: 1.2 }, silent: true }
      ]
    });
  };

  B.matrixHeat = function (el, d, t) {
    var names = d.names, m = d.matrix;
    var cells = [];
    for (var i = 0; i < names.length; i++) for (var j = 0; j < names.length; j++) cells.push([j, i, Math.round(m[i][j] * 100) / 100]);
    var vals = cells.map(function (c) { return c[2]; });
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return names[p.value[1]] + ' · ' + names[p.value[0]] + '<br/>' + num(p.value[2]); } }),
      grid: { left: 6, right: 14, top: 14, bottom: 16, containLabel: true },
      xAxis: xAxis(t, { data: names, axisLabel: { color: muted(t), fontSize: 9, fontFamily: FONT, interval: 0 } }),
      yAxis: xAxis(t, { data: names, axisLabel: { color: muted(t), fontSize: 9, fontFamily: FONT } }),
      visualMap: { min: Math.min.apply(null, vals), max: Math.max.apply(null, vals), show: false,
        inRange: { color: [rgba(ink(t), 0.04), rgba(accent(t), 0.35), accent(t)] } },
      series: [{ type: 'heatmap', data: cells, itemStyle: { borderColor: '#FFFFFF', borderWidth: 2 },
        label: { show: true, color: ink(t), fontSize: 9, fontFamily: FONT,
          formatter: function (p) { return p.value[2] >= 10 ? Math.round(p.value[2]) : p.value[2].toFixed(1); } } }]
    });
  };

  /* ================= 5. 关系与相关 ================= */
  B.scatter = function (el, d, t) {
    var pts = d.points || [];
    var series = [{
      type: 'scatter', data: pts, symbolSize: 7,
      itemStyle: { color: rgba(seriesColor(t, 0), 0.55), borderColor: rgba(seriesColor(t, 0), 0.95), borderWidth: 0.6 },
      emphasis: { itemStyle: { color: seriesColor(t, 0) } }
    }];
    var fitEls = [];
    if (d.fit && pts.length > 3) {
      var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
      pts.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; syy += p[1] * p[1]; });
      var den = n * sxx - sx * sx;
      if (den) {
        var k = (n * sxy - sx * sy) / den;
        var b = (sy - k * sx) / n;
        var r = (n * sxy - sx * sy) / Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
        var xs = pts.map(function (p) { return p[0]; });
        var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
        series.push({
          type: 'line', data: [[x0, k * x0 + b], [x1, k * x1 + b]], showSymbol: false, silent: true, z: 5,
          lineStyle: { color: accentOf(t), width: 1.8, type: 'dashed' },
          endLabel: { show: false }
        });
        var r2 = r * r;
        fitEls.push({ type: 'text', right: 14, top: 6, z: 10,
          style: { text: 'y = ' + k.toFixed(2) + 'x ' + (b >= 0 ? '+ ' : '− ') + Math.abs(b).toFixed(1) +
            '　R² = ' + r2.toFixed(3) + '　r = ' + r.toFixed(2),
            fill: accentOf(t), font: '800 10px ' + FONT,
            backgroundColor: (t && t._dark) ? 'rgba(22,24,30,.9)' : 'rgba(255,255,255,.86)', padding: [4, 8], borderRadius: 4 } });
      }
    }
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) {
        if (p.seriesType === 'line') return '';
        return d.xName + ' ' + num(p.value[0]) + '<br/>' + d.yName + ' ' + num(p.value[1]);
      } }),
      graphic: fitEls,
      grid: grid({ left: 6, right: 24, top: 30, bottom: 26 }),
      xAxis: yAxis(t, { type: 'value', scale: true, splitLine: { show: false },
        name: d.xName, nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: muted(t), fontSize: 10, fontFamily: FONT } }),
      yAxis: yAxis(t, { type: 'value', scale: true, name: d.yName, nameTextStyle: { color: muted(t), fontSize: 10, fontFamily: FONT } }),
      series: series
    });
  };

  B.bubble = function (el, d, t) {
    var maxS = Math.max.apply(null, d.data.map(function (x) { return x.size; }));
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return p.name + '<br/>' + d.xName + ' ' + p.value[0] + '<br/>' + d.yName + ' ' + p.value[1]; } }),
      grid: grid({ left: 6, right: 24, top: 18, bottom: 24 }),
      xAxis: yAxis(t, { type: 'value', scale: true, splitLine: { show: false },
        name: d.xName, nameLocation: 'middle', nameGap: 24, nameTextStyle: { color: muted(t), fontSize: 10, fontFamily: FONT } }),
      yAxis: yAxis(t, { type: 'value', scale: true, name: d.yName, nameTextStyle: { color: muted(t), fontSize: 10, fontFamily: FONT } }),
      series: [{
        type: 'scatter',
        data: d.data.map(function (x, i) { return { name: x.name, value: [x.x, x.y], symbolSize: 12 + Math.sqrt(x.size / maxS) * 26, itemStyle: { color: rgba(seriesColor(t, i), 0.55), borderColor: seriesColor(t, i), borderWidth: 0.8 } }; }),
        label: { show: true, position: 'inside', color: '#fff', fontSize: 9, fontFamily: FONT, formatter: '{b}' }
      }]
    });
  };


  /* ---------- 配色模板 → 相关性发散色（负=蓝/正=红金） ---------- */
  function divergingOf(t) {
    var ps = (window.ADV_PALETTES || []).filter(function (x) { return x.id === ((t && t.paletteId) || 'consult'); })[0] || {};
    var neg = corrNeg(t);   // 负相关 = 冷色
    var pos = corrPos(t);   // 正相关 = 暖色
    var mid = (t && t._dark) ? '#1A1B20' : '#F6F1E7';
    return [neg, mixHex(neg, mid, 0.62), mixHex(neg, mid, 0.3), mid,
      mixHex(pos, mid, 0.3), mixHex(pos, mid, 0.62), pos];
  }
  function corrPos(t) {
    if (t && t._dark) return t.accent || '#E2B96B';
    var ps = (window.ADV_PALETTES || []).filter(function (x) { return x.id === ((t && t.paletteId) || 'consult'); })[0] || {};
    if (ps.id === 'contrast') return '#C0392B';
    if (ps.id === 'burgundy') return '#8C3A2E';
    if (ps.id === 'forest') return '#8A6A2F';
    return ps.down || '#B5484B';
  }
  function corrNeg(t) {
    if (t && t._dark) return (t.series && t.series[1]) || '#7FA3C4';
    var ps = (window.ADV_PALETTES || []).filter(function (x) { return x.id === ((t && t.paletteId) || 'consult'); })[0] || {};
    if (ps.id === 'contrast') return '#0B3C5D';
    if (ps.id === 'burgundy') return '#4A6E8A';
    if (ps.id === 'forest') return '#3E6B7A';
    return (ps.colors && ps.colors[1]) || '#1B4B72';
  }
  function mixHex(a, b, t) {
    function h2r(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
    var A = h2r(a), B = h2r(b);
    var o = A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); });
    return '#' + o.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }

  /* ---------- 相关性热力矩阵（发散色 + 数值 + 上下三角） ---------- */
  B.corrMatrix = function (el, d, t) {
    var names = d.names || [], M = d.matrix || [];
    var n = names.length;
    var W = (el && el.clientWidth) || 600, H = (el && el.clientHeight) || 300;
    var narrow = W < 480;
    var cells = [];
    var minR = 1, maxR = -1;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var v = M[i][j];
      if (i === j) continue;
      minR = Math.min(minR, v); maxR = Math.max(maxR, v);
    }
    for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) {
      cells.push([b, a, M[a][b]]);
    }
    return base(t, {
      tooltip: tip(t, { formatter: function (p) {
        return '<b>' + names[p.value[1]] + ' × ' + names[p.value[0]] + '</b><br/>相关系数 ' + p.value[2].toFixed(2);
      } }),
      grid: { left: narrow ? 74 : 92, right: narrow ? 40 : 62, top: narrow ? 54 : 58, bottom: 10 },
      xAxis: { type: 'category', data: names, position: 'top', splitArea: { show: false },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: muted(t), fontSize: narrow ? 7 : 7.5, fontFamily: FONT, rotate: 0,
          margin: 7, interval: 0, width: narrow ? 40 : 52, overflow: 'break', lineHeight: 9 } },
      yAxis: { type: 'category', data: names, inverse: true,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: muted(t), fontSize: narrow ? 8 : 9, fontFamily: FONT,
          interval: 0, width: 74, overflow: 'truncate' } },
      visualMap: {
        min: -1, max: 1, orient: 'vertical', right: 4, top: 'center', itemWidth: 10, itemHeight: narrow ? 80 : 120,
        calculable: false, text: ['+1', '-1'], textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT },
        inRange: { color: divergingOf(t) }
      },
      series: [{
        type: 'heatmap', data: cells,
        label: { show: true, color: ink(t), fontSize: n > 8 ? 8 : 9.5, fontFamily: FONT,
          formatter: function (p) { return Math.abs(p.value[2]) >= 0.995 ? '1' : p.value[2].toFixed(2); } },
        itemStyle: { borderColor: '#FFFFFF', borderWidth: 1.5, borderRadius: 2 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(5,28,44,.25)', borderColor: ink(t) } }
      }]
    });
  };

  /* ---------- 关联网络 + 热力矩阵（案例组合形态） ---------- */
  B.corrNetwork = function (el, d, t) {
    var names = d.names || [], M = d.matrix || [];
    var n = names.length;
    var W = (el && el.clientWidth) || 900;
    var narrow = W < 620;
    /* 节点圆环布局（左半区，坐标 0..1） */
    var nodes = names.map(function (nm, i) {
      var ang = -Math.PI / 2 + i * (2 * Math.PI / n);
      return { name: nm, x: 0.5 + Math.cos(ang) * 0.46, y: 0.5 + Math.sin(ang) * 0.46,
        symbolSize: 9, value: Math.round((1 + i) * 10) };
    });
    var links = [];
    var strongPos = null, strongNeg = null;
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
      var r = M[i][j];
      if (Math.abs(r) < (narrow ? 0.42 : 0.22)) continue;
      links.push({ source: names[i], target: names[j], value: Math.abs(r), sign: r > 0 ? 1 : -1,
        lineStyle: { color: r > 0 ? corrPos(t) : corrNeg(t), opacity: Math.min(0.92, 0.25 + Math.abs(r) * 0.9),
          width: 0.8 + Math.abs(r) * 5, curveness: 0.16 } });
      if (r > 0 && (!strongPos || r > strongPos.r)) strongPos = { a: names[i], b: names[j], r: r };
      if (r < 0 && (!strongNeg || r < strongNeg.r)) strongNeg = { a: names[i], b: names[j], r: r };
    }
    var cells = [];
    for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) cells.push([b, a, M[a][b]]);
    var padTop = 76;
    /* 卡片小尺寸：只画网络（矩阵点开大图看），避免两图挤压重叠 */
    if (narrow) {
      var linksS = [];
      for (var si = 0; si < n; si++) for (var sj = si + 1; sj < n; sj++) {
        var rr = M[si][sj];
        if (Math.abs(rr) < 0.25) continue;
        linksS.push({ source: names[si], target: names[sj], value: Math.abs(rr), sign: rr > 0 ? 1 : -1,
          lineStyle: { color: rr > 0 ? corrPos(t) : corrNeg(t),
            opacity: Math.min(0.95, 0.35 + Math.abs(rr) * 0.9), width: 1 + Math.abs(rr) * 5.5, curveness: 0.14 } });
      }
      nodes = nodes.map(function (nd) { nd.x = 0.5 + (nd.x - 0.5) * 0.92; nd.y = 0.5 + (nd.y - 0.5) * 0.92; return nd; });
      return base(t, {
        tooltip: tip(t, { formatter: function (p) {
          if (p.dataType === 'edge') return '<b>' + p.data.source + ' — ' + p.data.target + '</b><br/>相关 ' + (p.data.sign > 0 ? '+' : '') + p.data.value.toFixed(2);
          if (p.seriesType === 'graph') return '<b>' + p.name + '</b>';
          return '';
        } }),
        title: [{ text: '关联网络', left: 2, top: 2, textStyle: { color: muted(t), fontSize: 9.5, fontWeight: 700, fontFamily: FONT } }],
        series: [{
          type: 'graph', layout: 'none', left: 6, top: 16, width: '96%', height: '90%',
          roam: false, draggable: false,
          data: nodes.map(function (nd, i) {
            return { name: nd.name, x: nd.x, y: nd.y, symbolSize: 9,
              itemStyle: { color: seriesColor(t, i), borderColor: '#fff', borderWidth: 1.5 },
              label: { show: true, position: nd.x > 0.52 ? 'left' : 'right', fontSize: 7.5,
                fontFamily: FONT, color: ink(t), distance: 4,
                formatter: nd.name.length > 5 ? nd.name.slice(0, 4) + '…' : nd.name } };
          }),
          links: linksS, lineStyle: { curveness: 0.14 },
          emphasis: { focus: 'adjacency' }
        }]
      });
    }
    return base(t, {
      tooltip: tip(t, { formatter: function (p) {
        if (p.seriesType === 'graph' && p.dataType === 'edge') {
          return '<b>' + p.data.source + ' — ' + p.data.target + '</b><br/>相关系数 ' + (p.data.sign > 0 ? '+' : '-') + p.data.value.toFixed(2);
        }
        if (p.seriesType === 'graph') return '<b>' + p.name + '</b>';
        if (p.seriesType === 'heatmap') return '<b>' + names[p.value[1]] + ' × ' + names[p.value[0]] + '</b><br/>' + p.value[2].toFixed(2);
        return '';
      } }),
      graphic: (function () {
        var up = corrPos(t), dn = corrNeg(t);
        var gx = 8;
        return [
          { type: 'text', left: gx, top: 22, z: 20, style: { text: '连线', fill: muted(t), font: '600 8.5px ' + FONT } },
          { type: 'line', left: gx + 30, top: 27, z: 20, shape: { x1: 0, y1: 0, x2: 16, y2: 0 }, style: { stroke: up, lineWidth: 2.6 } },
          { type: 'text', left: gx + 50, top: 22, z: 20, style: { text: '正相关', fill: ink(t), font: '8px ' + FONT } },
          { type: 'line', left: gx + 30, top: 40, z: 20, shape: { x1: 0, y1: 0, x2: 16, y2: 0 }, style: { stroke: dn, lineWidth: 2.6 } },
          { type: 'text', left: gx + 50, top: 35, z: 20, style: { text: '负相关', fill: ink(t), font: '8px ' + FONT } },
          { type: 'text', left: gx, top: 52, z: 20, style: { text: '粗细 = |相关系数|', fill: muted(t), font: '8px ' + FONT } }
        ];
      })(),
      title: [
        { text: '相关性网络', left: '1%', top: 2, textStyle: { color: muted(t), fontSize: 10, fontWeight: 700, fontFamily: FONT } },
        { text: '相关性矩阵（日收益率 · 红色为正 · 蓝色为负）', left: narrow ? '1%' : '38%', top: 2,
          textStyle: { color: muted(t), fontSize: 10, fontWeight: 700, fontFamily: FONT } },
        { text: (strongPos ? '最强正相关 ' + strongPos.a + ' × ' + strongPos.b + '  +' + strongPos.r.toFixed(2) : '') +
                (strongNeg ? '　｜　最强负相关 ' + strongNeg.a + ' × ' + strongNeg.b + '  ' + strongNeg.r.toFixed(2) : ''),
          left: '1%', bottom: 2, textStyle: { color: rgba(ink(t), 0.55), fontSize: 9, fontFamily: FONT } }
      ],
      grid: { left: narrow ? '44%' : '46%', right: narrow ? 56 : 70, top: 104, bottom: 34 },
      xAxis: { type: 'category', data: names, position: 'top', splitArea: { show: false },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: muted(t), fontSize: 7.5, fontFamily: FONT, rotate: 90, interval: 0, margin: 8 } },
      yAxis: { type: 'category', data: names, inverse: true, splitArea: { show: false },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: muted(t), fontSize: 7.5, fontFamily: FONT, interval: 0, width: 60, overflow: 'truncate' } },
      visualMap: { min: -1, max: 1, orient: 'vertical', right: 2, top: 'center', itemWidth: 8, itemHeight: 70,
        calculable: false, text: ['+1', '-1'], textStyle: { color: muted(t), fontSize: 8, fontFamily: FONT },
        inRange: { color: divergingOf(t) } },
      series: [
        { type: 'graph', layout: 'none', left: 4, top: 46, width: narrow ? '40%' : '42%', height: '74%',
          coordinateSystem: null, roam: false, draggable: false,
          data: nodes.map(function (nd, i) {
            return { name: nd.name, x: nd.x, y: nd.y, symbolSize: 9 + (i % 3) * 2,
              itemStyle: { color: seriesColor(t, i) },
              label: { show: true, position: nd.x > 0.52 ? 'left' : 'right', fontSize: 8, fontFamily: FONT,
                color: ink(t), distance: 5,
                formatter: nd.name.length > 6 ? nd.name.slice(0, 5) + '…' : nd.name } };
          }),
          links: links,
          lineStyle: { curveness: 0.16 },
          emphasis: { focus: 'adjacency', lineStyle: { width: 4 } },
          label: { show: true } },
        { type: 'heatmap', data: cells,
          itemStyle: { borderColor: '#FFFFFF', borderWidth: 1, borderRadius: 1.5 },
          label: { show: !narrow && W >= 760, color: ink(t), fontSize: 7, fontFamily: FONT,
            formatter: function (p) { var v = p.value[2]; return Math.abs(v) >= 0.995 ? '1' : v.toFixed(2); } } }
      ]
    });
  };

  B.venn = function (el, d, t) {
    var W = (el && el.clientWidth) || 640, H = (el && el.clientHeight) || 190;
    var R = Math.min(W * 0.17, H * 0.30);
    var cx = W / 2, cy = H / 2 + 2;
    var sets = (d.sets || []).slice(0, 3);
    var centers = [[cx - R * 0.52, cy - R * 0.34], [cx + R * 0.52, cy - R * 0.34], [cx, cy + R * 0.58]];
    var els = [];
    sets.forEach(function (s, i) {
      els.push({ type: 'circle', shape: { cx: centers[i][0], cy: centers[i][1], r: R },
        style: { fill: rgba(seriesColor(t, i), 0.22), stroke: seriesColor(t, i), lineWidth: 1.1 }, silent: true });
    });
    sets.forEach(function (s, i) {
      var ly = i < 2 ? centers[i][1] - R - 4 : centers[i][1] + R + 4;
      els.push({ type: 'text', left: Math.round(centers[i][0] - s.name.length * 5), top: Math.round(ly),
        style: { text: s.name + '  ' + s.value, fill: ink(t), font: '600 10.5px ' + FONT } });
    });
    els.push({ type: 'text', left: cx - 10, top: cy - R * 0.55, style: { text: String(d.overlapAB || ''), fill: ink(t), font: '700 10px ' + FONT } });
    els.push({ type: 'text', left: cx - 6, top: cy + R * 0.18, style: { text: String(d.overlapAll || ''), fill: ink(t), font: '700 10px ' + FONT } });
    return base(t, { tooltip: { show: false }, graphic: els });
  };

  B.arc = function (el, d, t) {
    var nodes = (d.nodes || []).map(function (n, i) { return { name: n, x: i * 100, y: 0, symbolSize: 8, itemStyle: { color: ink(t) } }; });
    var links = (d.links || []).map(function (l) {
      return { source: l[0], target: l[1], lineStyle: { color: rgba(accent(t), 0.55), width: 1.4, curveness: 0.6 } };
    });
    return base(t, {
      tooltip: tip(t),
      series: [{
        type: 'graph', layout: 'none', data: nodes, links: links, roam: false,
        symbol: 'circle', symbolSize: 8,
        lineStyle: { color: rgba(accent(t), 0.5), curveness: 0.6, width: 1.3 },
        label: { show: true, position: 'bottom', distance: 8, color: muted(t), fontSize: 10, fontFamily: FONT },
        itemStyle: { color: ink(t), borderColor: '#FFF', borderWidth: 1.5 },
        top: '30%', bottom: '30%', left: 26, right: 26
      }]
    });
  };

  /* ================= 6. 流动与转化 ================= */
  /* ---------- 转化漏斗（顶刊/路演风格：阶段流失 + 转化率桥接） ---------- */
  B.funnel = function (el, d, t) {
    var steps = d.steps || [];
    var W = (el && el.clientWidth) || 600;
    var narrow = W < 480;
    var first = steps[0] ? steps[0].value : 1;
    var rp = rampOf(t);
    var last = steps.length ? steps[steps.length - 1].value : 0;
    var losses = steps.map(function (s, i) {
      if (!i) return null;
      return steps[i - 1].value - s.value;
    });
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) {
        var i = p.dataIndex, prev = i > 0 ? steps[i - 1].value : p.value;
        return '<b>' + p.name + '</b><br/>' + num(p.value) + '（占总量 ' + (p.value / first * 100).toFixed(1) + '%）' +
          (i > 0 ? '<br/>本环节转化 ' + (p.value / prev * 100).toFixed(1) + '%　流失 ' + num(prev - p.value) : '');
      } }),
      title: [
        { text: '整体转化率', left: 12, top: 2,
          textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT, fontWeight: 400 } },
        { text: (last / first * 100).toFixed(1) + '%', left: 12, top: 14,
          textStyle: { color: ink(t), fontSize: narrow ? 16 : 20, fontFamily: FONT, fontWeight: 800 } },
        { text: steps.length + ' 个环节 · 首环节 ' + num(first), left: 12, top: narrow ? 34 : 40,
          textStyle: { color: rgba(ink(t), 0.45), fontSize: 9, fontFamily: FONT } }
      ],
      series: [{
        type: 'funnel', left: narrow ? '16%' : '22%', right: narrow ? '34%' : '38%',
        top: narrow ? 16 : 20, bottom: 18,
        minSize: '20%', maxSize: '100%', sort: 'descending', gap: 5,
        itemStyle: { borderWidth: 0, borderRadius: 2 },
        label: { show: true, position: 'right', color: ink(t), fontFamily: FONT, lineHeight: 14, distance: 8,
          formatter: function (p) {
            var i = p.dataIndex;
            var prev = i > 0 ? steps[i - 1].value : p.value;
            var rate = prev ? (p.value / prev * 100) : 100;
            return '{n|' + p.name + '} {v|' + num(p.value) + '}' + (i > 0 ? ' {d|↓' + rate.toFixed(0) + '%}' : '');
          },
          rich: { n: { fontSize: narrow ? 9 : 10.5, fontWeight: 700, color: ink(t), fontFamily: FONT },
                  v: { fontSize: narrow ? 9 : 10.5, color: rgba(ink(t), 0.62), fontFamily: FONT },
                  d: { fontSize: narrow ? 8 : 9.5, color: (t.down || '#C0392B'), fontFamily: FONT } } },
        /* 阶段名 + 流失量放在左侧（用 labelLine 引出） */
        data: steps.map(function (s, i) {
          var c = rp[Math.min(i + 1, rp.length - 1)] || seriesColor(t, i);
          return { name: s.name, value: s.value, itemStyle: { color: c },
            label: { show: true },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(5,28,44,.2)' } } };
        }),
        labelLine: { show: true, length: 6, length2: 8, lineStyle: { color: rgba(ink(t), 0.25) } }
      }]
    });
  };

  /* ---------- 桑基图（顶刊风格：列标题 + 数值标签 + 大流量标注） ---------- */
  B.sankey = function (el, d, t) {
    var nodes = (d.nodes || []).map(function (n) { return { name: n.name }; });
    var links = (d.links || []).map(function (l) {
      return { source: l.source, target: l.target, value: l.value };
    });
    var W = (el && el.clientWidth) || 700;
    var narrow = W < 520;
    var total = 0;
    nodes.forEach(function (n) {
      var out = 0, inn = 0;
      links.forEach(function (l) { if (l.source === n.name) out += l.value; if (l.target === n.name) inn += l.value; });
      total = Math.max(total, out, inn);
    });
    var sumIn = 0, sumOut = 0;
    nodes.forEach(function (n) {
      var hasIn = links.some(function (l) { return l.target === n.name; });
      var hasOut = links.some(function (l) { return l.source === n.name; });
      if (!hasIn) sumIn += links.filter(function (l) { return l.source === n.name; }).reduce(function (a, b) { return a + b.value; }, 0);
      if (!hasOut) sumOut += links.filter(function (l) { return l.target === n.name; }).reduce(function (a, b) { return a + b.value; }, 0);
    });
    var palette = rampOf(t);
    function nodeColor(name, i) {
      var idx = nodes.findIndex(function (x) { return x.name === name; });
      return seriesColor(t, idx % 6);
    }
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) {
        if (p.dataType === 'edge') return p.data.source + ' → ' + p.data.target + '<br/>' + num(p.data.value);
        return '<b>' + p.name + '</b>';
      } }),
      title: [
        { text: '来源', left: '10%', top: 4, textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT, fontWeight: 600 } },
        { text: '渠道', left: '50%', top: 4, textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT, fontWeight: 600 } },
        { text: '结果', right: '10%', top: 4, textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT, fontWeight: 600 } },
        { text: '总流入 ' + num(sumIn) + '　总产出 ' + num(sumOut), left: '2%', bottom: 2,
          textStyle: { color: rgba(ink(t), 0.45), fontSize: 9, fontFamily: FONT } }
      ],
      series: [{
        type: 'sankey', left: 10, right: 10, top: 30, bottom: 26,
        nodeWidth: narrow ? 8 : 11, nodeGap: narrow ? 8 : 12,
        draggable: false, focusNodeAdjacency: 'allEdges',
        emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'source', curveness: 0.5, opacity: 0.32 },
        itemStyle: { borderWidth: 0, borderRadius: 2 },
        label: {
          color: ink(t), fontSize: narrow ? 8 : 9.5, fontFamily: FONT, fontWeight: 600,
          formatter: function (p) { return p.name; }
        },
        data: (function () {
          /* 计算每个节点所在列：无入边=第 1 列，无出边=最后一列 */
          var depth = {};
          nodes.forEach(function (n) {
            var hasIn = links.some(function (l) { return l.target === n.name; });
            var hasOut = links.some(function (l) { return l.source === n.name; });
            depth[n.name] = !hasIn ? 0 : (!hasOut ? 2 : 1);
          });
          return nodes.map(function (n, i) {
            return { name: n.name, itemStyle: { color: seriesColor(t, i) },
              label: { position: depth[n.name] === 2 ? 'left' : 'right',
                color: depth[n.name] === 1 ? rgba(ink(t), 0.72) : ink(t) } };
          });
        })(),
        links: links.map(function (l) {
          return { source: l.source, target: l.target, value: l.value,
            lineStyle: { opacity: 0.28 + Math.min(0.5, l.value / (total || 1) * 1.4) } };
        })
      }]
    });
  };

  B.chord = function (el, d, t) {
    var W = (el && el.clientWidth) || 600;
    var narrow = W < 480;
    var names = d.names, m = d.matrix;
    var nodes = names.map(function (n, i) { return { name: n, symbolSize: 9, itemStyle: { color: seriesColor(t, i) }, label: { color: ink(t), fontSize: 10, fontFamily: FONT } }; });
    var links = [];
    for (var i = 0; i < names.length; i++) for (var j = i + 1; j < names.length; j++) {
      var v = m[i][j] + m[j][i];
      if (v > 0) links.push({ source: names[i], target: names[j], value: v,
        lineStyle: { color: rgba(seriesColor(t, i), 0.35), width: Math.max(0.8, v / 7), curveness: 0.45, opacity: 0.5 } });
    }
    return base(t, {
      tooltip: tip(t),
      series: [{
        type: 'graph', layout: 'circular', circular: { rotateLabel: !narrow },
        data: nodes, links: links, roam: false, symbolSize: 9,
        lineStyle: { curveness: 0.45, opacity: 0.5 },
        label: { show: true, position: 'right', color: ink(t), fontSize: narrow ? 8 : 10, fontFamily: FONT },
        itemStyle: { borderColor: '#FFF', borderWidth: 1.5 },
        top: narrow ? 30 : 26, bottom: narrow ? 30 : 26
      }]
    });
  };

  /* ================= 7. 地理空间 ================= */
  var _GEO_EL = null;
  function geo(t, series, extra) {
    return base(t, Object.assign({
      tooltip: tip(t),
      geo: {
        map: 'world', roam: true,
        zoom: ((_GEO_EL && _GEO_EL.clientWidth) || 600) < 480 ? 1.5 : 1.1,
        center: [18, 18],
        itemStyle: { areaColor: rgba(ink(t), 0.045), borderColor: rgba(ink(t), 0.13), borderWidth: 0.4 },
        emphasis: { itemStyle: { areaColor: rgba(accent(t), 0.16) }, label: { show: false } },
        select: { itemStyle: { areaColor: rgba(accent(t), 0.16) } }
      },
      series: series
    }, extra || {}));
  }
  B.choropleth = function (el, d, t) {
    _GEO_EL = el;
    var W = (el && el.clientWidth) || 700;
    var narrow = W < 520;
    var vals = [
      { name: 'China', value: 5.2, cn: '中国' }, { name: 'United States', value: 2.8, cn: '美国' },
      { name: 'Germany', value: 1.6, cn: '德国' }, { name: 'Japan', value: 1.2, cn: '日本' },
      { name: 'India', value: 6.8, cn: '印度' }, { name: 'Brazil', value: 2.9, cn: '巴西' },
      { name: 'United Kingdom', value: 1.4, cn: '英国' }, { name: 'France', value: 1.1, cn: '法国' },
      { name: 'Canada', value: 2.0, cn: '加拿大' }, { name: 'Australia', value: 2.4, cn: '澳大利亚' },
      { name: 'Russia', value: 1.3, cn: '俄罗斯' }, { name: 'Indonesia', value: 5.0, cn: '印尼' },
      { name: 'Mexico', value: 2.6, cn: '墨西哥' }, { name: 'Saudi Arabia', value: 3.9, cn: '沙特' },
      { name: 'South Africa', value: 0.9, cn: '南非' }, { name: 'Nigeria', value: 3.1, cn: '尼日利亚' },
      { name: 'Egypt', value: 4.2, cn: '埃及' }, { name: 'Argentina', value: -1.2, cn: '阿根廷' },
      { name: 'South Korea', value: 2.2, cn: '韩国' }, { name: 'Italy', value: 0.8, cn: '意大利' }
    ];
    var top = vals.slice().sort(function (a, b) { return b.value - a.value; }).slice(0, 5);
    var rp = rampOf(t);
    var opt = geo(t, [{
      type: 'map', map: 'world', roam: true, zoom: narrow ? 1.35 : 1.1, nameProperty: 'name',
      itemStyle: { areaColor: rgba(ink(t), 0.035), borderColor: rgba(ink(t), 0.10), borderWidth: 0.4 },
      emphasis: { itemStyle: { areaColor: rgba(accent(t), 0.28) }, label: { show: true, color: ink(t), fontSize: 10, fontFamily: FONT } },
      label: { show: false }, data: vals
    }]);
    opt.visualMap = {
      min: -2, max: 7, left: 10, bottom: 10, orient: 'horizontal', itemWidth: 10, itemHeight: narrow ? 76 : 110,
      text: ['高', '低'], calculable: false,
      textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT },
      inRange: { color: [rgba(rp[2] || '#A8C4D8', 0.35), rgba(rp[2] || '#A8C4D8', 0.7), rp[1] || '#1B4B72', rp[0] || '#051C2C'] }
    };
    opt.title = [
      { text: d.metric || '人均 GDP（万元）', left: 14, top: 8,
        textStyle: { color: ink(t), fontSize: 11.5, fontFamily: FONT, fontWeight: 700 } },
      { text: '前 5 名 · ' + top.map(function (x) { return x.cn + ' ' + x.value; }).join('　'),
        left: 14, top: 26, textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT } }
    ];
    return opt;
  };
  B.symbolMap = function (el, d, t) {
    _GEO_EL = el;
    var pts = d.points || [];
    var max = Math.max.apply(null, pts.map(function (p) { return p.value; }));
    return geo(t, [{
      type: 'scatter', coordinateSystem: 'geo',
      data: pts.map(function (p) { return { name: p.name, value: p.coord.concat(p.value) }; }),
      symbolSize: function (v) { return 6 + Math.sqrt(v[2] / max) * 20; },
      itemStyle: { color: rgba(accent(t), 0.55), borderColor: accent(t), borderWidth: 0.8 },
      label: { show: true, position: 'right', distance: 4, color: muted(t), fontSize: 9, fontFamily: FONT, formatter: function (p) { return p.name; } }
    }]);
  };
  B.heatMapGeo = function (el, d, t) {
    _GEO_EL = el;
    var W = (el && el.clientWidth) || 700;
    var narrow = W < 520;
    var hubs = [
      { n: '上海', c: [121.47, 31.23], v: 96 }, { n: '纽约', c: [-74.01, 40.71], v: 88 },
      { n: '伦敦', c: [-0.13, 51.51], v: 74 }, { n: '东京', c: [139.69, 35.69], v: 68 },
      { n: '新加坡', c: [103.82, 1.35], v: 46 }, { n: '迪拜', c: [55.27, 25.20], v: 38 },
      { n: '悉尼', c: [151.21, -33.87], v: 29 }, { n: '圣保罗', c: [-46.63, -23.55], v: 24 },
      { n: '孟买', c: [72.88, 19.08], v: 33 }, { n: '法兰克福', c: [8.68, 50.11], v: 27 }
    ];
    var max = Math.max.apply(null, hubs.map(function (h) { return h.v; }));
    var acc = accentOf(t);
    var opt = geo(t, [{
      type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2,
      rippleEffect: { brushType: 'stroke', scale: 2.6, period: 4 },
      symbolSize: function (v) { return 8 + Math.sqrt(v[2] / max) * (narrow ? 16 : 24); },
      itemStyle: { color: rgba(acc, 0.55), borderColor: rgba(acc, 0.9), borderWidth: 1 },
      label: { show: true, distance: 7, color: ink(t),
        fontSize: narrow ? 8 : 9, fontFamily: FONT, fontWeight: 700,
        position: function (p) { return p.value[0] < 40 ? 'left' : 'right'; },
        formatter: function (p) { return p.value[2] >= 30 ? p.name + ' ' + p.value[2] : ''; } },
      data: hubs.map(function (h) { return { name: h.n, value: h.c.concat(h.v) }; })
    }, {
      /* 热点下方加一层静态光晕，强化密度感 */
      type: 'scatter', coordinateSystem: 'geo', zlevel: 1, silent: true,
      symbolSize: function (v) { return 16 + Math.sqrt(v[2] / max) * (narrow ? 28 : 46); },
      itemStyle: { color: rgba(acc, 0.10) },
      data: hubs.map(function (h) { return { name: h.n, value: h.c.concat(h.v) }; })
    }]);
    opt.title = [
      { text: d.metric || '门店密度', left: 14, top: 8,
        textStyle: { color: ink(t), fontSize: 11.5, fontFamily: FONT, fontWeight: 700 } },
      { text: '气泡面积 = 门店数量 · 前三位 ' + hubs.slice(0, 3).map(function (h) { return h.n; }).join(' / '),
        left: 14, top: 26, textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT } }
    ];
    return opt;
  };
  B.trajectory = function (el, d, t) {
    _GEO_EL = el;
    var path = d.path || [];
    return geo(t, [
      { type: 'lines', coordinateSystem: 'geo', polyline: true, data: [{ coords: path }], silent: true,
        lineStyle: { color: rgba(accent(t), 0.8), width: 1.6, curveness: 0 } },
      { type: 'scatter', coordinateSystem: 'geo', data: path.map(function (p, i) { return { name: 'P' + (i + 1), value: p }; }),
        symbolSize: 5, itemStyle: { color: ink(t) } },
      { type: 'lines', coordinateSystem: 'geo', polyline: true, data: [{ coords: path }], silent: true, zlevel: 3,
        lineStyle: { color: '#fff', width: 0, curveness: 0 },
        effect: { show: true, period: 6, trailLength: 0.18, symbol: 'circle', symbolSize: 3, color: accent(t) } }
    ]);
  };
  B.migration = function (el, d, t) {
    _GEO_EL = el;
    var flows = d.flows || [];
    return geo(t, [{
      type: 'lines', coordinateSystem: 'geo', zlevel: 2,
      data: flows.map(function (f) { return { coords: [f.from, f.to], value: f.value }; }),
      lineStyle: { color: rgba(accent(t), 0.55), width: 1.1, curveness: 0.28 },
      effect: { show: true, period: 5, trailLength: 0.15, symbol: 'circle', symbolSize: 3 }
    }]);
  };
  B.flowMap = function (el, d, t) {
    _GEO_EL = el;
    var flows = d.flows || [];
    return geo(t, [
      { type: 'lines', coordinateSystem: 'geo', data: flows.map(function (f) { return { coords: [f.from, f.to], value: f.value }; }),
        lineStyle: { color: rgba(accent(t), 0.5), width: 1.4, curveness: 0.3 },
        effect: { show: true, period: 5, trailLength: 0.2, symbol: 'circle', symbolSize: 3 } },
      { type: 'effectScatter', coordinateSystem: 'geo', data: (d.hubs || []).map(function (h) { return { name: h.name, value: h.coord }; }),
        symbolSize: 7, rippleEffect: { brushType: 'stroke', scale: 2.6, period: 4 }, itemStyle: { color: ink(t) } }
    ]);
  };
  B.hexMap = function (el, d, t) {
    _GEO_EL = el;
    var pts = d.points || [];
    var max = Math.max.apply(null, pts.map(function (p) { return p.value; }));
    return geo(t, [{
      type: 'scatter', coordinateSystem: 'geo',
      data: pts.map(function (p) { return { name: p.name, value: p.coord.concat(p.value) }; }),
      symbol: 'path://M50,0 L150,0 L200,86.6 L150,173.2 L50,173.2 L0,86.6 Z',
      symbolSize: function (v) { return 12 + (v[2] / max) * 22; },
      itemStyle: { color: rgba(accent(t), 0.5), borderColor: accent(t), borderWidth: 0.8 },
      label: { show: true, position: 'bottom', distance: 2, color: muted(t), fontSize: 8.5, fontFamily: FONT, formatter: function (p) { return p.name; } }
    }]);
  };

  /* ================= 8. 层级与流程 ================= */
  B.tree = function (el, d, t) {
    var W = (el && el.clientWidth) || 700;
    var narrow = W < 520;
    var rp = rampOf(t);
    var tree = JSON.parse(JSON.stringify(d.tree || {}));
    /* 自底向上累计数值（叶子默认给定或按子节点求和） */
    function walk(node, depth) {
      node._d = depth;
      if (node.children && node.children.length) {
        var sum = 0;
        node.children.forEach(function (c) { sum += walk(c, depth + 1); });
        if (node.value === undefined) node.value = sum;
      } else if (node.value === undefined) {
        node.value = 10 + Math.round((node.name || '').length * 6);
      }
      return node.value;
    }
    var total = walk(tree, 0);
    var maxLeaf = 1;
    (function scan(nd) { if (!nd.children) maxLeaf = Math.max(maxLeaf, nd.value || 0); (nd.children || []).forEach(scan); })(tree);
    return base(t, {
      tooltip: tip(t, { formatter: function (p) {
        return '<b>' + p.name + '</b><br/>规模 ' + num(p.value) + '（占 ' + (p.value / total * 100).toFixed(1) + '%）';
      } }),
      series: [{
        type: 'tree', data: [tree], layout: 'orthogonal', orient: 'LR',
        left: narrow ? 62 : 84, right: narrow ? 74 : 116, top: 14, bottom: 14,
        symbol: 'circle',
        symbolSize: function (v, p) {
          var leaf = !p.data.children || !p.data.children.length;
          return leaf ? 4 + Math.sqrt((p.data.value || 0) / maxLeaf) * 9 : 11;
        },
        lineStyle: { color: rgba(ink(t), 0.22), width: 1.2, curveness: 0.5 },
        label: {
          position: 'left', verticalAlign: 'middle', align: 'right',
          color: ink(t), fontSize: narrow ? 9 : 10, fontFamily: FONT, distance: 6,
          formatter: function (p) {
            if (p.data._d === 0) return '{r|' + p.name + '}';
            return p.name;
          },
          rich: { r: { fontSize: narrow ? 10 : 12, fontWeight: 800, color: ink(t), fontFamily: FONT } }
        },
        leaves: {
          label: { position: 'right', align: 'left', distance: 8,
            formatter: function (p) { return p.name + '  {v|' + num(p.value) + '}'; },
            rich: { v: { color: muted(t), fontSize: 9, fontFamily: FONT } } }
        },
        itemStyle: {
          color: function (p) { return rp[Math.min(p.data._d, rp.length - 1)] || seriesColor(t, p.data._d); },
          borderColor: '#FFF', borderWidth: 1.5
        },
        emphasis: { itemStyle: { color: accentOf(t), shadowBlur: 8, shadowColor: 'rgba(5,28,44,.2)' } },
        expandAndCollapse: false, initialTreeDepth: -1
      }]
    });
  };
  B.orgChart = function (el, d, t) {
    return base(t, {
      tooltip: tip(t),
      series: [{
        type: 'tree', data: [d.tree], layout: 'orthogonal', orient: 'TB',
        top: 22, bottom: 26, left: 16, right: 16,
        symbol: 'roundRect', symbolSize: [46, 17],
        lineStyle: { color: rgba(ink(t), 0.2), width: 1, curveness: 0 },
        label: { position: 'inside', color: ink(t), fontSize: 8, fontFamily: FONT },
        itemStyle: { color: '#FFF', borderColor: rgba(ink(t), 0.25), borderWidth: 1 },
        emphasis: { itemStyle: { color: rgba(accent(t), 0.12), borderColor: accent(t) } },
        expandAndCollapse: false, initialTreeDepth: -1
      }]
    });
  };
  B.icicle = function (el, d, t) {
    /* 层级占比横向条：每层一行，长度=占比 */
    var rows = [];
    (function walk(node, depth, start, total) {
      var val = node.value || (node.children || []).reduce(function (a, c) { return a + (c.value || 0); }, 0);
      rows.push({ name: node.name, depth: depth, start: start, value: val, total: total });
      var acc = start;
      (node.children || []).forEach(function (c) { walk(c, depth + 1, acc, total); acc += (c.value || 0); });
    })(d.tree, 0, 0, 100);
    var maxDepth = Math.max.apply(null, rows.map(function (r) { return r.depth; }));
    var series = [];
    for (var dep = 0; dep <= maxDepth; dep++) {
      var items = rows.filter(function (r) { return r.depth === dep && r.value > 0; });
      series.push({
        type: 'bar', stack: 'ic', barWidth: '46%', silent: false,
        data: items.map(function (it) { return { name: it.name, value: [it.start, it.start + it.value] }; }),
        itemStyle: { color: rgba(accent(t), 0.9 - dep * 0.22), borderColor: '#FFF', borderWidth: 1.5 },
        label: { show: true, position: 'inside', color: dep === 0 ? '#FFF' : ink(t), fontSize: 9, fontFamily: FONT,
          formatter: function (p) { var w = p.value[1] - p.value[0]; return (w >= 14 || dep === 0) ? p.name : ''; } },
        labelLayout: { hideOverlap: true }
      });
    }
    return base(t, {
      tooltip: tip(t, { trigger: 'item' }),
      grid: { left: 10, right: 10, top: 10, bottom: 10 },
      xAxis: yAxis(t, { type: 'value', max: 100, show: false, splitLine: { show: false } }),
      yAxis: xAxis(t, { type: 'category', data: ['层级'], show: false }),
      series: series
    });
  };
  B.flowchart = function (el, d, t) {
    var steps = d.steps || [], n = steps.length;
    var W = (el && el.clientWidth) || 640;
    var gap = (W - 40) / Math.max(1, n);
    var nodes = steps.map(function (s, i) {
      var isD = s.type === 'decision';
      return {
        name: s.name, x: 20 + gap * i + gap / 2, y: 1,
        symbol: isD ? 'diamond' : (s.type === 'start' || s.type === 'end' ? 'roundRect' : 'rect'),
        symbolSize: isD ? [Math.min(64, gap * 0.6), 34] : [Math.min(gap * 0.74, 92), 30],
        itemStyle: { color: isD ? rgba(accent(t), 0.14) : '#FFF',
          borderColor: isD ? accent(t) : rgba(ink(t), 0.28), borderWidth: 1 },
        label: { color: ink(t), fontSize: 8, fontFamily: FONT, width: isD ? 40 : 76, overflow: 'break', lineHeight: 9 }
      };
    });
    var links = [];
    for (var i = 0; i < n - 1; i++) links.push({ source: steps[i].name, target: steps[i + 1].name });
    return base(t, {
      tooltip: { show: false },
      series: [{
        type: 'graph', layout: 'none', data: nodes, links: links, roam: false,
        lineStyle: { color: rgba(ink(t), 0.3), width: 1, curveness: 0 },
        edgeSymbol: ['none', 'arrow'], edgeSymbolSize: 6,
        label: { show: true, position: 'inside', color: ink(t), fontSize: 9, fontFamily: FONT }
      }]
    });
  };
  B.swimlane = function (el, d, t) {
    var lanes = d.lanes || [], tasks = d.tasks || [];
    var maxT = Math.max.apply(null, tasks.map(function (x) { return x.start + x.span; }));
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) { return p.name; } }),
      grid: grid({ left: 6, right: 16, top: 12, bottom: 16 }),
      xAxis: yAxis(t, { type: 'value', min: 0, max: maxT, splitLine: { show: true, lineStyle: { color: rule(t) } },
        axisLabel: { color: muted(t), fontSize: 9.5, fontFamily: FONT, formatter: function (v) { return 'T' + v; } } }),
      yAxis: xAxis(t, { data: lanes, axisLabel: { color: ink(t), fontSize: 10.5, fontFamily: FONT } }),
      series: [{
        type: 'custom',
        renderItem: function (params, api) {
          var lane = api.value(0), start = api.value(1), span = api.value(2);
          var p0 = api.coord([start, lane]), p1 = api.coord([start + span, lane]);
          var h = api.size([0, 1])[1] * 0.52;
          var c = seriesColor(t, lane);
          return {
            type: 'group', children: [
              { type: 'rect', shape: { x: p0[0] + 1.5, y: p0[1] - h / 2, width: Math.max(8, p1[0] - p0[0] - 3), height: h, r: 2 },
                style: { fill: rgba(c, 0.85) } },
              { type: 'text', style: { x: p0[0] + 7, y: p0[1], text: (params.data && params.data.name) || tasks[params.dataIndex].name, fill: '#fff', font: '9px ' + FONT, textVerticalAlign: 'middle' } }
            ]
          };
        },
        encode: { x: [1, 2], y: 0 },
        data: tasks.map(function (x) { return { name: x.name, value: [x.lane, x.start, x.span] }; })
      }]
    });
  };

  B.ridge = function (el, d, t) {
    /* 最新一组放最上面 */
    var labels = (d.labels || []).slice().reverse(), groups = (d.groups || []).slice().reverse();
    var all = [].concat.apply([], groups);
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var rows = groups.map(function (g, gi) {
      var pts = kdePts(g, lo, hi, 48);
      var maxD = Math.max.apply(null, pts.map(function (p) { return p[1]; })) || 1;
      return { gi: gi, xs: pts.map(function (p) { return p[0]; }), ys: pts.map(function (p) { return p[1] / maxD; }) };
    });
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return labels[p.value[0]] || ''; } }),
      grid: { left: 52, right: 18, top: 30, bottom: 24 },
      xAxis: yAxis(t, { type: 'value', min: lo, max: hi, splitLine: { show: false },
        axisLabel: { color: muted(t), fontSize: 9.5, fontFamily: FONT } }),
      yAxis: yAxis(t, { type: 'value', min: -0.15, max: groups.length + 0.15, show: false, splitLine: { show: false } }),
      graphic: labels.map(function (lb, i) {
        var topPct = ((i + 0.42) / labels.length) * 100;
        return { type: 'text', left: 4, top: topPct + '%', z: 20,
          style: { text: lb, fill: muted(t), font: '700 9.5px ' + FONT } };
      }),
      series: [{
        type: 'custom',
        renderItem: function (params, api) {
          var row = rows[params.dataIndex];
          var baseY = groups.length - 1 - row.gi;
          var pts = [];
          for (var i = 0; i < row.xs.length; i++) {
            var p = api.coord([row.xs[i], baseY + row.ys[i] * 0.95]);
            pts.push([p[0], p[1]]);
          }
          var bottomRight = api.coord([row.xs[row.xs.length - 1], baseY]);
          var bottomLeft = api.coord([row.xs[0], baseY]);
          pts.push([bottomRight[0], bottomRight[1]]);
          pts.push([bottomLeft[0], bottomLeft[1]]);
          var c = seriesColor(t, row.gi);
          return { type: 'polygon', shape: { points: pts },
            style: { fill: rgba(c, 0.30), stroke: rgba(c, 0.95), lineWidth: 1.1 },
            emphasis: { style: { fill: rgba(c, 0.45) } } };
        },
        data: rows.map(function (r) { return { value: [r.gi] }; })
      }]
    });
  };

  B.ecdf = function (el, d, t) {
    var s = (d.samples || []).slice().sort(function (a, b) { return a - b; });
    var n = s.length;
    var ecdf = s.map(function (v, i) { return [v, (i + 1) / n * 100]; });
    return base(t, {
      tooltip: tip(t, { trigger: 'axis' }),
      grid: grid({ left: 6, right: 24, top: 16, bottom: 20 }),
      xAxis: yAxis(t, { type: 'value', scale: true, splitLine: { show: false },
        name: 'sample', nameLocation: 'end', nameGap: 6, nameTextStyle: { color: muted(t), fontSize: 9.5, fontFamily: FONT, align: 'right' } }),
      yAxis: yAxis(t, { type: 'value', max: 100, axisLabel: { color: muted(t), fontSize: 10, fontFamily: FONT, formatter: '{value}%' } }),
      series: [
        { type: 'line', data: ecdf, showSymbol: false, step: 'end', silent: false,
          lineStyle: { color: ink(t), width: 2 }, areaStyle: { color: rgba(ink(t), 0.05) } },
        { type: 'line', data: [[s[0], 0], [s[Math.floor(n / 2)], 50], [s[n - 1], 100]], showSymbol: false,
          lineStyle: { color: rgba(accent(t), 0.9), type: 'dashed', width: 1.2 }, silent: true }
      ]
    });
  };

  B.matrixHeat = function (el, d, t) {
    var names = d.names, m = d.matrix;
    var cells = [];
    for (var i = 0; i < names.length; i++) for (var j = 0; j < names.length; j++) cells.push([j, i, Math.round(m[i][j] * 100) / 100]);
    var vals = cells.map(function (c) { return c[2]; });
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return names[p.value[1]] + ' · ' + names[p.value[0]] + '<br/>' + num(p.value[2]); } }),
      grid: { left: 6, right: 14, top: 14, bottom: 16, containLabel: true },
      xAxis: xAxis(t, { data: names, axisLabel: { color: muted(t), fontSize: 9, fontFamily: FONT, interval: 0 } }),
      yAxis: xAxis(t, { data: names, axisLabel: { color: muted(t), fontSize: 9, fontFamily: FONT } }),
      visualMap: { min: Math.min.apply(null, vals), max: Math.max.apply(null, vals), show: false,
        inRange: { color: [rgba(ink(t), 0.04), rgba(accent(t), 0.35), accent(t)] } },
      series: [{ type: 'heatmap', data: cells, itemStyle: { borderColor: '#FFFFFF', borderWidth: 2 },
        label: { show: true, color: ink(t), fontSize: 9, fontFamily: FONT,
          formatter: function (p) { return p.value[2] >= 10 ? Math.round(p.value[2]) : p.value[2].toFixed(1); } } }]
    });
  };

  /* ================= 5. 关系与相关 ================= */
  B.scatter = function (el, d, t) {
    var pts = d.points || [];
    var series = [{
      type: 'scatter', data: pts, symbolSize: 7,
      itemStyle: { color: rgba(seriesColor(t, 0), 0.55), borderColor: rgba(seriesColor(t, 0), 0.95), borderWidth: 0.6 },
      emphasis: { itemStyle: { color: seriesColor(t, 0) } }
    }];
    var fitEls = [];
    if (d.fit && pts.length > 3) {
      var n = pts.length, sx = 0, sy = 0, sxx = 0, sxy = 0, syy = 0;
      pts.forEach(function (p) { sx += p[0]; sy += p[1]; sxx += p[0] * p[0]; sxy += p[0] * p[1]; syy += p[1] * p[1]; });
      var den = n * sxx - sx * sx;
      if (den) {
        var k = (n * sxy - sx * sy) / den;
        var b = (sy - k * sx) / n;
        var r = (n * sxy - sx * sy) / Math.sqrt((n * sxx - sx * sx) * (n * syy - sy * sy));
        var xs = pts.map(function (p) { return p[0]; });
        var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
        series.push({
          type: 'line', data: [[x0, k * x0 + b], [x1, k * x1 + b]], showSymbol: false, silent: true, z: 5,
          lineStyle: { color: accentOf(t), width: 1.8, type: 'dashed' },
          endLabel: { show: false }
        });
        var r2 = r * r;
        fitEls.push({ type: 'text', right: 14, top: 6, z: 10,
          style: { text: 'y = ' + k.toFixed(2) + 'x ' + (b >= 0 ? '+ ' : '− ') + Math.abs(b).toFixed(1) +
            '　R² = ' + r2.toFixed(3) + '　r = ' + r.toFixed(2),
            fill: accentOf(t), font: '800 10px ' + FONT,
            backgroundColor: (t && t._dark) ? 'rgba(22,24,30,.9)' : 'rgba(255,255,255,.86)', padding: [4, 8], borderRadius: 4 } });
      }
    }
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) {
        if (p.seriesType === 'line') return '';
        return d.xName + ' ' + num(p.value[0]) + '<br/>' + d.yName + ' ' + num(p.value[1]);
      } }),
      graphic: fitEls,
      grid: grid({ left: 6, right: 24, top: 30, bottom: 26 }),
      xAxis: yAxis(t, { type: 'value', scale: true, splitLine: { show: false },
        name: d.xName, nameLocation: 'middle', nameGap: 26, nameTextStyle: { color: muted(t), fontSize: 10, fontFamily: FONT } }),
      yAxis: yAxis(t, { type: 'value', scale: true, name: d.yName, nameTextStyle: { color: muted(t), fontSize: 10, fontFamily: FONT } }),
      series: series
    });
  };

  B.bubble = function (el, d, t) {
    var maxS = Math.max.apply(null, d.data.map(function (x) { return x.size; }));
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return p.name + '<br/>' + d.xName + ' ' + p.value[0] + '<br/>' + d.yName + ' ' + p.value[1]; } }),
      grid: grid({ left: 6, right: 24, top: 18, bottom: 24 }),
      xAxis: yAxis(t, { type: 'value', scale: true, splitLine: { show: false },
        name: d.xName, nameLocation: 'middle', nameGap: 24, nameTextStyle: { color: muted(t), fontSize: 10, fontFamily: FONT } }),
      yAxis: yAxis(t, { type: 'value', scale: true, name: d.yName, nameTextStyle: { color: muted(t), fontSize: 10, fontFamily: FONT } }),
      series: [{
        type: 'scatter',
        data: d.data.map(function (x, i) { return { name: x.name, value: [x.x, x.y], symbolSize: 12 + Math.sqrt(x.size / maxS) * 26, itemStyle: { color: rgba(seriesColor(t, i), 0.55), borderColor: seriesColor(t, i), borderWidth: 0.8 } }; }),
        label: { show: true, position: 'inside', color: '#fff', fontSize: 9, fontFamily: FONT, formatter: '{b}' }
      }]
    });
  };


  /* ---------- 配色模板 → 相关性发散色（负=蓝/正=红金） ---------- */
  function divergingOf(t) {
    var ps = (window.ADV_PALETTES || []).filter(function (x) { return x.id === ((t && t.paletteId) || 'consult'); })[0] || {};
    var neg = corrNeg(t);   // 负相关 = 冷色
    var pos = corrPos(t);   // 正相关 = 暖色
    var mid = (t && t._dark) ? '#1A1B20' : '#F6F1E7';
    return [neg, mixHex(neg, mid, 0.62), mixHex(neg, mid, 0.3), mid,
      mixHex(pos, mid, 0.3), mixHex(pos, mid, 0.62), pos];
  }
  function corrPos(t) {
    if (t && t._dark) return t.accent || '#E2B96B';
    var ps = (window.ADV_PALETTES || []).filter(function (x) { return x.id === ((t && t.paletteId) || 'consult'); })[0] || {};
    if (ps.id === 'contrast') return '#C0392B';
    if (ps.id === 'burgundy') return '#8C3A2E';
    if (ps.id === 'forest') return '#8A6A2F';
    return ps.down || '#B5484B';
  }
  function corrNeg(t) {
    if (t && t._dark) return (t.series && t.series[1]) || '#7FA3C4';
    var ps = (window.ADV_PALETTES || []).filter(function (x) { return x.id === ((t && t.paletteId) || 'consult'); })[0] || {};
    if (ps.id === 'contrast') return '#0B3C5D';
    if (ps.id === 'burgundy') return '#4A6E8A';
    if (ps.id === 'forest') return '#3E6B7A';
    return (ps.colors && ps.colors[1]) || '#1B4B72';
  }
  function mixHex(a, b, t) {
    function h2r(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
    var A = h2r(a), B = h2r(b);
    var o = A.map(function (v, i) { return Math.round(v + (B[i] - v) * t); });
    return '#' + o.map(function (v) { return ('0' + v.toString(16)).slice(-2); }).join('');
  }

  /* ---------- 相关性热力矩阵（发散色 + 数值 + 上下三角） ---------- */
  B.corrMatrix = function (el, d, t) {
    var names = d.names || [], M = d.matrix || [];
    var n = names.length;
    var W = (el && el.clientWidth) || 600, H = (el && el.clientHeight) || 300;
    var narrow = W < 480;
    var cells = [];
    var minR = 1, maxR = -1;
    for (var i = 0; i < n; i++) for (var j = 0; j < n; j++) {
      var v = M[i][j];
      if (i === j) continue;
      minR = Math.min(minR, v); maxR = Math.max(maxR, v);
    }
    for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) {
      cells.push([b, a, M[a][b]]);
    }
    return base(t, {
      tooltip: tip(t, { formatter: function (p) {
        return '<b>' + names[p.value[1]] + ' × ' + names[p.value[0]] + '</b><br/>相关系数 ' + p.value[2].toFixed(2);
      } }),
      grid: { left: narrow ? 74 : 92, right: narrow ? 40 : 62, top: narrow ? 54 : 58, bottom: 10 },
      xAxis: { type: 'category', data: names, position: 'top', splitArea: { show: false },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: muted(t), fontSize: narrow ? 7 : 7.5, fontFamily: FONT, rotate: 0,
          margin: 7, interval: 0, width: narrow ? 40 : 52, overflow: 'break', lineHeight: 9 } },
      yAxis: { type: 'category', data: names, inverse: true,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: muted(t), fontSize: narrow ? 8 : 9, fontFamily: FONT,
          interval: 0, width: 74, overflow: 'truncate' } },
      visualMap: {
        min: -1, max: 1, orient: 'vertical', right: 4, top: 'center', itemWidth: 10, itemHeight: narrow ? 80 : 120,
        calculable: false, text: ['+1', '-1'], textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT },
        inRange: { color: divergingOf(t) }
      },
      series: [{
        type: 'heatmap', data: cells,
        label: { show: true, color: ink(t), fontSize: n > 8 ? 8 : 9.5, fontFamily: FONT,
          formatter: function (p) { return Math.abs(p.value[2]) >= 0.995 ? '1' : p.value[2].toFixed(2); } },
        itemStyle: { borderColor: '#FFFFFF', borderWidth: 1.5, borderRadius: 2 },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(5,28,44,.25)', borderColor: ink(t) } }
      }]
    });
  };

  /* ---------- 关联网络 + 热力矩阵（案例组合形态） ---------- */
  B.corrNetwork = function (el, d, t) {
    var names = d.names || [], M = d.matrix || [];
    var n = names.length;
    var W = (el && el.clientWidth) || 900;
    var narrow = W < 620;
    /* 节点圆环布局（左半区，坐标 0..1） */
    var nodes = names.map(function (nm, i) {
      var ang = -Math.PI / 2 + i * (2 * Math.PI / n);
      return { name: nm, x: 0.5 + Math.cos(ang) * 0.46, y: 0.5 + Math.sin(ang) * 0.46,
        symbolSize: 9, value: Math.round((1 + i) * 10) };
    });
    var links = [];
    var strongPos = null, strongNeg = null;
    for (var i = 0; i < n; i++) for (var j = i + 1; j < n; j++) {
      var r = M[i][j];
      if (Math.abs(r) < (narrow ? 0.42 : 0.22)) continue;
      links.push({ source: names[i], target: names[j], value: Math.abs(r), sign: r > 0 ? 1 : -1,
        lineStyle: { color: r > 0 ? corrPos(t) : corrNeg(t), opacity: Math.min(0.92, 0.25 + Math.abs(r) * 0.9),
          width: 0.8 + Math.abs(r) * 5, curveness: 0.16 } });
      if (r > 0 && (!strongPos || r > strongPos.r)) strongPos = { a: names[i], b: names[j], r: r };
      if (r < 0 && (!strongNeg || r < strongNeg.r)) strongNeg = { a: names[i], b: names[j], r: r };
    }
    var cells = [];
    for (var a = 0; a < n; a++) for (var b = 0; b < n; b++) cells.push([b, a, M[a][b]]);
    var padTop = 76;
    /* 卡片小尺寸：只画网络（矩阵点开大图看），避免两图挤压重叠 */
    if (narrow) {
      var linksS = [];
      for (var si = 0; si < n; si++) for (var sj = si + 1; sj < n; sj++) {
        var rr = M[si][sj];
        if (Math.abs(rr) < 0.25) continue;
        linksS.push({ source: names[si], target: names[sj], value: Math.abs(rr), sign: rr > 0 ? 1 : -1,
          lineStyle: { color: rr > 0 ? corrPos(t) : corrNeg(t),
            opacity: Math.min(0.95, 0.35 + Math.abs(rr) * 0.9), width: 1 + Math.abs(rr) * 5.5, curveness: 0.14 } });
      }
      nodes = nodes.map(function (nd) { nd.x = 0.5 + (nd.x - 0.5) * 0.92; nd.y = 0.5 + (nd.y - 0.5) * 0.92; return nd; });
      return base(t, {
        tooltip: tip(t, { formatter: function (p) {
          if (p.dataType === 'edge') return '<b>' + p.data.source + ' — ' + p.data.target + '</b><br/>相关 ' + (p.data.sign > 0 ? '+' : '') + p.data.value.toFixed(2);
          if (p.seriesType === 'graph') return '<b>' + p.name + '</b>';
          return '';
        } }),
        title: [{ text: '关联网络', left: 2, top: 2, textStyle: { color: muted(t), fontSize: 9.5, fontWeight: 700, fontFamily: FONT } }],
        series: [{
          type: 'graph', layout: 'none', left: 6, top: 16, width: '96%', height: '90%',
          roam: false, draggable: false,
          data: nodes.map(function (nd, i) {
            return { name: nd.name, x: nd.x, y: nd.y, symbolSize: 9,
              itemStyle: { color: seriesColor(t, i), borderColor: '#fff', borderWidth: 1.5 },
              label: { show: true, position: nd.x > 0.52 ? 'left' : 'right', fontSize: 7.5,
                fontFamily: FONT, color: ink(t), distance: 4,
                formatter: nd.name.length > 5 ? nd.name.slice(0, 4) + '…' : nd.name } };
          }),
          links: linksS, lineStyle: { curveness: 0.14 },
          emphasis: { focus: 'adjacency' }
        }]
      });
    }
    return base(t, {
      tooltip: tip(t, { formatter: function (p) {
        if (p.seriesType === 'graph' && p.dataType === 'edge') {
          return '<b>' + p.data.source + ' — ' + p.data.target + '</b><br/>相关系数 ' + (p.data.sign > 0 ? '+' : '-') + p.data.value.toFixed(2);
        }
        if (p.seriesType === 'graph') return '<b>' + p.name + '</b>';
        if (p.seriesType === 'heatmap') return '<b>' + names[p.value[1]] + ' × ' + names[p.value[0]] + '</b><br/>' + p.value[2].toFixed(2);
        return '';
      } }),
      graphic: (function () {
        var up = corrPos(t), dn = corrNeg(t);
        var gx = 8;
        return [
          { type: 'text', left: gx, top: 22, z: 20, style: { text: '连线', fill: muted(t), font: '600 8.5px ' + FONT } },
          { type: 'line', left: gx + 30, top: 27, z: 20, shape: { x1: 0, y1: 0, x2: 16, y2: 0 }, style: { stroke: up, lineWidth: 2.6 } },
          { type: 'text', left: gx + 50, top: 22, z: 20, style: { text: '正相关', fill: ink(t), font: '8px ' + FONT } },
          { type: 'line', left: gx + 30, top: 40, z: 20, shape: { x1: 0, y1: 0, x2: 16, y2: 0 }, style: { stroke: dn, lineWidth: 2.6 } },
          { type: 'text', left: gx + 50, top: 35, z: 20, style: { text: '负相关', fill: ink(t), font: '8px ' + FONT } },
          { type: 'text', left: gx, top: 52, z: 20, style: { text: '粗细 = |相关系数|', fill: muted(t), font: '8px ' + FONT } }
        ];
      })(),
      title: [
        { text: '相关性网络', left: '1%', top: 2, textStyle: { color: muted(t), fontSize: 10, fontWeight: 700, fontFamily: FONT } },
        { text: '相关性矩阵（日收益率 · 红色为正 · 蓝色为负）', left: narrow ? '1%' : '38%', top: 2,
          textStyle: { color: muted(t), fontSize: 10, fontWeight: 700, fontFamily: FONT } },
        { text: (strongPos ? '最强正相关 ' + strongPos.a + ' × ' + strongPos.b + '  +' + strongPos.r.toFixed(2) : '') +
                (strongNeg ? '　｜　最强负相关 ' + strongNeg.a + ' × ' + strongNeg.b + '  ' + strongNeg.r.toFixed(2) : ''),
          left: '1%', bottom: 2, textStyle: { color: rgba(ink(t), 0.55), fontSize: 9, fontFamily: FONT } }
      ],
      grid: { left: narrow ? '44%' : '46%', right: narrow ? 56 : 70, top: 104, bottom: 34 },
      xAxis: { type: 'category', data: names, position: 'top', splitArea: { show: false },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: muted(t), fontSize: 7.5, fontFamily: FONT, rotate: 90, interval: 0, margin: 8 } },
      yAxis: { type: 'category', data: names, inverse: true, splitArea: { show: false },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: muted(t), fontSize: 7.5, fontFamily: FONT, interval: 0, width: 60, overflow: 'truncate' } },
      visualMap: { min: -1, max: 1, orient: 'vertical', right: 2, top: 'center', itemWidth: 8, itemHeight: 70,
        calculable: false, text: ['+1', '-1'], textStyle: { color: muted(t), fontSize: 8, fontFamily: FONT },
        inRange: { color: divergingOf(t) } },
      series: [
        { type: 'graph', layout: 'none', left: 4, top: 46, width: narrow ? '40%' : '42%', height: '74%',
          coordinateSystem: null, roam: false, draggable: false,
          data: nodes.map(function (nd, i) {
            return { name: nd.name, x: nd.x, y: nd.y, symbolSize: 9 + (i % 3) * 2,
              itemStyle: { color: seriesColor(t, i) },
              label: { show: true, position: nd.x > 0.52 ? 'left' : 'right', fontSize: 8, fontFamily: FONT,
                color: ink(t), distance: 5,
                formatter: nd.name.length > 6 ? nd.name.slice(0, 5) + '…' : nd.name } };
          }),
          links: links,
          lineStyle: { curveness: 0.16 },
          emphasis: { focus: 'adjacency', lineStyle: { width: 4 } },
          label: { show: true } },
        { type: 'heatmap', data: cells,
          itemStyle: { borderColor: '#FFFFFF', borderWidth: 1, borderRadius: 1.5 },
          label: { show: !narrow && W >= 760, color: ink(t), fontSize: 7, fontFamily: FONT,
            formatter: function (p) { var v = p.value[2]; return Math.abs(v) >= 0.995 ? '1' : v.toFixed(2); } } }
      ]
    });
  };

  B.venn = function (el, d, t) {
    var W = (el && el.clientWidth) || 640, H = (el && el.clientHeight) || 190;
    var R = Math.min(W * 0.17, H * 0.30);
    var cx = W / 2, cy = H / 2 + 2;
    var sets = (d.sets || []).slice(0, 3);
    var centers = [[cx - R * 0.52, cy - R * 0.34], [cx + R * 0.52, cy - R * 0.34], [cx, cy + R * 0.58]];
    var els = [];
    sets.forEach(function (s, i) {
      els.push({ type: 'circle', shape: { cx: centers[i][0], cy: centers[i][1], r: R },
        style: { fill: rgba(seriesColor(t, i), 0.22), stroke: seriesColor(t, i), lineWidth: 1.1 }, silent: true });
    });
    sets.forEach(function (s, i) {
      var ly = i < 2 ? centers[i][1] - R - 4 : centers[i][1] + R + 4;
      els.push({ type: 'text', left: Math.round(centers[i][0] - s.name.length * 5), top: Math.round(ly),
        style: { text: s.name + '  ' + s.value, fill: ink(t), font: '600 10.5px ' + FONT } });
    });
    els.push({ type: 'text', left: cx - 10, top: cy - R * 0.55, style: { text: String(d.overlapAB || ''), fill: ink(t), font: '700 10px ' + FONT } });
    els.push({ type: 'text', left: cx - 6, top: cy + R * 0.18, style: { text: String(d.overlapAll || ''), fill: ink(t), font: '700 10px ' + FONT } });
    return base(t, { tooltip: { show: false }, graphic: els });
  };

  B.arc = function (el, d, t) {
    var nodes = (d.nodes || []).map(function (n, i) { return { name: n, x: i * 100, y: 0, symbolSize: 8, itemStyle: { color: ink(t) } }; });
    var links = (d.links || []).map(function (l) {
      return { source: l[0], target: l[1], lineStyle: { color: rgba(accent(t), 0.55), width: 1.4, curveness: 0.6 } };
    });
    return base(t, {
      tooltip: tip(t),
      series: [{
        type: 'graph', layout: 'none', data: nodes, links: links, roam: false,
        symbol: 'circle', symbolSize: 8,
        lineStyle: { color: rgba(accent(t), 0.5), curveness: 0.6, width: 1.3 },
        label: { show: true, position: 'bottom', distance: 8, color: muted(t), fontSize: 10, fontFamily: FONT },
        itemStyle: { color: ink(t), borderColor: '#FFF', borderWidth: 1.5 },
        top: '30%', bottom: '30%', left: 26, right: 26
      }]
    });
  };

  /* ================= 6. 流动与转化 ================= */
  /* ---------- 转化漏斗（顶刊/路演风格：阶段流失 + 转化率桥接） ---------- */
  B.funnel = function (el, d, t) {
    var steps = d.steps || [];
    var W = (el && el.clientWidth) || 600;
    var narrow = W < 480;
    var first = steps[0] ? steps[0].value : 1;
    var rp = rampOf(t);
    var last = steps.length ? steps[steps.length - 1].value : 0;
    var losses = steps.map(function (s, i) {
      if (!i) return null;
      return steps[i - 1].value - s.value;
    });
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) {
        var i = p.dataIndex, prev = i > 0 ? steps[i - 1].value : p.value;
        return '<b>' + p.name + '</b><br/>' + num(p.value) + '（占总量 ' + (p.value / first * 100).toFixed(1) + '%）' +
          (i > 0 ? '<br/>本环节转化 ' + (p.value / prev * 100).toFixed(1) + '%　流失 ' + num(prev - p.value) : '');
      } }),
      title: [
        { text: '整体转化率', left: 12, top: 2,
          textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT, fontWeight: 400 } },
        { text: (last / first * 100).toFixed(1) + '%', left: 12, top: 14,
          textStyle: { color: ink(t), fontSize: narrow ? 16 : 20, fontFamily: FONT, fontWeight: 800 } },
        { text: steps.length + ' 个环节 · 首环节 ' + num(first), left: 12, top: narrow ? 34 : 40,
          textStyle: { color: rgba(ink(t), 0.45), fontSize: 9, fontFamily: FONT } }
      ],
      series: [{
        type: 'funnel', left: narrow ? '16%' : '22%', right: narrow ? '34%' : '38%',
        top: narrow ? 16 : 20, bottom: 18,
        minSize: '20%', maxSize: '100%', sort: 'descending', gap: 5,
        itemStyle: { borderWidth: 0, borderRadius: 2 },
        label: { show: true, position: 'right', color: ink(t), fontFamily: FONT, lineHeight: 14, distance: 8,
          formatter: function (p) {
            var i = p.dataIndex;
            var prev = i > 0 ? steps[i - 1].value : p.value;
            var rate = prev ? (p.value / prev * 100) : 100;
            return '{n|' + p.name + '} {v|' + num(p.value) + '}' + (i > 0 ? ' {d|↓' + rate.toFixed(0) + '%}' : '');
          },
          rich: { n: { fontSize: narrow ? 9 : 10.5, fontWeight: 700, color: ink(t), fontFamily: FONT },
                  v: { fontSize: narrow ? 9 : 10.5, color: rgba(ink(t), 0.62), fontFamily: FONT },
                  d: { fontSize: narrow ? 8 : 9.5, color: (t.down || '#C0392B'), fontFamily: FONT } } },
        /* 阶段名 + 流失量放在左侧（用 labelLine 引出） */
        data: steps.map(function (s, i) {
          var c = rp[Math.min(i + 1, rp.length - 1)] || seriesColor(t, i);
          return { name: s.name, value: s.value, itemStyle: { color: c },
            label: { show: true },
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(5,28,44,.2)' } } };
        }),
        labelLine: { show: true, length: 6, length2: 8, lineStyle: { color: rgba(ink(t), 0.25) } }
      }]
    });
  };

  /* ---------- 桑基图（顶刊风格：列标题 + 数值标签 + 大流量标注） ---------- */
  B.sankey = function (el, d, t) {
    var nodes = (d.nodes || []).map(function (n) { return { name: n.name }; });
    var links = (d.links || []).map(function (l) {
      return { source: l.source, target: l.target, value: l.value };
    });
    var W = (el && el.clientWidth) || 700;
    var narrow = W < 520;
    var total = 0;
    nodes.forEach(function (n) {
      var out = 0, inn = 0;
      links.forEach(function (l) { if (l.source === n.name) out += l.value; if (l.target === n.name) inn += l.value; });
      total = Math.max(total, out, inn);
    });
    var sumIn = 0, sumOut = 0;
    nodes.forEach(function (n) {
      var hasIn = links.some(function (l) { return l.target === n.name; });
      var hasOut = links.some(function (l) { return l.source === n.name; });
      if (!hasIn) sumIn += links.filter(function (l) { return l.source === n.name; }).reduce(function (a, b) { return a + b.value; }, 0);
      if (!hasOut) sumOut += links.filter(function (l) { return l.target === n.name; }).reduce(function (a, b) { return a + b.value; }, 0);
    });
    var palette = rampOf(t);
    function nodeColor(name, i) {
      var idx = nodes.findIndex(function (x) { return x.name === name; });
      return seriesColor(t, idx % 6);
    }
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) {
        if (p.dataType === 'edge') return p.data.source + ' → ' + p.data.target + '<br/>' + num(p.data.value);
        return '<b>' + p.name + '</b>';
      } }),
      title: [
        { text: '来源', left: '10%', top: 4, textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT, fontWeight: 600 } },
        { text: '渠道', left: '50%', top: 4, textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT, fontWeight: 600 } },
        { text: '结果', right: '10%', top: 4, textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT, fontWeight: 600 } },
        { text: '总流入 ' + num(sumIn) + '　总产出 ' + num(sumOut), left: '2%', bottom: 2,
          textStyle: { color: rgba(ink(t), 0.45), fontSize: 9, fontFamily: FONT } }
      ],
      series: [{
        type: 'sankey', left: 10, right: 10, top: 30, bottom: 26,
        nodeWidth: narrow ? 8 : 11, nodeGap: narrow ? 8 : 12,
        draggable: false, focusNodeAdjacency: 'allEdges',
        emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'source', curveness: 0.5, opacity: 0.32 },
        itemStyle: { borderWidth: 0, borderRadius: 2 },
        label: {
          color: ink(t), fontSize: narrow ? 8 : 9.5, fontFamily: FONT, fontWeight: 600,
          formatter: function (p) { return p.name; }
        },
        data: (function () {
          /* 计算每个节点所在列：无入边=第 1 列，无出边=最后一列 */
          var depth = {};
          nodes.forEach(function (n) {
            var hasIn = links.some(function (l) { return l.target === n.name; });
            var hasOut = links.some(function (l) { return l.source === n.name; });
            depth[n.name] = !hasIn ? 0 : (!hasOut ? 2 : 1);
          });
          return nodes.map(function (n, i) {
            return { name: n.name, itemStyle: { color: seriesColor(t, i) },
              label: { position: depth[n.name] === 2 ? 'left' : 'right',
                color: depth[n.name] === 1 ? rgba(ink(t), 0.72) : ink(t) } };
          });
        })(),
        links: links.map(function (l) {
          return { source: l.source, target: l.target, value: l.value,
            lineStyle: { opacity: 0.28 + Math.min(0.5, l.value / (total || 1) * 1.4) } };
        })
      }]
    });
  };

  B.chord = function (el, d, t) {
    var W = (el && el.clientWidth) || 600;
    var narrow = W < 480;
    var names = d.names, m = d.matrix;
    var nodes = names.map(function (n, i) { return { name: n, symbolSize: 9, itemStyle: { color: seriesColor(t, i) }, label: { color: ink(t), fontSize: 10, fontFamily: FONT } }; });
    var links = [];
    for (var i = 0; i < names.length; i++) for (var j = i + 1; j < names.length; j++) {
      var v = m[i][j] + m[j][i];
      if (v > 0) links.push({ source: names[i], target: names[j], value: v,
        lineStyle: { color: rgba(seriesColor(t, i), 0.35), width: Math.max(0.8, v / 7), curveness: 0.45, opacity: 0.5 } });
    }
    return base(t, {
      tooltip: tip(t),
      series: [{
        type: 'graph', layout: 'circular', circular: { rotateLabel: !narrow },
        data: nodes, links: links, roam: false, symbolSize: 9,
        lineStyle: { curveness: 0.45, opacity: 0.5 },
        label: { show: true, position: 'right', color: ink(t), fontSize: narrow ? 8 : 10, fontFamily: FONT },
        itemStyle: { borderColor: '#FFF', borderWidth: 1.5 },
        top: narrow ? 30 : 26, bottom: narrow ? 30 : 26
      }]
    });
  };

  /* ================= 7. 地理空间 ================= */
  var _GEO_EL = null;
  function geo(t, series, extra) {
    return base(t, Object.assign({
      tooltip: tip(t),
      geo: {
        map: 'world', roam: true,
        zoom: ((_GEO_EL && _GEO_EL.clientWidth) || 600) < 480 ? 1.5 : 1.1,
        center: [18, 18],
        itemStyle: { areaColor: rgba(ink(t), 0.045), borderColor: rgba(ink(t), 0.13), borderWidth: 0.4 },
        emphasis: { itemStyle: { areaColor: rgba(accent(t), 0.16) }, label: { show: false } },
        select: { itemStyle: { areaColor: rgba(accent(t), 0.16) } }
      },
      series: series
    }, extra || {}));
  }
  B.choropleth = function (el, d, t) {
    _GEO_EL = el;
    var W = (el && el.clientWidth) || 700;
    var narrow = W < 520;
    var vals = [
      { name: 'China', value: 5.2, cn: '中国' }, { name: 'United States', value: 2.8, cn: '美国' },
      { name: 'Germany', value: 1.6, cn: '德国' }, { name: 'Japan', value: 1.2, cn: '日本' },
      { name: 'India', value: 6.8, cn: '印度' }, { name: 'Brazil', value: 2.9, cn: '巴西' },
      { name: 'United Kingdom', value: 1.4, cn: '英国' }, { name: 'France', value: 1.1, cn: '法国' },
      { name: 'Canada', value: 2.0, cn: '加拿大' }, { name: 'Australia', value: 2.4, cn: '澳大利亚' },
      { name: 'Russia', value: 1.3, cn: '俄罗斯' }, { name: 'Indonesia', value: 5.0, cn: '印尼' },
      { name: 'Mexico', value: 2.6, cn: '墨西哥' }, { name: 'Saudi Arabia', value: 3.9, cn: '沙特' },
      { name: 'South Africa', value: 0.9, cn: '南非' }, { name: 'Nigeria', value: 3.1, cn: '尼日利亚' },
      { name: 'Egypt', value: 4.2, cn: '埃及' }, { name: 'Argentina', value: -1.2, cn: '阿根廷' },
      { name: 'South Korea', value: 2.2, cn: '韩国' }, { name: 'Italy', value: 0.8, cn: '意大利' }
    ];
    var top = vals.slice().sort(function (a, b) { return b.value - a.value; }).slice(0, 5);
    var rp = rampOf(t);
    var opt = geo(t, [{
      type: 'map', map: 'world', roam: true, zoom: narrow ? 1.35 : 1.1, nameProperty: 'name',
      itemStyle: { areaColor: rgba(ink(t), 0.035), borderColor: rgba(ink(t), 0.10), borderWidth: 0.4 },
      emphasis: { itemStyle: { areaColor: rgba(accent(t), 0.28) }, label: { show: true, color: ink(t), fontSize: 10, fontFamily: FONT } },
      label: { show: false }, data: vals
    }]);
    opt.visualMap = {
      min: -2, max: 7, left: 10, bottom: 10, orient: 'horizontal', itemWidth: 10, itemHeight: narrow ? 76 : 110,
      text: ['高', '低'], calculable: false,
      textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT },
      inRange: { color: [rgba(rp[2] || '#A8C4D8', 0.35), rgba(rp[2] || '#A8C4D8', 0.7), rp[1] || '#1B4B72', rp[0] || '#051C2C'] }
    };
    opt.title = [
      { text: d.metric || '人均 GDP（万元）', left: 14, top: 8,
        textStyle: { color: ink(t), fontSize: 11.5, fontFamily: FONT, fontWeight: 700 } },
      { text: '前 5 名 · ' + top.map(function (x) { return x.cn + ' ' + x.value; }).join('　'),
        left: 14, top: 26, textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT } }
    ];
    return opt;
  };
  B.symbolMap = function (el, d, t) {
    _GEO_EL = el;
    var pts = d.points || [];
    var max = Math.max.apply(null, pts.map(function (p) { return p.value; }));
    return geo(t, [{
      type: 'scatter', coordinateSystem: 'geo',
      data: pts.map(function (p) { return { name: p.name, value: p.coord.concat(p.value) }; }),
      symbolSize: function (v) { return 6 + Math.sqrt(v[2] / max) * 20; },
      itemStyle: { color: rgba(accent(t), 0.55), borderColor: accent(t), borderWidth: 0.8 },
      label: { show: true, position: 'right', distance: 4, color: muted(t), fontSize: 9, fontFamily: FONT, formatter: function (p) { return p.name; } }
    }]);
  };
  B.heatMapGeo = function (el, d, t) {
    _GEO_EL = el;
    var W = (el && el.clientWidth) || 700;
    var narrow = W < 520;
    var hubs = [
      { n: '上海', c: [121.47, 31.23], v: 96 }, { n: '纽约', c: [-74.01, 40.71], v: 88 },
      { n: '伦敦', c: [-0.13, 51.51], v: 74 }, { n: '东京', c: [139.69, 35.69], v: 68 },
      { n: '新加坡', c: [103.82, 1.35], v: 46 }, { n: '迪拜', c: [55.27, 25.20], v: 38 },
      { n: '悉尼', c: [151.21, -33.87], v: 29 }, { n: '圣保罗', c: [-46.63, -23.55], v: 24 },
      { n: '孟买', c: [72.88, 19.08], v: 33 }, { n: '法兰克福', c: [8.68, 50.11], v: 27 }
    ];
    var max = Math.max.apply(null, hubs.map(function (h) { return h.v; }));
    var acc = accentOf(t);
    var opt = geo(t, [{
      type: 'effectScatter', coordinateSystem: 'geo', zlevel: 2,
      rippleEffect: { brushType: 'stroke', scale: 2.6, period: 4 },
      symbolSize: function (v) { return 8 + Math.sqrt(v[2] / max) * (narrow ? 16 : 24); },
      itemStyle: { color: rgba(acc, 0.55), borderColor: rgba(acc, 0.9), borderWidth: 1 },
      label: { show: true, distance: 7, color: ink(t),
        fontSize: narrow ? 8 : 9, fontFamily: FONT, fontWeight: 700,
        position: function (p) { return p.value[0] < 40 ? 'left' : 'right'; },
        formatter: function (p) { return p.value[2] >= 30 ? p.name + ' ' + p.value[2] : ''; } },
      data: hubs.map(function (h) { return { name: h.n, value: h.c.concat(h.v) }; })
    }, {
      /* 热点下方加一层静态光晕，强化密度感 */
      type: 'scatter', coordinateSystem: 'geo', zlevel: 1, silent: true,
      symbolSize: function (v) { return 16 + Math.sqrt(v[2] / max) * (narrow ? 28 : 46); },
      itemStyle: { color: rgba(acc, 0.10) },
      data: hubs.map(function (h) { return { name: h.n, value: h.c.concat(h.v) }; })
    }]);
    opt.title = [
      { text: d.metric || '门店密度', left: 14, top: 8,
        textStyle: { color: ink(t), fontSize: 11.5, fontFamily: FONT, fontWeight: 700 } },
      { text: '气泡面积 = 门店数量 · 前三位 ' + hubs.slice(0, 3).map(function (h) { return h.n; }).join(' / '),
        left: 14, top: 26, textStyle: { color: muted(t), fontSize: 9, fontFamily: FONT } }
    ];
    return opt;
  };
  B.trajectory = function (el, d, t) {
    _GEO_EL = el;
    var path = d.path || [];
    return geo(t, [
      { type: 'lines', coordinateSystem: 'geo', polyline: true, data: [{ coords: path }], silent: true,
        lineStyle: { color: rgba(accent(t), 0.8), width: 1.6, curveness: 0 } },
      { type: 'scatter', coordinateSystem: 'geo', data: path.map(function (p, i) { return { name: 'P' + (i + 1), value: p }; }),
        symbolSize: 5, itemStyle: { color: ink(t) } },
      { type: 'lines', coordinateSystem: 'geo', polyline: true, data: [{ coords: path }], silent: true, zlevel: 3,
        lineStyle: { color: '#fff', width: 0, curveness: 0 },
        effect: { show: true, period: 6, trailLength: 0.18, symbol: 'circle', symbolSize: 3, color: accent(t) } }
    ]);
  };
  B.migration = function (el, d, t) {
    _GEO_EL = el;
    var flows = d.flows || [];
    return geo(t, [{
      type: 'lines', coordinateSystem: 'geo', zlevel: 2,
      data: flows.map(function (f) { return { coords: [f.from, f.to], value: f.value }; }),
      lineStyle: { color: rgba(accent(t), 0.55), width: 1.1, curveness: 0.28 },
      effect: { show: true, period: 5, trailLength: 0.15, symbol: 'circle', symbolSize: 3 }
    }]);
  };
  B.flowMap = function (el, d, t) {
    _GEO_EL = el;
    var flows = d.flows || [];
    return geo(t, [
      { type: 'lines', coordinateSystem: 'geo', data: flows.map(function (f) { return { coords: [f.from, f.to], value: f.value }; }),
        lineStyle: { color: rgba(accent(t), 0.5), width: 1.4, curveness: 0.3 },
        effect: { show: true, period: 5, trailLength: 0.2, symbol: 'circle', symbolSize: 3 } },
      { type: 'effectScatter', coordinateSystem: 'geo', data: (d.hubs || []).map(function (h) { return { name: h.name, value: h.coord }; }),
        symbolSize: 7, rippleEffect: { brushType: 'stroke', scale: 2.6, period: 4 }, itemStyle: { color: ink(t) } }
    ]);
  };
  B.hexMap = function (el, d, t) {
    _GEO_EL = el;
    var pts = d.points || [];
    var max = Math.max.apply(null, pts.map(function (p) { return p.value; }));
    return geo(t, [{
      type: 'scatter', coordinateSystem: 'geo',
      data: pts.map(function (p) { return { name: p.name, value: p.coord.concat(p.value) }; }),
      symbol: 'path://M50,0 L150,0 L200,86.6 L150,173.2 L50,173.2 L0,86.6 Z',
      symbolSize: function (v) { return 12 + (v[2] / max) * 22; },
      itemStyle: { color: rgba(accent(t), 0.5), borderColor: accent(t), borderWidth: 0.8 },
      label: { show: true, position: 'bottom', distance: 2, color: muted(t), fontSize: 8.5, fontFamily: FONT, formatter: function (p) { return p.name; } }
    }]);
  };

  /* ================= 8. 层级与流程 ================= */
  B.tree = function (el, d, t) {
    var W = (el && el.clientWidth) || 700;
    var narrow = W < 520;
    var rp = rampOf(t);
    var tree = JSON.parse(JSON.stringify(d.tree || {}));
    /* 自底向上累计数值（叶子默认给定或按子节点求和） */
    function walk(node, depth) {
      node._d = depth;
      if (node.children && node.children.length) {
        var sum = 0;
        node.children.forEach(function (c) { sum += walk(c, depth + 1); });
        if (node.value === undefined) node.value = sum;
      } else if (node.value === undefined) {
        node.value = 10 + Math.round((node.name || '').length * 6);
      }
      return node.value;
    }
    var total = walk(tree, 0);
    var maxLeaf = 1;
    (function scan(nd) { if (!nd.children) maxLeaf = Math.max(maxLeaf, nd.value || 0); (nd.children || []).forEach(scan); })(tree);
    return base(t, {
      tooltip: tip(t, { formatter: function (p) {
        return '<b>' + p.name + '</b><br/>规模 ' + num(p.value) + '（占 ' + (p.value / total * 100).toFixed(1) + '%）';
      } }),
      series: [{
        type: 'tree', data: [tree], layout: 'orthogonal', orient: 'LR',
        left: narrow ? 62 : 84, right: narrow ? 74 : 116, top: 14, bottom: 14,
        symbol: 'circle',
        symbolSize: function (v, p) {
          var leaf = !p.data.children || !p.data.children.length;
          return leaf ? 4 + Math.sqrt((p.data.value || 0) / maxLeaf) * 9 : 11;
        },
        lineStyle: { color: rgba(ink(t), 0.22), width: 1.2, curveness: 0.5 },
        label: {
          position: 'left', verticalAlign: 'middle', align: 'right',
          color: ink(t), fontSize: narrow ? 9 : 10, fontFamily: FONT, distance: 6,
          formatter: function (p) {
            if (p.data._d === 0) return '{r|' + p.name + '}';
            return p.name;
          },
          rich: { r: { fontSize: narrow ? 10 : 12, fontWeight: 800, color: ink(t), fontFamily: FONT } }
        },
        leaves: {
          label: { position: 'right', align: 'left', distance: 8,
            formatter: function (p) { return p.name + '  {v|' + num(p.value) + '}'; },
            rich: { v: { color: muted(t), fontSize: 9, fontFamily: FONT } } }
        },
        itemStyle: {
          color: function (p) { return rp[Math.min(p.data._d, rp.length - 1)] || seriesColor(t, p.data._d); },
          borderColor: '#FFF', borderWidth: 1.5
        },
        emphasis: { itemStyle: { color: accentOf(t), shadowBlur: 8, shadowColor: 'rgba(5,28,44,.2)' } },
        expandAndCollapse: false, initialTreeDepth: -1
      }]
    });
  };
  B.orgChart = function (el, d, t) {
    return base(t, {
      tooltip: tip(t),
      series: [{
        type: 'tree', data: [d.tree], layout: 'orthogonal', orient: 'TB',
        top: 22, bottom: 26, left: 16, right: 16,
        symbol: 'roundRect', symbolSize: [46, 17],
        lineStyle: { color: rgba(ink(t), 0.2), width: 1, curveness: 0 },
        label: { position: 'inside', color: ink(t), fontSize: 8, fontFamily: FONT },
        itemStyle: { color: '#FFF', borderColor: rgba(ink(t), 0.25), borderWidth: 1 },
        emphasis: { itemStyle: { color: rgba(accent(t), 0.12), borderColor: accent(t) } },
        expandAndCollapse: false, initialTreeDepth: -1
      }]
    });
  };
  B.icicle = function (el, d, t) {
    /* 层级占比横向条：每层一行，长度=占比 */
    var rows = [];
    (function walk(node, depth, start, total) {
      var val = node.value || (node.children || []).reduce(function (a, c) { return a + (c.value || 0); }, 0);
      rows.push({ name: node.name, depth: depth, start: start, value: val, total: total });
      var acc = start;
      (node.children || []).forEach(function (c) { walk(c, depth + 1, acc, total); acc += (c.value || 0); });
    })(d.tree, 0, 0, 100);
    var maxDepth = Math.max.apply(null, rows.map(function (r) { return r.depth; }));
    var series = [];
    for (var dep = 0; dep <= maxDepth; dep++) {
      var items = rows.filter(function (r) { return r.depth === dep && r.value > 0; });
      series.push({
        type: 'bar', stack: 'ic', barWidth: '46%', silent: false,
        data: items.map(function (it) { return { name: it.name, value: [it.start, it.start + it.value] }; }),
        itemStyle: { color: rgba(accent(t), 0.9 - dep * 0.22), borderColor: '#FFF', borderWidth: 1.5 },
        label: { show: true, position: 'inside', color: dep === 0 ? '#FFF' : ink(t), fontSize: 9, fontFamily: FONT,
          formatter: function (p) { var w = p.value[1] - p.value[0]; return (w >= 14 || dep === 0) ? p.name : ''; } },
        labelLayout: { hideOverlap: true }
      });
    }
    return base(t, {
      tooltip: tip(t, { trigger: 'item' }),
      grid: { left: 10, right: 10, top: 10, bottom: 10 },
      xAxis: yAxis(t, { type: 'value', max: 100, show: false, splitLine: { show: false } }),
      yAxis: xAxis(t, { type: 'category', data: ['层级'], show: false }),
      series: series
    });
  };
  B.flowchart = function (el, d, t) {
    var steps = d.steps || [], n = steps.length;
    var W = (el && el.clientWidth) || 640;
    var gap = (W - 40) / Math.max(1, n);
    var nodes = steps.map(function (s, i) {
      var isD = s.type === 'decision';
      return {
        name: s.name, x: 20 + gap * i + gap / 2, y: 1,
        symbol: isD ? 'diamond' : (s.type === 'start' || s.type === 'end' ? 'roundRect' : 'rect'),
        symbolSize: isD ? [Math.min(64, gap * 0.6), 34] : [Math.min(gap * 0.74, 92), 30],
        itemStyle: { color: isD ? rgba(accent(t), 0.14) : '#FFF',
          borderColor: isD ? accent(t) : rgba(ink(t), 0.28), borderWidth: 1 },
        label: { color: ink(t), fontSize: 8, fontFamily: FONT, width: isD ? 40 : 76, overflow: 'break', lineHeight: 9 }
      };
    });
    var links = [];
    for (var i = 0; i < n - 1; i++) links.push({ source: steps[i].name, target: steps[i + 1].name });
    return base(t, {
      tooltip: { show: false },
      series: [{
        type: 'graph', layout: 'none', data: nodes, links: links, roam: false,
        lineStyle: { color: rgba(ink(t), 0.3), width: 1, curveness: 0 },
        edgeSymbol: ['none', 'arrow'], edgeSymbolSize: 6,
        label: { show: true, position: 'inside', color: ink(t), fontSize: 9, fontFamily: FONT }
      }]
    });
  };
  B.swimlane = function (el, d, t) {
    var lanes = d.lanes || [], tasks = d.tasks || [];
    var maxT = Math.max.apply(null, tasks.map(function (x) { return x.start + x.span; }));
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) { return p.name; } }),
      grid: grid({ left: 6, right: 16, top: 12, bottom: 16 }),
      xAxis: yAxis(t, { type: 'value', min: 0, max: maxT, splitLine: { show: true, lineStyle: { color: rule(t) } },
        axisLabel: { color: muted(t), fontSize: 9.5, fontFamily: FONT, formatter: function (v) { return 'T' + v; } } }),
      yAxis: xAxis(t, { data: lanes, axisLabel: { color: ink(t), fontSize: 10.5, fontFamily: FONT } }),
      series: [{
        type: 'custom',
        renderItem: function (params, api) {
          var lane = api.value(0), start = api.value(1), span = api.value(2);
          var p0 = api.coord([start, lane]), p1 = api.coord([start + span, lane]);
          var h = api.size([0, 1])[1] * 0.52;
          var c = seriesColor(t, lane);
          return {
            type: 'group', children: [
              { type: 'rect', shape: { x: p0[0] + 1.5, y: p0[1] - h / 2, width: Math.max(8, p1[0] - p0[0] - 3), height: h, r: 2 },
                style: { fill: rgba(c, 0.85) } },
              { type: 'text', style: { x: p0[0] + 7, y: p0[1], text: (params.data && params.data.name) || tasks[params.dataIndex].name, fill: '#fff', font: '9px ' + FONT, textVerticalAlign: 'middle' } }
            ]
          };
        },
        encode: { x: [1, 2], y: 0 },
        data: tasks.map(function (x) { return { name: x.name, value: [x.lane, x.start, x.span] }; })
      }]
    });
  };

  /* ================= 9. 特殊 ================= */
  B.control = function (el, d, t) {
    var W = (el && el.clientWidth) || 600;
    var narrow = W < 480;
    var vals = d.values || [];
    var mean = d.mean, ucl = d.ucl, lcl = d.lcl;
    var sd = (ucl - mean) / 3 || 1;
    /* 越界点 */
    var bad = [];
    vals.forEach(function (v, i) { if (v > ucl || v < lcl) bad.push({ value: [i, v] }); });
    var cpk = Math.min((ucl - mean) / (3 * sd), (mean - lcl) / (3 * sd));
    var rp = rampOf(t);
    function endLbl(txt, color) {
      return narrow ? { show: false } : { show: true, formatter: txt, color: color, fontSize: 8.5, fontFamily: FONT, distance: 4 };
    }
    var cpkColor = cpk >= 1.33 ? (t.up || '#1E7A46') : (t.down || '#C0392B');
    var badgeH = narrow ? 26 : 30;
    return base(t, {
      tooltip: tip(t, { trigger: 'axis' }),
      /* 顶部留出徽标高度，避免与 Y 轴顶部刻度重叠 */
      grid: grid({ left: 8, right: narrow ? 14 : 56, top: badgeH + 34, bottom: 12 }),
      graphic: [
        /* Cpk 徽标底板 */
        { type: 'rect', left: 8, top: 8, z: 9,
          shape: { width: narrow ? 74 : 86, height: badgeH, r: 4 },
          style: { fill: rgba(cpkColor, 0.10), stroke: rgba(cpkColor, 0.35), lineWidth: 1 } },
        { type: 'text', left: 16, top: 8 + (badgeH - 12) / 2 - 1, z: 10,
          style: { text: 'Cpk', fill: muted(t), font: '600 8.5px ' + FONT } },
        { type: 'text', left: narrow ? 42 : 48, top: 8 + (badgeH - 14) / 2 - 1, z: 10,
          style: { text: cpk.toFixed(2), fill: cpkColor, font: '800 13px ' + FONT } },
        /* 越界计数贴右 */
        { type: 'text', right: 10, top: 12 + badgeH / 2 - 6, z: 10,
          style: { text: '越界 ' + bad.length + ' 点', fill: bad.length ? (t.down || '#C0392B') : muted(t),
            font: '700 9px ' + FONT } }
      ],
      xAxis: timeAxis(t, d.labels),
      yAxis: yAxis(t, { scale: true, splitNumber: 4, boundaryGap: [0, 0.06] }),
      series: [
        /* UCL / LCL 之间的控制带 */
        { type: 'line', data: vals.map(function () { return ucl; }), showSymbol: false, silent: true, z: 2,
          lineStyle: { color: rgba(t.down || '#B5484B', 0.7), type: 'dashed', width: 1 },
          endLabel: endLbl('UCL', t.down || '#B5484B') },
        { type: 'line', data: vals.map(function () { return lcl; }), showSymbol: false, silent: true, z: 2,
          lineStyle: { color: rgba(t.down || '#B5484B', 0.7), type: 'dashed', width: 1 },
          endLabel: endLbl('LCL', t.down || '#B5484B') },
        { type: 'line', data: vals.map(function () { return mean; }), showSymbol: false, silent: true, z: 2,
          lineStyle: { color: rgba(ink(t), 0.4), width: 1 },
          endLabel: endLbl('CL', muted(t)) },
        { type: 'line', data: vals, showSymbol: false, z: 3,
          lineStyle: { color: seriesColor(t, 0), width: 1.8 },
          areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: rgba(seriesColor(t, 0), 0.16) }, { offset: 1, color: rgba(seriesColor(t, 0), 0.01) }]) } },
        { type: 'scatter', data: bad, symbolSize: 7, z: 6, itemStyle: { color: t.down || '#B5484B', borderColor: '#fff', borderWidth: 1.5 },
          label: { show: bad.length > 0 && !narrow, position: 'top', distance: 5, color: t.down || '#B5484B',
            fontSize: 8.5, fontFamily: FONT, fontWeight: 700, formatter: function (p) { return num(p.value[1]); } } }
      ]
    });
  };
  B.parallel = function (el, d, t) {
    var W = (el && el.clientWidth) || 600;
    var narrow = W < 480;
    var dims = (d.dims || []).slice();
    if (narrow && dims.length > 4) dims = dims.slice(0, 4);
    var rows = (d.rows || []).map(function (r) { return { name: r.name, values: r.values.slice(0, dims.length) }; });
    /* 综合得分（各维归一化后求均值）→ 高亮最优 */
    var mins = dims.map(function (_, i) { return Math.min.apply(null, rows.map(function (r) { return r.values[i]; })); });
    var maxs = dims.map(function (_, i) { return Math.max.apply(null, rows.map(function (r) { return r.values[i]; })); });
    var scores = rows.map(function (r) {
      var s = 0;
      r.values.forEach(function (v, i) { s += (v - mins[i]) / ((maxs[i] - mins[i]) || 1); });
      return s / dims.length;
    });
    var best = scores.indexOf(Math.max.apply(null, scores));
    return base(t, {
      tooltip: tip(t, { trigger: 'item' }),
      legend: legend(t, { data: rows.map(function (r) { return r.name; }), itemGap: narrow ? 8 : 14, top: 2 }),
      title: narrow ? undefined : [
        { text: '综合最优', right: 12, top: 2, textStyle: { color: muted(t), fontSize: 8.5, fontFamily: FONT, fontWeight: 400 } },
        { text: rows[best] ? rows[best].name + ' ' + (scores[best] * 100).toFixed(0) + ' 分' : '—', right: 60, top: 2,
          textStyle: { color: accentOf(t), fontSize: 11, fontFamily: FONT, fontWeight: 800 } }
      ],
      parallelAxis: dims.map(function (n, i) {
        /* 显式给定取值范围，保证连线严格落在轴内 */
        var lo = mins[i], hi = maxs[i];
        var pad = (hi - lo) * 0.08 || Math.abs(hi || 1) * 0.1 || 1;
        return { dim: i, name: n, min: Math.round(lo - pad), max: Math.round(hi + pad),
          nameGap: narrow ? 10 : 14,
          nameTextStyle: { color: muted(t), fontSize: narrow ? 8 : 9.5, fontFamily: FONT, padding: [0, 0, 4, 0] },
          axisLine: { lineStyle: { color: rgba(ink(t), 0.16) } },
          axisLabel: { show: !narrow, color: muted(t), fontSize: 8.5, fontFamily: FONT, formatter: function (v) { return Math.round(v); } },
          axisTick: { show: false } };
      }),
      parallel: { left: narrow ? 24 : 44, right: narrow ? 24 : 40, top: narrow ? 62 : 58, bottom: narrow ? 20 : 28 },
      series: rows.map(function (r, i) {
        var isBest = i === best;
        return { name: r.name, type: 'parallel', data: [r.values], smooth: 0,
          lineStyle: { width: isBest ? (narrow ? 2.4 : 3) : (narrow ? 1.1 : 1.5),
            color: isBest ? accentOf(t) : seriesColor(t, i),
            opacity: isBest ? 1 : 0.42 },
          z: isBest ? 10 : 1 };
      })
    });
  };
  B.streamgraph = function (el, d, t) {
    var data = [];
    d.topics.forEach(function (tp) {
      tp.values.forEach(function (v, i) {
        var lb = String(d.labels[i]);
        var dt = lb.indexOf('-') > 0 ? lb + '-01' : lb + '-01-01';
        data.push([dt, v, tp.name]);
      });
    });
    return base(t, {
      tooltip: tip(t, { trigger: 'axis' }),
      legend: legend(t, { data: d.topics.map(function (x) { return x.name; }) }),
      singleAxis: {
        type: 'time', bottom: 18, top: 36, left: 18, right: 18,
        axisLabel: { color: muted(t), fontSize: 9, fontFamily: FONT, hideOverlap: true },
        axisLine: { lineStyle: { color: rgba(ink(t), 0.12) } }, axisTick: { show: false },
        splitLine: { show: false }
      },
      series: [{
        type: 'themeRiver', data: data, emphasis: { focus: 'series' },
        label: { show: false }, itemStyle: { opacity: 0.82 },
        color: (t.series || ['#1A1A2E', '#A67C3D', '#6F8FA8', '#7A5C3E'])
      }]
    });
  };

  /* 散点矩阵 / 气泡等沿用旧实现 */
  global.ADV_BUILDERS = B;
})(window);
