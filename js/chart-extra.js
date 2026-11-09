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
    var pid = (t && t.paletteId) || 'consult';
    var p = (window.ADV_PALETTES || []).filter(function (x) { return x.id === pid; })[0];
    return (p && p.ramp) ? p.ramp : [(t.text || '#051C2C'), '#1B4B72', '#4A7FA8', '#A8C4D8', '#E4EBF1'];
  }
  function upOf(t) {
    var pid = (t && t.paletteId) || 'consult';
    var p = (window.ADV_PALETTES || []).filter(function (x) { return x.id === pid; })[0];
    return (p && p.up) || '#1E7A46';
  }
  function downOf(t) {
    var pid = (t && t.paletteId) || 'consult';
    var p = (window.ADV_PALETTES || []).filter(function (x) { return x.id === pid; })[0];
    return (p && p.down) || '#B5484B';
  }
  function accentOf(t) {
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
        font: '800 11.5px ' + FONT, textBorderColor: '#fff', textBorderWidth: 3,
        formatter: function () { return num(hi.v); } } });
    if (opts.min !== false) out.push({ coord: [lo.i, lo.v], symbol: 'circle', symbolSize: 4.5,
      itemStyle: { color: upOf(t) },
      label: { show: true, position: 'bottom', distance: 6, color: upOf(t),
        font: '800 11.5px ' + FONT, textBorderColor: '#fff', textBorderWidth: 3,
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
                textBorderColor: '#fff', textBorderWidth: 3, formatter: 'total ' + num(totals[totals.length - 1]) } }]
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
            label: { show: share >= 7, color: '#fff', fontFamily: FONT,
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
        width: '99%', height: '94%', top: '3%', left: '0.5%',
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
    var h = bins(d.values, 14);
    var labels = h.edges.slice(0, -1).map(function (e, i) { return Math.round(e) + '–' + Math.round(h.edges[i + 1]); });
    var dens = kdePts(d.values, h.min, h.max, 80);
    /* 把密度曲线映射到「柱高」尺度，叠加在直方图上 */
    var maxC = Math.max.apply(null, h.counts) || 1;
    var peak = Math.max.apply(null, dens.map(function (p) { return p[1]; })) || 1;
    var curve = dens.map(function (p) {
      var idx = (p[0] - h.min) / (h.max - h.min) * 14 - 0.5;
      return [idx, p[1] / peak * maxC * 0.92];
    });
    return base(t, {
      tooltip: tip(t, { trigger: 'axis' }),
      grid: grid({ left: 6, right: 16, top: 14, bottom: 16 }),
      xAxis: xAxis(t, { data: labels, axisLabel: { color: muted(t), fontSize: 8.5, fontFamily: FONT, interval: 2, margin: 8 } }),
      yAxis: yAxis(t, { max: Math.ceil(maxC * 1.18) }),
      series: [
        { type: 'bar', data: h.counts, barWidth: '88%', silent: true,
          itemStyle: { color: rgba(accent(t), 0.28), borderColor: rgba(accent(t), 0.5), borderWidth: 0.6 } },
        { type: 'line', data: curve, showSymbol: false, smooth: true, silent: true,
          lineStyle: { color: ink(t), width: 1.6 } },
        /* 均值 / 中位数 参考线 */
        (function () {
          var vs = d.values.filter(function (v) { return v !== null && !isNaN(v); });
          var mean = vs.reduce(function (a, b) { return a + b; }, 0) / vs.length;
          var sorted = vs.slice().sort(function (a, b) { return a - b; });
          var med = sorted[Math.floor(sorted.length / 2)];
          var toIdx = function (x) { return (x - h.min) / (h.max - h.min) * 14 - 0.5; };
          return { type: 'line', data: [], silent: true,
            markLine: { silent: true, symbol: 'none', data: [
              { xAxis: Math.round(toIdx(mean)), lineStyle: { color: rgba(accentOf(t), 0.9), width: 1.2, type: 'dashed' },
                label: { show: true, position: 'end', color: accentOf(t), font: '700 8.5px ' + FONT, formatter: 'mean ' + Math.round(mean) } },
              { xAxis: Math.round(toIdx(med)), lineStyle: { color: rgba(ink(t), 0.5), width: 1.1, type: 'dotted' },
                label: { show: true, position: 'start', color: muted(t), font: '600 8.5px ' + FONT, formatter: 'median ' + Math.round(med) } }
            ] } };
        })()
      ]
    });
  };

  B.boxplot = function (el, d, t) {
    var boxes = d.boxes || [];
    var W = (el && el.clientWidth) || 600;
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) {
        var v = p.value;
        return (p.name || '') + '<br/>max ' + num(v[5]) + ' · Q3 ' + num(v[4]) + ' · median ' + num(v[3]) + ' · Q1 ' + num(v[2]) + ' · min ' + num(v[1]);
      } }),
      grid: grid({ left: 6, right: 18, top: 18, bottom: 18 }),
      xAxis: xAxis(t, { data: d.categories, boundaryGap: true, axisLabel: { color: ink(t), fontSize: 10.5, fontFamily: FONT } }),
      yAxis: yAxis(t, { scale: true }),
      series: [{
        type: 'boxplot',
        boxWidth: (W < 480 ? ['18%', '34%'] : ['10%', '20%']),
        data: boxes,   /* [min, Q1, median, Q3, max] */
        itemStyle: { color: rgba(rampOf(t)[2], 0.16), borderColor: rgba(rampOf(t)[1], 0.9), borderWidth: 1.1 },
        emphasis: { itemStyle: { borderColor: accent(t), borderWidth: 1.6 } },
        label: { show: false }
      }]
    });
  };

  /* 小提琴图：custom 系列绘制密度多边形 */
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
    var labels = d.labels || [], groups = d.groups || [];
    var all = [].concat.apply([], groups);
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var rows = groups.map(function (g, gi) {
      var pts = kdePts(g, lo, hi, 48);
      var maxD = Math.max.apply(null, pts.map(function (p) { return p[1]; })) || 1;
      return { gi: gi, xs: pts.map(function (p) { return p[0]; }), ys: pts.map(function (p) { return p[1] / maxD; }) };
    });
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return labels[p.value[0]] || ''; } }),
      grid: { left: 8, right: 14, top: 10, bottom: 18 },
      xAxis: yAxis(t, { type: 'value', min: lo, max: hi, splitLine: { show: false },
        axisLabel: { color: muted(t), fontSize: 9.5, fontFamily: FONT } }),
      yAxis: yAxis(t, { type: 'value', min: -0.2, max: groups.length, show: false, splitLine: { show: false } }),
      graphic: labels.map(function (lb, i) {
        var H0 = (el && el.clientHeight) || 190;
        var top = 10 + (1 - (i + 0.5) / labels.length) * (H0 - 28);
        return { type: 'text', left: 'right', top: Math.round(top), z: 20,
          style: { text: lb, fill: muted(t), font: '9.5px ' + FONT, textAlign: 'right' } };
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
    return base(t, {
      tooltip: tip(t, { trigger: 'item', formatter: function (p) { return d.xName + ' ' + num(p.value[0]) + '<br/>' + d.yName + ' ' + num(p.value[1]); } }),
      grid: grid({ left: 6, right: 24, top: 18, bottom: 24 }),
      xAxis: yAxis(t, { type: 'value', scale: true, splitLine: { show: false },
        name: d.xName, nameLocation: 'middle', nameGap: 24, nameTextStyle: { color: muted(t), fontSize: 10, fontFamily: FONT } }),
      yAxis: yAxis(t, { type: 'value', scale: true, name: d.yName, nameTextStyle: { color: muted(t), fontSize: 10, fontFamily: FONT } }),
      series: [{
        type: 'scatter', data: d.points, symbolSize: 7,
        itemStyle: { color: rgba(accent(t), 0.55), borderColor: rgba(accent(t), 0.95), borderWidth: 0.6 },
        emphasis: { itemStyle: { color: accent(t) } }
      }]
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

  B.corrMatrix = function (el, d, t) {
    var names = d.names, m = d.matrix, data = [];
    for (var i = 0; i < names.length; i++) for (var j = 0; j < names.length; j++) data.push([j, i, m[i][j]]);
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return names[p.value[1]] + ' × ' + names[p.value[0]] + '<br/>r = ' + p.value[2].toFixed(2); } }),
      grid: { left: 6, right: 14, top: 14, bottom: 40, containLabel: true },
      xAxis: xAxis(t, { data: names, axisLabel: { color: muted(t), fontSize: 9, fontFamily: FONT, rotate: 30, margin: 6 } }),
      yAxis: xAxis(t, { data: names, axisLabel: { color: muted(t), fontSize: 9, fontFamily: FONT } }),
      visualMap: { min: -1, max: 1, show: false, inRange: { color: ['#6F8FA8', '#F7F4EC', '#A67C3D'] } },
      series: [{ type: 'heatmap', data: data, itemStyle: { borderColor: '#FFF', borderWidth: 1.5 },
        label: { show: true, color: ink(t), fontSize: 8.5, fontFamily: FONT, formatter: function (p) { return Math.abs(p.value[2]) > 0.05 ? p.value[2].toFixed(1) : '·'; } } }]
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
  B.funnel = function (el, d, t) {
    var steps = d.steps || [];
    var first = steps[0] ? steps[0].value : 1;
    return base(t, {
      tooltip: tip(t, { formatter: function (p) { return p.name + ' ' + num(p.value) + ' (' + (p.value / first * 100).toFixed(1) + '%)'; } }),
      series: [{
        type: 'funnel', left: '12%', right: '12%', top: 16, bottom: 12,
        minSize: '18%', maxSize: '94%', sort: 'descending', gap: 2,
        itemStyle: { borderColor: '#FFF', borderWidth: 2 },
        label: { show: true, position: 'inside', color: '#fff', fontSize: 10.5, fontFamily: FONT,
          formatter: function (p) {
            var i = p.dataIndex;
            var prev = i > 0 ? steps[i - 1].value : p.value;
            var stepRate = prev ? (p.value / prev * 100) : 100;
            return p.name + '  ' + (p.value / first * 100).toFixed(0) + '%'
              + (i > 0 ? '  ↓' + stepRate.toFixed(0) + '%' : '');
          } },

        data: steps.map(function (s, i) { return { name: s.name, value: s.value, itemStyle: { color: rgba(seriesColor(t, i), 0.9) } }; })
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
    var vals = [
      { name: 'China', value: 5.2 }, { name: 'United States', value: 2.8 }, { name: 'Germany', value: 1.6 },
      { name: 'Japan', value: 1.2 }, { name: 'India', value: 6.8 }, { name: 'Brazil', value: 2.9 },
      { name: 'United Kingdom', value: 1.4 }, { name: 'France', value: 1.1 }, { name: 'Canada', value: 2.0 },
      { name: 'Australia', value: 2.4 }, { name: 'Russia', value: 1.3 }, { name: 'Indonesia', value: 5.0 },
      { name: 'Mexico', value: 2.6 }, { name: 'Saudi Arabia', value: 3.9 }, { name: 'South Africa', value: 0.9 },
      { name: 'Nigeria', value: 3.1 }, { name: 'Egypt', value: 4.2 }, { name: 'Argentina', value: -1.2 },
      { name: 'South Korea', value: 2.2 }, { name: 'Italy', value: 0.8 }
    ];
    return base(t, Object.assign(geo(t, [{
      type: 'map', map: 'world', roam: true, zoom: 1.15, nameProperty: 'name',
      itemStyle: { areaColor: rgba(ink(t), 0.04), borderColor: rgba(ink(t), 0.12), borderWidth: 0.4 },
      emphasis: { itemStyle: { areaColor: rgba(accent(t), 0.3) }, label: { show: true, color: ink(t), fontSize: 10 } },
      label: { show: false }, data: vals
    }]), {
      visualMap: { min: -2, max: 7, show: false, inRange: { color: ['#8FA8C8', '#EFEBE1', '#D9C08A', '#A67C3D'] } },
      geo: undefined
    }));
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
    var pts = [];
    var hubs = [[121.47, 31.23], [-74.01, 40.71], [-0.13, 51.51], [139.69, 35.69], [103.82, 1.35], [55.27, 25.20], [151.21, -33.87], [-46.63, -23.55]];
    hubs.forEach(function (h, i) {
      for (var k = 0; k < 20; k++) pts.push([h[0] + Math.sin(k * 7 + i) * 5, h[1] + Math.cos(k * 5 + i) * 4, 40 + Math.abs(Math.sin(k + i)) * 60]);
    });
    var opt = geo(t, [{ type: 'heatmap', coordinateSystem: 'geo', data: pts, pointSize: 7, blurSize: 10, minOpacity: 0.12, maxOpacity: 0.75 }]);
    opt.visualMap = { min: 0, max: 100, show: false, inRange: { color: ['rgba(166,124,61,0.05)', 'rgba(166,124,61,0.4)', 'rgba(120,82,35,0.85)'] } };
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
    return base(t, {
      tooltip: tip(t),
      series: [{
        type: 'tree', data: [d.tree], layout: 'orthogonal', orient: 'LR',
        left: 52, right: 92, top: 12, bottom: 12,
        symbol: 'circle', symbolSize: 6,
        lineStyle: { color: rgba(ink(t), 0.18), width: 1.1, curveness: 0.5 },
        label: { position: 'left', verticalAlign: 'middle', align: 'right', color: ink(t), fontSize: 10, fontFamily: FONT },
        leaves: { label: { position: 'right', align: 'left' } },
        itemStyle: { color: accent(t), borderColor: '#FFF', borderWidth: 1 },
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
    var endLbl = function (txt, color) {
      return narrow ? { show: false } : { show: true, formatter: txt, color: color, fontSize: 8.5, fontFamily: FONT, distance: 4 };
    };
    return base(t, {
      tooltip: tip(t, { trigger: 'axis' }),
      grid: grid({ left: 8, right: narrow ? 14 : 52, top: 16, bottom: 12 }),
      xAxis: timeAxis(t, d.labels),
      yAxis: yAxis(t, { scale: true }),
      series: [
        { type: 'line', data: d.values, showSymbol: false, lineStyle: { color: ink(t), width: 1.6 }, z: 3 },
        { type: 'line', data: d.values.map(function () { return d.ucl; }), showSymbol: false, silent: true,
          lineStyle: { color: rgba('#B5484B', 0.75), type: 'dashed', width: 1 },
          endLabel: endLbl('UCL', '#B5484B') },
        { type: 'line', data: d.values.map(function () { return d.lcl; }), showSymbol: false, silent: true,
          lineStyle: { color: rgba('#B5484B', 0.75), type: 'dashed', width: 1 },
          endLabel: endLbl('LCL', '#B5484B') },
        { type: 'line', data: d.values.map(function () { return d.mean; }), showSymbol: false, silent: true,
          lineStyle: { color: rgba(ink(t), 0.35), width: 1 },
          endLabel: endLbl('CL', muted(t)) },
        { type: 'scatter', symbolSize: 6, z: 5, itemStyle: { color: '#B5484B' },
          data: d.values.map(function (v, i) { return (v > d.ucl || v < d.lcl) ? [i, v] : null; }).filter(function (x) { return x; }) }
      ]
    });
  };

  B.parallel = function (el, d, t) {
    var W = (el && el.clientWidth) || 600;
    var narrow = W < 480;
    var dims = (d.dims || []).slice();
    if (narrow && dims.length > 4) dims = dims.slice(0, 4);          // 窄卡片只保留 4 维
    var rows = (d.rows || []).map(function (r) { return { name: r.name, values: r.values.slice(0, dims.length) }; });
    return base(t, {
      tooltip: tip(t, { trigger: 'item' }),
      legend: legend(t, { data: rows.map(function (r) { return r.name; }), itemGap: narrow ? 8 : 14 }),
      parallelAxis: dims.map(function (n, i) {
        return { dim: i, name: n,
          nameTextStyle: { color: muted(t), fontSize: narrow ? 8 : 9.5, fontFamily: FONT, padding: [0, 0, 3, 0] },
          axisLine: { lineStyle: { color: rgba(ink(t), 0.18) } },
          axisLabel: { show: !narrow && (i === 0 || i === dims.length - 1), color: muted(t), fontSize: 8.5, fontFamily: FONT },
          axisTick: { show: false } };
      }),
      parallel: { left: narrow ? 18 : 34, right: narrow ? 18 : 30, top: narrow ? 48 : 44, bottom: narrow ? 10 : 16 },
      series: rows.map(function (r, i) {
        return { name: r.name, type: 'parallel', data: [r.values], smooth: 0.2,
          lineStyle: { width: narrow ? 1.3 : 1.8, color: seriesColor(t, i), opacity: 0.8 } };
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
