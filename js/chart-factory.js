/* ============================================================
 * 图表工厂 — 基于 Apache ECharts 的模版渲染器
 * 覆盖：面积/双轴/阶梯/热力/排名/气泡/树图/堆叠/瀑布/环形/KPI
 * ============================================================ */
(function (global) {
  'use strict';

  var instances = [];

  function hexToRgba(hex, alpha) {
    if (hex[0] === '#') hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function fmt(v) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    var n = Number(v), neg = n < 0;
    n = Math.abs(n);
    var s = n.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return (neg ? '-' : '') + s;
  }

  function axisCommon(theme) {
    return {
      axisLine: { lineStyle: { color: theme.axis } },
      axisTick: { show: false },
      axisLabel: { color: theme.muted, fontSize: 11 },
      splitLine: { lineStyle: { color: theme.grid } },
      nameTextStyle: { color: theme.muted, fontSize: 11 }
    };
  }

  function tooltip(theme) {
    return {
      trigger: 'axis',
      backgroundColor: theme.panel,
      borderColor: theme.accent + '55',
      borderWidth: 1,
      textStyle: { color: theme.text, fontSize: 12 },
      padding: [10, 14],
      confine: true,
      valueFormatter: function (v) { return fmt(v); },
      extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,.4); border-radius: 8px;',
      axisPointer: {
        type: 'cross',
        lineStyle: { color: theme.muted, opacity: 0.5 },
        crossStyle: { color: theme.muted, opacity: 0.5 },
        label: { backgroundColor: theme.accent, color: '#0E0F12', fontSize: 10 }
      }
    };
  }

  function legend(theme) {
    return {
      top: 6, right: 10, textStyle: { color: theme.muted, fontSize: 11 },
      itemWidth: 14, itemHeight: 8, icon: 'roundRect',
      inactiveColor: theme.muted + '44'
    };
  }

  function gridTop() { return { top: 46, left: 12, right: 16, bottom: 8, containLabel: true }; }
  function gridZoom() { return { top: 46, left: 12, right: 16, bottom: 48, containLabel: true }; }

  var watermarkOn = true;
  function setWatermark(v) { watermarkOn = !!v; }

  /* 可拖动/可缩放的时间轴 */
  function dataZoomCfg(theme) {
    return [
      { type: 'inside', zoomOnMouseWheel: true, moveOnMouseMove: true, moveOnMouseWheel: false },
      {
        type: 'slider', height: 26, bottom: 4, borderColor: 'transparent',
        backgroundColor: hexToRgba(theme.text, 0.04),
        fillerColor: hexToRgba(theme.accent, 0.14),
        handleStyle: { color: theme.accent, borderColor: theme.accent },
        moveHandleStyle: { color: theme.accent },
        textStyle: { color: theme.muted, fontSize: 9 },
        dataBackground: { lineStyle: { color: theme.muted + '55' }, areaStyle: { color: theme.muted + '22' } },
        selectedDataBackground: { lineStyle: { color: theme.accent + '88' }, areaStyle: { color: theme.accent + '22' } }
      }
    ];
  }

  /* 悬停高亮当前系列、其余变暗 */
  function focusCfg() {
    return {
      emphasis: { focus: 'series' },
      blur: { lineStyle: { opacity: 0.12 }, itemStyle: { opacity: 0.12 }, areaStyle: { opacity: 0.06 } }
    };
  }

  /* 给系列对象合并高亮配置 */
  function withFocus(s) { return Object.assign(s, focusCfg()); }

  function areaGradient(echarts, color) {
    return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
      { offset: 0, color: hexToRgba(color, 0.30) },
      { offset: 1, color: hexToRgba(color, 0.00) }
    ]);
  }

  /* ---------- 面积 / 折线 ---------- */
  function lineArea(el, data, theme) {
    var series = data.series.map(function (s, i) {
      var c = theme.series[i % theme.series.length];
      return withFocus({
        name: s.name, type: 'line', smooth: true, symbol: 'none',
        data: s.values, color: c,
        lineStyle: { width: 2.4 },
        areaStyle: { color: areaGradient(echarts, c) }
      });
    });
    var option = {
      backgroundColor: theme.bg,
      tooltip: tooltip(theme),
      legend: legend(theme),
      grid: gridZoom(),
      dataZoom: dataZoomCfg(theme),
      xAxis: [Object.assign({ type: 'category', boundaryGap: false, data: data.labels }, axisCommon(theme))],
      yAxis: [Object.assign({ type: 'value', scale: true }, axisCommon(theme))],
      series: series
    };
    return option;
  }

  /* ---------- 纯折线（无填充） ---------- */
  function lineOnly(el, data, theme) {
    var option = lineArea(el, data, theme);
    option.series.forEach(function (s) { s.areaStyle = undefined; s.symbol = 'circle'; s.symbolSize = 4; });
    return option;
  }

  /* ---------- 分组柱状 ---------- */
  function barChart(el, data, theme) {
    var option = {
      backgroundColor: theme.bg,
      tooltip: tooltip(theme),
      legend: legend(theme),
      grid: gridZoom(),
      dataZoom: dataZoomCfg(theme),
      xAxis: [Object.assign({ type: 'category', data: data.labels }, axisCommon(theme))],
      yAxis: [Object.assign({ type: 'value' }, axisCommon(theme))],
      series: data.series.map(function (s, i) {
        return withFocus({
          name: s.name, type: 'bar', data: s.values, barMaxWidth: 26,
          itemStyle: { color: theme.series[i % theme.series.length], borderRadius: [3, 3, 0, 0] }
        });
      })
    };
    return option;
  }

  /* ---------- 堆叠柱状（如社融按年/月对比） ---------- */
  function stackedBar(el, data, theme) {
    var option = {
      backgroundColor: theme.bg,
      tooltip: tooltip(theme),
      legend: legend(theme),
      grid: gridZoom(),
      dataZoom: dataZoomCfg(theme),
      xAxis: [Object.assign({ type: 'category', data: data.labels }, axisCommon(theme))],
      yAxis: [Object.assign({ type: 'value' }, axisCommon(theme))],
      series: data.series.map(function (s, i) {
        return withFocus({
          name: s.name, type: 'bar', stack: 'total', data: s.values, barMaxWidth: 26,
          itemStyle: { color: theme.series[i % theme.series.length], borderRadius: i === data.series.length - 1 ? [3, 3, 0, 0] : 0 }
        });
      })
    };
    return option;
  }

  /* ---------- 雷达图（如 PMI 分项对比） ---------- */
  function radar(el, data, theme) {
    // 每个维度按实际数据区间自动收窄，让差异更明显
    var indicators = data.indicators.map(function (ind, i) {
      var vals = data.series.map(function (s) { return s.values[i]; }).filter(function (v) { return isFinite(v); });
      var min = ind.min, max = ind.max;
      if (vals.length) {
        var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
        var span = (mx - mn) || Math.abs(mx) || 1;
        min = Math.floor((mn - span * 0.25) * 10) / 10;
        max = Math.ceil((mx + span * 0.25) * 10) / 10;
      }
      return { name: ind.name, min: min !== undefined ? min : undefined, max: max !== undefined ? max : (ind.max || 100) };
    });
    var option = {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), { trigger: 'item' }),
      legend: legend(theme),
      radar: {
        indicator: indicators,
        top: 46, bottom: 16, left: 30, right: 30,
        axisName: { color: theme.muted, fontSize: 11 },
        splitLine: { lineStyle: { color: theme.grid } },
        splitArea: { areaStyle: { color: [hexToRgba(theme.text, 0.02), 'transparent'] } },
        axisLine: { lineStyle: { color: theme.grid } }
      },
      series: [{
        type: 'radar',
        data: data.series.map(function (s, i) {
          return {
            name: s.name, value: s.values,
            lineStyle: { color: theme.series[i % theme.series.length], width: 2 },
            itemStyle: { color: theme.series[i % theme.series.length] },
            areaStyle: { color: hexToRgba(theme.series[i % theme.series.length], 0.15) },
            symbolSize: 4
          };
        })
      }]
    };
    return option;
  }

  /* ---------- 阶梯线 ---------- */
  function stepLine(el, data, theme) {
    var option = lineArea(el, data, theme);
    option.series.forEach(function (s) { s.step = 'end'; s.areaStyle = undefined; });
    return option;
  }

  /* ---------- 柱 + 线 双轴 ---------- */
  function dual(el, data, theme) {
    var barColor = theme.accent;
    var lineColor = theme.series[1] || theme.up;
    var series = [];
    (data.bars || []).forEach(function (b) {
      series.push({
        name: b.name, type: 'bar', data: b.values, yAxisIndex: 0,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: barColor }, { offset: 1, color: hexToRgba(barColor, 0.55) }
          ]),
          borderRadius: [3, 3, 0, 0]
        },
        barMaxWidth: 26
      });
    });
    (data.lines || []).forEach(function (l, i) {
      series.push({
        name: l.name, type: 'line', data: l.values, yAxisIndex: 1,
        color: lineColor, symbol: 'circle', symbolSize: 5, smooth: true,
        lineStyle: { width: 2.4 }
      });
    });
    series.forEach(function (s) { withFocus(s); });
    var option = {
      backgroundColor: theme.bg,
      tooltip: tooltip(theme),
      legend: Object.assign(legend(theme), { right: 16, top: 8 }),
      grid: { top: 50, left: 12, right: 24, bottom: 48, containLabel: true },
      dataZoom: dataZoomCfg(theme),
      xAxis: [Object.assign({ type: 'category', data: data.labels }, axisCommon(theme))],
      yAxis: [
        Object.assign({ type: 'value' }, axisCommon(theme)),
        Object.assign({ type: 'value', splitLine: { show: false } }, axisCommon(theme))
      ],
      series: series
    };
    return option;
  }

  /* ---------- 热力图 ---------- */
  function heatmap(el, data, theme) {
    var max = 0, min = 0;
    data.values.forEach(function (v) { max = Math.max(max, v[2]); min = Math.min(min, v[2]); });
    var option = {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), { position: 'top', formatter: function (p) { return p.value[2] + '%'; } }),
      grid: { top: 46, left: 12, right: 74, bottom: 8, containLabel: true },
      xAxis: [Object.assign({ type: 'category', data: data.xLabels, splitArea: { show: true } }, axisCommon(theme))],
      yAxis: [Object.assign({ type: 'category', data: data.yLabels, splitArea: { show: true } }, axisCommon(theme))],
      visualMap: {
        min: min, max: max, calculable: false, orient: 'vertical', right: 6, top: 'middle',
        itemWidth: 10, itemHeight: 90, textStyle: { color: theme.muted, fontSize: 10 },
        inRange: { color: [hexToRgba(theme.down, 0.9), theme.bg, hexToRgba(theme.accent, 0.95)] }
      },
      series: [{
        type: 'heatmap', data: data.values,
        label: { show: true, color: theme.text, fontSize: 11 },
        itemStyle: { borderColor: theme.bg, borderWidth: 2 },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.5)' } }
      }]
    };
    return option;
  }

  /* ---------- 横向排名 ---------- */
  function rank(el, data, theme) {
    var sorted = data.categories.map(function (c, i) { return { c: c, v: data.values[i] }; })
      .sort(function (a, b) { return a.v - b.v; });
    var option = {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), { trigger: 'item', formatter: function (p) { return p.name + '：' + p.value + '%'; } }),
      grid: { top: 12, left: 12, right: 52, bottom: 12, containLabel: true },
      xAxis: [Object.assign({ type: 'value', splitLine: { lineStyle: { color: theme.grid } } }, axisCommon(theme))],
      yAxis: [Object.assign({
        type: 'category', data: sorted.map(function (d) { return d.c; }),
        axisLine: { lineStyle: { color: theme.axis } },
        axisTick: { show: false },
        axisLabel: { color: theme.text, fontSize: 12 }
      }, axisCommon(theme))],
      series: [{
        type: 'bar', data: sorted.map(function (d) { return d.v; }),
        barWidth: '58%',
        label: { show: true, position: 'right', color: theme.muted, fontSize: 11,
          formatter: function (p) { return (p.value > 0 ? '+' : '') + p.value + '%'; } },
        itemStyle: {
          color: function (p) { return p.value >= 0 ? theme.up : theme.down; },
          borderRadius: 3
        }
      }]
    };
    return option;
  }

  /* ---------- 气泡矩阵 ---------- */
  function bubble(el, data, theme) {
    var sizeMin = 8, sizeMax = 52;
    var maxSize = Math.max.apply(null, data.data.map(function (d) { return d.size; }));
    var option = {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), {
        trigger: 'item',
        formatter: function (p) {
          var d = p.data;
          return '<b>' + d.name + '</b><br/>' + data.xName + '：' + d.value[0] + '%<br/>' +
                 data.yName + '：' + d.value[1] + '%<br/>' + data.sizeName + '：' + d.value[2] + ' 万亿元';
        }
      }),
      grid: gridTop(),
      xAxis: [Object.assign({ type: 'value', name: data.xName + '(%)', splitLine: { lineStyle: { color: theme.grid } } }, axisCommon(theme))],
      yAxis: [Object.assign({ type: 'value', name: data.yName + '(%)' }, axisCommon(theme))],
      series: [{
        type: 'scatter',
        data: data.data.map(function (d) { return { name: d.name, value: [d.x, d.y, d.size] }; }),
        symbolSize: function (v) { return sizeMin + (v[2] / maxSize) * (sizeMax - sizeMin); },
        itemStyle: { color: hexToRgba(theme.accent, 0.65), borderColor: theme.accent, borderWidth: 1 },
        label: { show: true, position: 'top', color: theme.text, fontSize: 11,
          formatter: function (p) { return p.data.name; } },
        emphasis: { itemStyle: { color: theme.accent, opacity: 1 } }
      }]
    };
    return option;
  }

  /* ---------- 树图 / 板块热力 ---------- */
  function treemap(el, data, theme) {
    var total = data.data.reduce(function (s, d) { return s + d.value; }, 0);
    var option = {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), {
        trigger: 'item',
        formatter: function (p) {
          return p.name + '：' + p.value + ' 万亿元（' + ((p.value / total) * 100).toFixed(1) + '%）';
        }
      }),
      series: [{
        type: 'treemap', roam: false, nodeClick: false, breadcrumb: { show: false },
        data: data.data,
        top: 6, left: 6, right: 6, bottom: 6,
        label: { show: true, color: theme.text, fontSize: 12,
          formatter: function (p) { return p.name + '\n' + p.value.toFixed(1); } },
        itemStyle: { borderColor: theme.bg, borderWidth: 3, gapWidth: 3 },
        levels: [{
          itemStyle: { borderColor: theme.bg, borderWidth: 3, gapWidth: 3 },
          color: theme.series,
          colorSaturation: [0.25, 0.55]
        }]
      }]
    };
    return option;
  }

  /* ---------- 堆叠面积 ---------- */
  function stacked(el, data, theme) {
    var option = lineArea(el, data, theme);
    option.series.forEach(function (s) {
      s.stack = 'total';
      s.areaStyle = { color: hexToRgba(s.color, 0.45), opacity: 1 };
      s.lineStyle.width = 1.5;
    });
    return option;
  }

  /* ---------- 瀑布图 ---------- */
  function waterfall(el, data, theme) {
    var values = data.values, labels = data.labels;
    var n = values.length, last = n - 1;
    var base = [], positive = [], negative = [], sum = 0, cum = [];
    values.forEach(function (v, i) {
      if (i === 0) { base.push('-'); positive.push(v); negative.push('-'); sum = v; cum.push(v); }
      else if (i === last) {
        base.push(sum); cum.push(values[last]);
        var d = values[last] - sum;
        if (d >= 0) { positive.push(d); negative.push('-'); }
        else { positive.push('-'); negative.push(-d); }
      } else {
        if (v >= 0) { base.push(sum); positive.push(v); negative.push('-'); sum += v; }
        else { base.push(sum + v); positive.push('-'); negative.push(-v); sum += v; }
        cum.push(sum);
      }
    });
    var totalColor = hexToRgba(theme.accent, 0.85);
    function labelCfg(color) {
      return { show: true, position: 'top', color: theme.muted, fontSize: 11,
        formatter: function (p) { return p.value === '-' ? '' : p.value; } };
    }
    var option = {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), { trigger: 'axis' }),
      grid: { top: 46, left: 12, right: 16, bottom: 8, containLabel: true },
      xAxis: [Object.assign({ type: 'category', data: labels, axisLabel: { color: theme.text, fontSize: 11, interval: 0 } }, axisCommon(theme))],
      yAxis: [Object.assign({ type: 'value' }, axisCommon(theme))],
      series: [
        { name: '占位', type: 'bar', stack: 'w', itemStyle: { color: 'transparent' }, data: base, silent: true, tooltip: { show: false } },
        { name: '增长', type: 'bar', stack: 'w', data: positive, label: labelCfg(theme.up),
          itemStyle: { color: theme.up, borderRadius: 2 } },
        { name: '下降', type: 'bar', stack: 'w', data: negative, label: labelCfg(theme.down),
          itemStyle: { color: theme.down, borderRadius: 2 } }
      ]
    };
    // 首尾总额高亮
    option.series[1].data = positive.map(function (v, i) {
      if (i === 0 || i === last) { return { value: v, itemStyle: { color: totalColor } }; }
      return v;
    });
    return option;
  }

  /* ---------- 环形图 ---------- */
  function donut(el, data, theme) {
    var total = data.data.reduce(function (s, d) { return s + d.value; }, 0);
    var option = {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), { trigger: 'item', formatter: function (p) { return p.name + '：' + p.value + '%'; } }),
      legend: Object.assign(legend(theme), { orient: 'vertical', right: 12, top: 'center', itemWidth: 10, itemHeight: 10 }),
      series: [{
        type: 'pie', radius: ['58%', '80%'], center: ['38%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: theme.bg, borderWidth: 2 },
        label: { show: false },
        labelLine: { show: false },
        data: data.data.map(function (d, i) { return { name: d.name, value: d.value, itemStyle: { color: theme.series[i % theme.series.length] } }; }),
        emphasis: { scale: true, scaleSize: 6 }
      }],
      graphic: [{
        type: 'text', left: '34%', top: '44%',
        style: { text: total + '%', fill: theme.text, fontSize: 26, fontWeight: 700, textAlign: 'center' }
      }, {
        type: 'text', left: '35%', top: '56%',
        style: { text: '合计占比', fill: theme.muted, fontSize: 12, textAlign: 'center' }
      }]
    };
    return option;
  }

  /* ---------- 迷你图（KPI 卡） ---------- */
  function sparkline(el, values, theme, color) {
    var c = color || theme.accent;
    return {
      grid: { top: 4, left: 4, right: 4, bottom: 4 },
      xAxis: { type: 'category', show: false, boundaryGap: false, data: values.map(function (_, i) { return i; }) },
      yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
      series: [{
        type: 'line', data: values, smooth: true, symbol: 'none',
        lineStyle: { color: c, width: 1.8 },
        areaStyle: { color: areaGradient(echarts, c) }
      }]
    };
  }

  /* ============================================================
   * 事件标注 & 水印（通用后处理）
   * ============================================================ */
  function applyEvents(option, events, theme) {
    if (!option.series || !option.series.length) return;
    var color = theme.accent;
    option.series[0].markLine = {
      silent: true,
      symbol: ['none', 'none'],
      lineStyle: { color: color, width: 1, type: 'dashed', opacity: 0.8 },
      label: {
        show: true, position: 'insideEndTop', rotate: 0,
        color: color, fontSize: 10, fontWeight: 600, distance: 4,
        textAlign: 'center', verticalAlign: 'bottom'
      },
      data: events.map(function (e) {
        return { xAxis: e.x, label: { formatter: e.label } };
      })
    };
  }

  /* 图上说明标注（markPoint） */
  function applyAnnotations(option, annotations, theme) {
    if (!option.series || !option.series.length || !annotations || !annotations.length) return;
    var mp = {
      data: annotations.map(function (a) {
        return {
          xAxis: a.cat, yAxis: a.val, symbolSize: 6,
          itemStyle: { color: theme.accent },
          label: {
            show: true, position: 'top', formatter: a.text,
            color: theme.text, fontSize: 11, fontWeight: 600,
            backgroundColor: theme.panel, borderColor: theme.accent, borderWidth: 1,
            borderRadius: 4, padding: [4, 8]
          }
        };
      })
    };
    if (!option.series[0].markPoint) option.series[0].markPoint = mp;
    else option.series[0].markPoint.data = (option.series[0].markPoint.data || []).concat(mp.data);
  }

  function addWatermark(option, theme) {
    var wm = {
      type: 'text', left: 'center', top: 'middle', z: 0, silent: true,
      style: {
        text: 'AFG', fill: hexToRgba(theme.text, 0.045),
        font: '800 44px Inter, sans-serif', letterSpacing: 6, textAlign: 'center'
      }
    };
    if (option.graphic == null) option.graphic = [];
    if (!Array.isArray(option.graphic)) option.graphic = [option.graphic];
    option.graphic.push(wm);
  }

  /* ============================================================
   * 机器学习模版
   * ============================================================ */

  /* 线性回归趋势 + 置信带 */
  function mlTrend(el, data, theme) {
    var ys = data.values, n = ys.length;
    var xs = [];
    for (var i = 0; i < n; i++) xs.push(i);
    var lr = ML.linearRegression(xs, ys);
    var fitted = [], lower = [], upper = [];
    for (i = 0; i < n; i++) {
      var f = lr.intercept + lr.slope * xs[i];
      var se = lr.sxx > 0 ? lr.residStd * Math.sqrt(1 + 1 / n + (xs[i] - lr.xmean) * (xs[i] - lr.xmean) / lr.sxx) : lr.residStd;
      fitted.push(Math.round(f * 100) / 100);
      lower.push(Math.round((f - 1.96 * se) * 100) / 100);
      upper.push(Math.round((f + 1.96 * se) * 100) / 100);
    }
    var width = upper.map(function (u, k) { return Math.round((u - lower[k]) * 100) / 100; });
    var option = {
      backgroundColor: theme.bg,
      tooltip: tooltip(theme),
      legend: legend(theme),
      grid: gridZoom(),
      dataZoom: dataZoomCfg(theme),
      xAxis: [Object.assign({ type: 'category', boundaryGap: false, data: data.labels }, axisCommon(theme))],
      yAxis: [Object.assign({ type: 'value', scale: true }, axisCommon(theme))],
      series: [
        { name: '置信下界', type: 'line', data: lower, stack: 'ci', symbol: 'none', lineStyle: { opacity: 0 }, tooltip: { show: false } },
        { name: '95% 置信带', type: 'line', data: width, stack: 'ci', symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: hexToRgba(theme.up, 0.16) } },
        { name: '回归趋势', type: 'line', data: fitted, symbol: 'none', color: theme.up, lineStyle: { width: 2.6 } },
        { name: '观测值', type: 'scatter', data: ys, symbolSize: 7, itemStyle: { color: theme.accent, opacity: 0.9, borderColor: theme.bg, borderWidth: 1 } }
      ],
      graphic: [{ type: 'text', right: 20, top: 10, style: { text: 'R² = ' + lr.r2.toFixed(3), fill: theme.muted, fontSize: 12 } }]
    };
    return option;
  }

  /* 时间序列预测 · 扇面图 */
  function mlForecast(el, data, theme) {
    var ys = data.values, n = ys.length, horizon = data.horizon || 3;
    var xs = [];
    for (var i = 0; i < n; i++) xs.push(i);
    var fc = ML.forecast(xs, ys, horizon);
    var labels = data.labels.concat(data.forecastLabels || []);
    var full = labels.length;
    function padHist(arr) { var a = arr.slice(); while (a.length < full) a.push(null); return a; }
    function padFc(arr) { var a = []; for (var k = 0; k < n; k++) a.push(null); return a.concat(arr); }

    var histSeries = { name: '历史', type: 'line', data: padHist(ys), symbol: 'none', color: theme.accent, lineStyle: { width: 2.6 } };
    var fcLine = { name: '预测', type: 'line', data: padFc(fc.line.map(function (p) { return Math.round(p.y * 100) / 100; })), symbol: 'none', color: theme.up, lineStyle: { width: 2.6, type: 'dashed' } };

    var series = [];
    // 由外到内绘制三层扇面
    var alphas = [0.10, 0.18, 0.30];
    for (var l = 0; l < fc.bands[0].length; l++) { // 0=50%(内) 1=80% 2=90%(外)
      var level = fc.bands[0].length - 1 - l; // 从最外层(90%)开始
      var lowers = [], widths = [];
      for (var k = 0; k < n; k++) { lowers.push(null); widths.push(null); }
      for (var k = 0; k < horizon; k++) {
        var b = fc.bands[k][level];
        lowers.push(Math.round(b.lower * 100) / 100);
        widths.push(Math.round((b.upper - b.lower) * 100) / 100);
      }
      var a = alphas[level];
      series.push({ name: fc.bands[0][level].label + ' 区间下界', type: 'line', data: lowers, stack: 'fan' + level, symbol: 'none', lineStyle: { opacity: 0 }, tooltip: { show: false } });
      series.push({ name: fc.bands[0][level].label + ' 置信区间', type: 'line', data: widths, stack: 'fan' + level, symbol: 'none', lineStyle: { opacity: 0 }, areaStyle: { color: hexToRgba(theme.up, a) } });
    }
    series.push(fcLine);
    series.push(histSeries);

    var option = {
      backgroundColor: theme.bg,
      tooltip: tooltip(theme),
      legend: legend(theme),
      grid: gridZoom(),
      dataZoom: dataZoomCfg(theme),
      xAxis: [Object.assign({ type: 'category', boundaryGap: false, data: labels }, axisCommon(theme))],
      yAxis: [Object.assign({ type: 'value', scale: true }, axisCommon(theme))],
      series: series
    };
    return option;
  }

  /* K-Means 聚类 */
  function mlCluster(el, data, theme) {
    var k = data.k || 3;
    var res = ML.kmeans(data.data, k);
    var series = [];
    for (var c = 0; c < k; c++) {
      series.push({
        name: '簇 ' + (c + 1), type: 'scatter',
        data: data.data.filter(function (_, i) { return res.assignment[i] === c; })
          .map(function (d) { return { name: d.name, value: [d.x, d.y] }; }),
        symbolSize: 15,
        itemStyle: { color: hexToRgba(theme.series[c % theme.series.length], 0.6), borderColor: theme.series[c % theme.series.length], borderWidth: 1 },
        label: { show: true, position: 'top', color: theme.text, fontSize: 10.5, formatter: function (p) { return p.data.name; } }
      });
    }
    series.push({
      name: '聚类中心', type: 'scatter',
      data: res.centroids.map(function (ct) { return { value: [ct.x, ct.y] }; }),
      symbolSize: 26, symbol: 'diamond',
      itemStyle: { color: theme.text, borderColor: theme.accent, borderWidth: 2 },
      label: { show: false }
    });
    var option = {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), {
        trigger: 'item',
        formatter: function (p) {
          if (!p.data.name) return '聚类中心';
          return p.data.name + '<br/>' + (data.xName || 'X') + '：' + p.value[0] + '<br/>' + (data.yName || 'Y') + '：' + p.value[1];
        }
      }),
      grid: gridTop(),
      xAxis: [Object.assign({ type: 'value', name: data.xName || '', splitLine: { lineStyle: { color: theme.grid } } }, axisCommon(theme))],
      yAxis: [Object.assign({ type: 'value', name: data.yName || '' }, axisCommon(theme))],
      series: series
    };
    return option;
  }

  /* 相关性矩阵 */
  function mlCorr(el, data, theme) {
    var res = ML.correlationMatrix(data.series);
    var names = res.names, mat = res.matrix;
    var cells = [];
    for (var i = 0; i < names.length; i++)
      for (var j = 0; j < names.length; j++)
        cells.push([j, i, Math.round(mat[i][j] * 100) / 100]);
    var option = {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), { position: 'top', formatter: function (p) { return names[p.value[1]] + ' × ' + names[p.value[0]] + '：' + p.value[2].toFixed(2); } }),
      grid: { top: 12, left: 12, right: 74, bottom: 8, containLabel: true },
      xAxis: [Object.assign({ type: 'category', data: names, splitArea: { show: true }, axisLabel: { color: theme.muted, fontSize: 10, interval: 0, rotate: 30 } }, axisCommon(theme))],
      yAxis: [Object.assign({ type: 'category', data: names, splitArea: { show: true }, axisLabel: { color: theme.muted, fontSize: 10 } }, axisCommon(theme))],
      visualMap: {
        min: -1, max: 1, calculable: false, orient: 'vertical', right: 6, top: 'middle',
        itemWidth: 10, itemHeight: 90, textStyle: { color: theme.muted, fontSize: 10 },
        inRange: { color: [hexToRgba(theme.down, 0.95), theme.bg, hexToRgba(theme.accent, 0.95)] }
      },
      series: [{
        type: 'heatmap', data: cells,
        label: { show: true, color: theme.text, fontSize: 10, formatter: function (p) { return p.value[2].toFixed(2); } },
        itemStyle: { borderColor: theme.bg, borderWidth: 3 },
        emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,.5)' } }
      }]
    };
    return option;
  }

  /* 收益分布直方图 + KDE */
  function mlDist(el, data, theme) {
    var values = data.values;
    var hist = ML.histogram(values, 30);
    var pad = hist.step * 1.5;
    var kde = ML.kde(values, 120, hist.min - pad, hist.max + pad);
    var mu = ML.mean(values), sd = ML.std(values);
    var maxCount = Math.max.apply(null, hist.counts);
    var maxDensity = Math.max.apply(null, kde.y);
    var scale = maxDensity > 0 ? maxCount / maxDensity : 1;

    var option = {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), { trigger: 'axis' }),
      grid: gridTop(),
      xAxis: [Object.assign({ type: 'value', name: data.unit || '', scale: true }, axisCommon(theme))],
      yAxis: [
        Object.assign({ type: 'value', name: '频数' }, axisCommon(theme)),
        Object.assign({ type: 'value', name: '密度', splitLine: { show: false } }, axisCommon(theme))
      ],
      series: [
        { name: '频数', type: 'bar', data: hist.counts, yAxisIndex: 0, barMaxWidth: 20,
          itemStyle: { color: hexToRgba(theme.accent, 0.55), borderRadius: [3, 3, 0, 0] } },
        { name: '核密度', type: 'line', data: kde.y.map(function (y) { return Math.round(y * scale * 100) / 100; }), yAxisIndex: 1,
          smooth: true, symbol: 'none', color: theme.up, lineStyle: { width: 2.4 } }
      ],
      graphic: [{ type: 'text', right: 20, top: 10, style: { text: 'μ = ' + mu.toFixed(2) + '　σ = ' + sd.toFixed(2), fill: theme.muted, fontSize: 12 } }]
    };
    return option;
  }

  /* ---------- 基金/ETF 业绩评估（净值 + 回撤，可缩放） ---------- */
  function perf(el, data, theme) {
    var nav = data.nav;
    var labels = nav.map(function (p) { return p.date; });
    var values = nav.map(function (p) { return p.value; });
    var dd = [], peak = -Infinity;
    values.forEach(function (v) { peak = Math.max(peak, v); dd.push(Math.round((v / peak - 1) * 10000) / 100); });
    var series = [
      { name: (data.name || '净值'), type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: values, symbol: 'none', color: theme.accent, lineStyle: { width: 2.4 }, areaStyle: { color: areaGradient(echarts, theme.accent) } }
    ];
    if (data.bench) {
      series.push({ name: '基准', type: 'line', xAxisIndex: 0, yAxisIndex: 0, data: data.bench.map(function (p) { return p.value; }), symbol: 'none', color: theme.muted, lineStyle: { width: 1.6, type: 'dashed' } });
    }
    series.push({ name: '回撤', type: 'line', xAxisIndex: 1, yAxisIndex: 1, data: dd, symbol: 'none', color: theme.down, lineStyle: { width: 1.2 }, areaStyle: { color: hexToRgba(theme.down, 0.18) } });
    var option = {
      backgroundColor: theme.bg,
      tooltip: tooltip(theme),
      legend: legend(theme),
      axisPointer: { link: [{ xAxisIndex: 'all' }] },
      grid: [
        { left: 12, right: 16, top: 46, height: '48%', containLabel: true },
        { left: 12, right: 16, bottom: 46, height: '20%', containLabel: true }
      ],
      xAxis: [
        Object.assign({ type: 'category', gridIndex: 0, data: labels, axisLabel: { show: false } }, axisCommon(theme)),
        Object.assign({ type: 'category', gridIndex: 1, data: labels }, axisCommon(theme))
      ],
      yAxis: [
        Object.assign({ type: 'value', gridIndex: 0, scale: true }, axisCommon(theme)),
        Object.assign({ type: 'value', gridIndex: 1, max: 0, axisLabel: { color: theme.muted, fontSize: 10, formatter: '{value}%' } }, axisCommon(theme))
      ],
      dataZoom: [
        { type: 'inside', xAxisIndex: [0, 1], zoomOnMouseWheel: true, moveOnMouseMove: true },
        { type: 'slider', xAxisIndex: [0, 1], height: 26, bottom: 4, borderColor: 'transparent', backgroundColor: hexToRgba(theme.text, 0.04), fillerColor: hexToRgba(theme.accent, 0.14), handleStyle: { color: theme.accent, borderColor: theme.accent }, textStyle: { color: theme.muted, fontSize: 10 } }
      ],
      series: series
    };
    return option;
  }

  /* ---------- 散点图矩阵（关联探索） ---------- */
  function scatterMatrix(el, data, theme) {
    var ss = data.series.slice(0, 4);
    var n = ss.length;
    var corr = ML.correlationMatrix(ss).matrix;
    var grids = [], xAxes = [], yAxes = [], scatterSeries = [], graphics = [];
    var pct = 100 / n;
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        var gi = r * n + c;
        grids.push({ left: (c * pct) + '%', top: (r * pct) + '%', width: pct + '%', height: pct + '%' });
        xAxes.push({ gridIndex: gi, type: 'value', show: false, scale: true });
        yAxes.push({ gridIndex: gi, type: 'value', show: false, scale: true });
        var pts = [];
        var len = Math.min(ss[r].values.length, ss[c].values.length);
        for (var k = 0; k < len; k++) pts.push([ss[c].values[k], ss[r].values[k]]);
        scatterSeries.push({
          type: 'scatter', xAxisIndex: gi, yAxisIndex: gi, data: pts, symbolSize: 2.5,
          itemStyle: { color: r === c ? hexToRgba(theme.muted, 0.5) : hexToRgba(theme.accent, 0.55) },
          emphasis: { focus: 'series' }
        });
        if (r < c) {
          graphics.push({ type: 'text', left: ((c + 0.5) * pct) + '%', top: ((r + 0.5) * pct - 3) + '%', silent: true, style: { text: 'r=' + corr[r][c].toFixed(2), fill: theme.text, fontSize: 11, font: '700 11px Inter, sans-serif', textAlign: 'center' } });
          graphics.push({ type: 'text', left: ((c + 0.5) * pct) + '%', top: ((r + 0.5) * pct + 3) + '%', silent: true, style: { text: (ss[r].name || '') + ' × ' + (ss[c].name || ''), fill: theme.muted, fontSize: 8.5, textAlign: 'center' } });
        }
      }
    }
    return {
      backgroundColor: theme.bg, tooltip: tooltip(theme), grid: grids, xAxis: xAxes, yAxis: yAxes,
      series: scatterSeries, graphic: graphics
    };
  }

  /* ---------- 世界地图着色 ---------- */
  function worldMap(el, data, theme) {
    var values = data.values || [];
    var max = -Infinity, min = Infinity;
    values.forEach(function (d) { max = Math.max(max, d.value); min = Math.min(min, d.value); });
    return {
      backgroundColor: theme.bg,
      tooltip: Object.assign({}, tooltip(theme), {
        trigger: 'item',
        formatter: function (p) { return p.name + '：' + (p.value !== undefined && !isNaN(p.value) ? p.value : '无数据'); }
      }),
      visualMap: {
        min: Math.min(min, -1), max: Math.max(max, 1), calculable: false, orient: 'vertical', right: 8, top: 'middle',
        itemWidth: 10, itemHeight: 100, textStyle: { color: theme.muted, fontSize: 10 },
        inRange: { color: [hexToRgba(theme.down, 0.85), theme.bg, hexToRgba(theme.accent, 0.9)] }
      },
      series: [{
        type: 'map', map: 'world', roam: true, zoom: 1.15,
        nameProperty: 'name',
        itemStyle: { areaColor: hexToRgba(theme.text, 0.06), borderColor: hexToRgba(theme.text, 0.25), borderWidth: 0.6 },
        emphasis: { itemStyle: { areaColor: hexToRgba(theme.accent, 0.4) }, label: { show: true, color: theme.text, fontSize: 11 } },
        label: { show: false },
        data: values
      }]
    };
  }

  /* ---------- 分发 ---------- */
  var BUILDERS = {
    'area': lineArea, 'line': lineOnly, 'bar': barChart, 'step': stepLine,
    'dual': dual, 'heatmap': heatmap, 'rank': rank, 'bubble': bubble,
    'treemap': treemap, 'stacked': stacked, 'waterfall': waterfall, 'donut': donut,
    'mlTrend': mlTrend, 'mlForecast': mlForecast, 'mlCluster': mlCluster,
    'mlCorr': mlCorr, 'mlDist': mlDist, 'stackedBar': stackedBar, 'radar': radar,
    'perf': perf, 'scatterMatrix': scatterMatrix, 'worldMap': worldMap
  };

  function render(el, type, data, theme) {
    var builder = BUILDERS[type];
    if (!builder) throw new Error('未知图表类型: ' + type);
    var option = builder(el, data, theme);
    if (data && data.events && data.events.length) applyEvents(option, data.events, theme);
    if (data && data.annotations && data.annotations.length) applyAnnotations(option, data.annotations, theme);
    if (data && data.showAllLabels) {
      option.series.forEach(function (s) {
        var hidden = (s.lineStyle && s.lineStyle.opacity === 0) || (s.tooltip && s.tooltip.show === false) || s.stack;
        if (hidden || (s.type !== 'line' && s.type !== 'bar')) return;
        s.label = {
          show: true, position: 'top', distance: 3, color: theme.muted, fontSize: 9,
          formatter: function (p) { return (p.value === null || p.value === undefined || isNaN(p.value)) ? '' : fmt(p.value); }
        };
      });
    }
    if (watermarkOn) addWatermark(option, theme);
    option.animationDuration = 900;
    option.animationEasing = 'cubicOut';
    option.animationDurationUpdate = 500;
    var inst = echarts.getInstanceByDom(el) || echarts.init(el);
    inst.setOption(option, true);
    instances.push(inst);
    return inst;
  }

  function renderKpiSpark(el, values, theme, color) {
    var option = sparkline(el, values, theme, color);
    var inst = echarts.getInstanceByDom(el) || echarts.init(el);
    inst.setOption(option, true);
    instances.push(inst);
    return inst;
  }

  function disposeAll() {
    instances.forEach(function (i) { try { i.dispose(); } catch (e) {} });
    instances = [];
  }

  function resizeAll() {
    instances.forEach(function (i) { try { i.resize(); } catch (e) {} });
  }

  global.ChartFactory = { render: render, renderKpiSpark: renderKpiSpark, disposeAll: disposeAll, resizeAll: resizeAll, BUILDERS: BUILDERS, setWatermark: setWatermark };
})(window);
