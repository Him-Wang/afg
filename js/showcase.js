/* ADV 高级案例（D3.js）：区别于常规 ECharts 的定制可视化 */
(function (global) {
  'use strict';

  var FONT = '"Inter","Helvetica Neue","PingFang SC",sans-serif';
  var S = {};   // type -> render(container, data, theme)

  function size(el) {
    var w = el.clientWidth || 700, h = el.clientHeight || 380;
    return { w: w, h: h };
  }
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
  function pal(t, i) {
    var a = (t && t.series && t.series.length) ? t.series : ['#1A1A2E', '#A67C3D', '#6F8FA8', '#7A5C3E', '#8A8A99', '#3E5A4E'];
    return a[i % a.length];
  }
  function clear(el) { el.innerHTML = ''; }

  /* 通用：建立 svg 容器 */
  function svgRoot(el, theme) {
    clear(el);
    var d = size(el);
    var d3 = global.d3;
    var svg = d3.select(el).append('svg')
      .attr('width', d.w).attr('height', d.h)
      .attr('viewBox', [0, 0, d.w, d.h])
      .style('display', 'block');
    return { svg: svg, w: d.w, h: d.h };
  }


  /* ---------- 悬停提示（D3 图专用） ---------- */
  function makeTip(el, theme) {
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var tip = document.createElement('div');
    tip.className = 'd3-tip';
    tip.style.cssText = 'position:absolute;left:0;top:0;pointer-events:none;opacity:0;transition:opacity .12s ease;' +
      'background:#fff;border:1px solid rgba(26,26,46,.12);border-radius:8px;padding:7px 10px;' +
      'font:11.5px/1.5 ' + FONT + ';color:' + ink(theme) + ';box-shadow:0 8px 24px rgba(20,20,35,.12);z-index:30;white-space:nowrap;';
    el.appendChild(tip);
    return {
      show: function (html, x, y) {
        tip.innerHTML = html;
        tip.style.opacity = 1;
        var w = tip.offsetWidth, h = tip.offsetHeight;
        var lx = x + 14, ly = y - h - 10;
        if (lx + w > el.clientWidth - 6) lx = x - w - 14;
        if (ly < 4) ly = y + 14;
        tip.style.left = Math.max(4, lx) + 'px';
        tip.style.top = Math.max(4, ly) + 'px';
      },
      hide: function () { tip.style.opacity = 0; }
    };
  }

  /* ============ 1. 力导向关系网络 ============ */
  S.scForce = function (el, data, theme) {
    if (!global.d3) return;
    var d3 = global.d3;
    var r = svgRoot(el, theme);
    var nodes = data.nodes.map(function (n) { return Object.assign({}, n); });
    var links = data.links.map(function (l) { return Object.assign({}, l); });

    var g = r.svg.append('g');
    var linkSel = g.append('g').attr('class', 'links')
      .selectAll('path').data(links).join('path')
      .attr('fill', 'none')
      .attr('stroke', rgba(ink(theme), 0.16))
      .attr('stroke-width', function (l) { return Math.max(0.8, Math.sqrt(l.value) * 0.9); });

    var nodeSel = g.append('g').selectAll('g').data(nodes).join('g');

    nodeSel.append('circle')
      .attr('r', function (n) { return 5 + Math.sqrt(n.value) * 1.9; })
      .attr('fill', function (n, i) { return rgba(pal(theme, n.group || i), 0.72); })
      .attr('stroke', '#fff').attr('stroke-width', 1.5)
      .style('cursor', 'pointer');

    nodeSel.append('text')
      .text(function (n) { return n.name; })
      .attr('text-anchor', 'middle')
      .attr('dy', function (n) { return 5 + Math.sqrt(n.value) * 1.9 + 12; })
      .attr('font-family', FONT)
      .attr('font-size', 9.5)
      .attr('fill', muted(theme));

    var sc = Math.max(1, Math.min(r.w, r.h) / 280);   // 大画布自动放大斥力与连线
    var tip = makeTip(el, theme);
    nodeSel
      .on('mouseenter', function (ev, n) {
        var related = links.filter(function (l) { return l.source.id === n.id || l.target.id === n.id; }).length;
        tip.show('<b>' + n.name + '</b><br/>权重 ' + n.value + ' · 关联 ' + related + ' 条', ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
        d3.select(this).select('circle').transition().duration(120).attr('r', 5 + Math.sqrt(n.value) * 1.9 + 4);
        nodeSel.transition().duration(120).style('opacity', function (o) {
          return (o.id === n.id || links.some(function (l) { return (l.source.id === n.id && l.target.id === o.id) || (l.target.id === n.id && l.source.id === o.id); })) ? 1 : 0.18;
        });
        linkSel.transition().duration(120).style('opacity', function (l) {
          return (l.source.id === n.id || l.target.id === n.id) ? 1 : 0.08;
        });
      })
      .on('mousemove', function (ev, n) {
        tip.show('<b>' + n.name + '</b><br/>权重 ' + n.value, ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
      })
      .on('mouseleave', function (ev, n) {
        tip.hide();
        d3.select(this).select('circle').transition().duration(120).attr('r', 5 + Math.sqrt(n.value) * 1.9);
        nodeSel.transition().duration(150).style('opacity', 1);
        linkSel.transition().duration(150).style('opacity', 1);
      });

    var sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(function (n) { return n.id; }).distance(function (l) { return (60 + Math.sqrt(l.value) * 8) * sc; }).strength(0.35))
      .force('charge', d3.forceManyBody().strength(function (n) { return (-60 - n.value * 3) * sc * sc; }))
      .force('center', d3.forceCenter(r.w / 2, r.h / 2))
      .force('collide', d3.forceCollide().radius(function (n) { return 8 + Math.sqrt(n.value) * 2.4; }))
      .force('x', d3.forceX(r.w / 2).strength(0.06))
      .force('y', d3.forceY(r.h / 2).strength(0.06))
      .on('tick', function () {
        nodes.forEach(function (n) {
          var rr = 8 + Math.sqrt(n.value) * 2.4;
          n.x = Math.max(rr + 4, Math.min(r.w - rr - 4, n.x));
          n.y = Math.max(rr + 4, Math.min(r.h - rr - 16, n.y));
        });
        linkSel.attr('d', function (l) {
          var dx = l.target.x - l.source.x, dy = l.target.y - l.source.y;
          var dr = Math.sqrt(dx * dx + dy * dy) * 1.6;
          return 'M' + l.source.x + ',' + l.source.y + 'A' + dr + ',' + dr + ' 0 0,1 ' + l.target.x + ',' + l.target.y;
        });
        nodeSel.attr('transform', function (n) { return 'translate(' + n.x + ',' + n.y + ')'; });
      });

    return function () { sim.stop(); };
  };

  /* ============ 2. 和弦图（渐变丝带） ============ */
  S.scChord = function (el, data, theme) {
    if (!global.d3) return;
    var d3 = global.d3;
    var r = svgRoot(el, theme);
    var names = data.names, m = data.matrix;
    var n = names.length;
    /* 构建矩阵（含对角为 0） */
    var matrix = m.map(function (row) { return row.slice(); });

    var outer = Math.min(r.w, r.h) / 2 - 26;
    var inner = outer - 14;
    var g = r.svg.append('g').attr('transform', 'translate(' + (r.w / 2) + ',' + (r.h / 2) + ')');

    var chord = d3.chord().padAngle(0.035).sortSubgroups(d3.descending)(matrix);
    var arc = d3.arc().innerRadius(inner).outerRadius(outer);
    var ribbon = d3.ribbon().radius(inner - 1);

    var defs = r.svg.append('defs');
    chord.groups.forEach(function (d, i) {
      var grd = defs.append('linearGradient')
        .attr('id', 'chordGrad' + i)
        .attr('gradientUnits', 'userSpaceOnUse')
        .attr('x1', -outer).attr('y1', -outer).attr('x2', outer).attr('y2', outer);
      var baseC = pal(theme, d.index);
      /* 同一色相做透明度渐变，多色系下丝带不混浊 */
      grd.append('stop').attr('offset', '0%').attr('stop-color', rgba(baseC, 0.78));
      grd.append('stop').attr('offset', '100%').attr('stop-color', rgba(baseC, 0.34));
    });

    var tipC = makeTip(el, theme);
    g.append('g').selectAll('path').data(chord).join('path')
      .attr('d', ribbon)
      .attr('fill', function (d) { return 'url(#chordGrad' + d.source.index + ')'; })
      .attr('stroke', rgba(ink(theme), 0.12))
      .attr('stroke-width', 0.5)
      .attr('opacity', 0.9)
      .style('cursor', 'pointer')
      .on('mouseenter', function (ev, d) {
        g.selectAll('path').transition().duration(120).attr('opacity', 0.12);
        d3.select(this).transition().duration(120).attr('opacity', 1).attr('stroke', rgba(ink(theme), 0.45));
        tipC.show('<b>' + names[d.source.index] + ' → ' + names[d.target.index] + '</b><br/>规模 ' + d.source.value.toFixed(1), ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
      })
      .on('mousemove', function (ev, d) {
        tipC.show('<b>' + names[d.source.index] + ' → ' + names[d.target.index] + '</b><br/>规模 ' + d.source.value.toFixed(1), ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
      })
      .on('mouseleave', function () {
        g.selectAll('path').transition().duration(150).attr('opacity', 0.9);
        d3.select(this).transition().duration(150).attr('stroke', rgba(ink(theme), 0.12));
        tipC.hide();
      });

    var group = g.append('g').selectAll('g').data(chord.groups).join('g');
    group.append('path')
      .attr('d', arc)
      .attr('fill', function (d) { return pal(theme, d.index); })
      .attr('stroke', '#fff').attr('stroke-width', 1.5);
    group.append('text')
      .each(function (d) { d.angle = (d.startAngle + d.endAngle) / 2; })
      .attr('dy', '.35em')
      .attr('transform', function (d) {
        return 'rotate(' + (d.angle * 180 / Math.PI - 90) + ') translate(' + (outer + 4) + ') ' + (d.angle > Math.PI ? 'rotate(180)' : '');
      })
      .attr('text-anchor', function (d) { return d.angle > Math.PI ? 'end' : 'start'; })
      .attr('font-family', FONT).attr('font-size', 10)
      .attr('fill', ink(theme))
      .text(function (d) { return names[d.index]; });

    return function () {};
  };

  /* ============ 3. 径向树 ============ */
  S.scRadialTree = function (el, data, theme) {
    if (!global.d3) return;
    var d3 = global.d3;
    var r = svgRoot(el, theme);
    var radius = Math.min(r.w * 0.47, r.h * 0.50);
    var g = r.svg.append('g').attr('transform', 'translate(' + (r.w / 2) + ',' + (r.h / 2) + ')');

    var root = d3.hierarchy(data.tree);
    d3.tree().size([2 * Math.PI, radius]).separation(function (a, b) { return (a.parent === b.parent ? 1 : 2) / a.depth; })(root);

    g.append('g').selectAll('path').data(root.links()).join('path')
      .attr('d', d3.linkRadial().angle(function (d) { return d.x; }).radius(function (d) { return d.y; }))
      .attr('fill', 'none')
      .attr('stroke', rgba(ink(theme), 0.16))
      .attr('stroke-width', 1.2);

    var node = g.append('g').selectAll('g').data(root.descendants()).join('g')
      .attr('transform', function (d) { return 'rotate(' + (d.x * 180 / Math.PI - 90) + ') translate(' + d.y + ',0)'; });

    var tipT = makeTip(el, theme);
    node.style('cursor', 'pointer')
      .on('mouseenter', function (ev, d) {
        d3.select(this).select('circle').transition().duration(100)
          .attr('r', (d.depth === 0 ? 8 : (d.children ? 5.5 : 3.5)) + 3);
        var path = d.ancestors().reverse().map(function (a) { return a.data.name; }).join(' › ');
        var kids = d.children ? d.children.length : 0;
        node.style('opacity', function (o) { return (o === d || o.parent === d || d.parent === o || d.ancestors().indexOf(o) >= 0) ? 1 : 0.2; });
        tipT.show('<b>' + d.data.name + '</b><br/>' + path + (kids ? '<br/>下级 ' + kids + ' 项' : ''), ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
      })
      .on('mousemove', function (ev, d) {
        var path = d.ancestors().reverse().map(function (a) { return a.data.name; }).join(' › ');
        tipT.show('<b>' + d.data.name + '</b><br/>' + path, ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
      })
      .on('mouseleave', function (ev, d) {
        d3.select(this).select('circle').transition().duration(100)
          .attr('r', d.depth === 0 ? 8 : (d.children ? 5.5 : 3.5));
        node.style('opacity', 1);
        tipT.hide();
      });

    node.append('circle')
      .attr('r', function (d) { return d.depth === 0 ? 8 : (d.children ? 5.5 : 3.5); })
      .attr('fill', function (d) { return d.depth === 0 ? ink(theme) : rgba(pal(theme, d.depth - 1), 0.85); })
      .attr('stroke', '#fff').attr('stroke-width', 1.2);

    var small = Math.min(r.w, r.h) <= 320;
    node.append('text')
      .attr('display', function (d) { return (d.depth <= (small ? 1 : 3)) ? null : 'none'; })
      .attr('dy', '0.31em')
      .attr('x', function (d) { return d.x < Math.PI === !d.children ? 7 : -7; })
      .attr('text-anchor', function (d) { return d.x < Math.PI === !d.children ? 'start' : 'end'; })
      .attr('transform', function (d) { return d.x >= Math.PI ? 'rotate(180)' : null; })
      .attr('font-family', FONT)
      .attr('font-size', function (d) { return small ? (d.depth === 0 ? 10 : 8.5) : (d.depth === 0 ? 12 : 9.5); })
      .attr('font-weight', function (d) { return d.depth === 0 ? 700 : 400; })
      .attr('fill', function (d) { return d.depth === 0 ? ink(theme) : muted(theme); })
      .text(function (d) { return d.data.name; })
      .attr('paint-order', 'stroke')
      .attr('stroke', '#fff').attr('stroke-width', 2.5);

    return function () {};
  };

  /* ============ 4. 六边形密度图 ============ */
  S.scHexbin = function (el, data, theme) {
    if (!global.d3) return;
    var d3 = global.d3;
    var r = svgRoot(el, theme);
    var pts = data.points;
    var x = d3.scaleLinear().domain(d3.extent(pts, function (p) { return p[0]; })).nice().range([36, r.w - 18]);
    var y = d3.scaleLinear().domain(d3.extent(pts, function (p) { return p[1]; })).nice().range([r.h - 26, 14]);
    var R = 11;
    var dx = R * 2 * Math.sin(Math.PI / 3), dy = R * 1.5;
    var bins = {};
    pts.forEach(function (p) {
      var px = x(p[0]), py = y(p[1]);
      var ri = Math.round(py / dy), ci = Math.round((px - (ri % 2) * dx / 2) / dx);
      var key = ri + ':' + ci;
      if (!bins[key]) bins[key] = { cx: (ri % 2) * dx / 2 + ci * dx, cy: ri * dy, n: 0 };
      bins[key].n++;
    });
    var arr = Object.keys(bins).map(function (k) { return bins[k]; });
    var maxN = d3.max(arr, function (b) { return b.n; }) || 1;
    var color = d3.scaleSequential(d3.interpolateRgbBasis([rgba(accent(theme), 0.12), rgba(accent(theme), 0.55), accent(theme)])).domain([1, maxN]);

    var hexPath = d3.line().curve(d3.curveLinearClosed);
    var hexPts = d3.range(6).map(function (i) {
      var a = Math.PI / 3 * i + Math.PI / 6;
      return [R * Math.cos(a), R * Math.sin(a)];
    });

    var tipH = makeTip(el, theme);
    r.svg.append('g').selectAll('path').data(arr).join('path')
      .attr('d', hexPath(hexPts))
      .attr('transform', function (b) { return 'translate(' + b.cx + ',' + b.cy + ')'; })
      .attr('fill', function (b) { return color(b.n); })
      .attr('stroke', '#fff').attr('stroke-width', 1.2)
      .style('cursor', 'pointer')
      .on('mouseenter', function (ev, b) {
        d3.select(this).attr('stroke', ink(theme)).attr('stroke-width', 1.8);
        tipH.show('<b>' + b.n + ' 个样本</b><br/>' + Math.round(x.invert(b.cx)) + ' · ' + Math.round(y.invert(b.cy)), ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
      })
      .on('mousemove', function (ev, b) {
        tipH.show('<b>' + b.n + ' 个样本</b>', ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
      })
      .on('mouseleave', function () {
        d3.select(this).attr('stroke', '#fff').attr('stroke-width', 1.2);
        tipH.hide();
      });

    /* 轴 */
    var gx = r.svg.append('g').attr('transform', 'translate(0,' + (r.h - 26) + ')');
    gx.call(d3.axisBottom(x).ticks(6).tickSize(-(r.h - 40)).tickFormat(''));
    gx.selectAll('.domain').attr('stroke', rgba(ink(theme), 0.15));
    gx.selectAll('.tick line').attr('stroke', rgba(ink(theme), 0.06));
    r.svg.append('g').attr('transform', 'translate(36,0)').call(d3.axisLeft(y).ticks(5).tickSize(0))
      .call(function (g) { g.select('.domain').remove(); })
      .selectAll('text').attr('fill', muted(theme)).attr('font-size', 9).attr('font-family', FONT);
    gx.selectAll('text').attr('fill', muted(theme)).attr('font-size', 9).attr('font-family', FONT);

    return function () {};
  };

  /* ============ 5. 发光折线（终端风） ============ */
  S.scGlowLine = function (el, data, theme) {
    if (!global.d3) return;
    var d3 = global.d3;
    var r = svgRoot(el, theme);
    var s = data.series[0];
    var vals = s.values.map(function (v, i) { return { i: i, v: v }; });
    var x = d3.scaleLinear().domain([0, vals.length - 1]).range([26, r.w - 16]);
    var y = d3.scaleLinear().domain(d3.extent(vals, function (d) { return d.v; })).nice().range([r.h - 30, 18]);

    var defs = r.svg.append('defs');
    var grd = defs.append('linearGradient').attr('id', 'glowGrad')
      .attr('x1', '0%').attr('y1', '0%').attr('x2', '0%').attr('y2', '100%');
    grd.append('stop').attr('offset', '0%').attr('stop-color', rgba(accent(theme), 0.35));
    grd.append('stop').attr('offset', '100%').attr('stop-color', rgba(accent(theme), 0));

    var area = d3.area().x(function (d) { return x(d.i); }).y0(r.h - 30).y1(function (d) { return y(d.v); }).curve(d3.curveMonotoneX);
    var line = d3.line().x(function (d) { return x(d.i); }).y(function (d) { return y(d.v); }).curve(d3.curveMonotoneX);

    r.svg.append('path').datum(vals).attr('d', area).attr('fill', 'url(#glowGrad)');
    /* 发光层 */
    r.svg.append('path').datum(vals).attr('d', line)
      .attr('fill', 'none').attr('stroke', accent(theme)).attr('stroke-width', 7)
      .attr('opacity', 0.14).attr('filter', 'blur(1px)');
    var path = r.svg.append('path').datum(vals).attr('d', line)
      .attr('fill', 'none').attr('stroke', accent(theme)).attr('stroke-width', 1.8);

    /* 末端点 + 数值 */
    var last = vals[vals.length - 1];
    r.svg.append('circle').attr('cx', x(last.i)).attr('cy', y(last.v)).attr('r', 3.5).attr('fill', accent(theme));
    r.svg.append('text').attr('x', x(last.i) - 4).attr('y', y(last.v) - 9)
      .attr('text-anchor', 'end').attr('font-family', FONT).attr('font-size', 11).attr('font-weight', 700)
      .attr('fill', ink(theme)).text(Number(last.v.toFixed(2)));

    /* 悬停：十字线 + 最近点数值 */
    var tipL = makeTip(el, theme);
    var vline = r.svg.append('line').attr('y1', 14).attr('y2', r.h - 30)
      .attr('stroke', rgba(ink(theme), 0.25)).attr('stroke-dasharray', '3 3').attr('opacity', 0);
    var vdot = r.svg.append('circle').attr('r', 4).attr('fill', accent(theme)).attr('opacity', 0);
    var overlay = r.svg.append('rect')
      .attr('x', 26).attr('y', 14).attr('width', Math.max(1, r.w - 42)).attr('height', r.h - 44)
      .attr('fill', 'transparent').style('cursor', 'crosshair');
    overlay.on('mousemove', function (ev) {
      var mx = d3.pointer(ev, r.svg.node())[0];
      var i = Math.max(0, Math.min(vals.length - 1, Math.round(x.invert(mx))));
      var d = vals[i];
      vline.attr('x1', x(i)).attr('x2', x(i)).attr('opacity', 1);
      vdot.attr('cx', x(i)).attr('cy', y(d.v)).attr('opacity', 1);
      tipL.show('<b>' + (data.labels[i] || '') + '</b><br/>' + Number(d.v.toFixed(2)), ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
    }).on('mouseleave', function () {
      vline.attr('opacity', 0); vdot.attr('opacity', 0); tipL.hide();
    });

    var gx = r.svg.append('g').attr('transform', 'translate(0,' + (r.h - 30) + ')')
      .call(d3.axisBottom(x).ticks(6).tickFormat(function (i) { return data.labels[Math.round(i)] || ''; }).tickSize(0));
    gx.select('.domain').attr('stroke', rgba(ink(theme), 0.15));
    gx.selectAll('text').attr('fill', muted(theme)).attr('font-size', 9).attr('font-family', FONT);

    return function () {};
  };

  /* ============ 6. 阶梯瀑布（D3 动画） ============ */
  S.scWaterfall = function (el, data, theme) {
    if (!global.d3) return;
    var d3 = global.d3;
    var r = svgRoot(el, theme);
    var vals = data.values, labels = data.labels;
    var cum = [], run = 0;
    vals.forEach(function (v, i) {
      var isT = (i === 0 || i === vals.length - 1);
      if (isT) { cum.push({ y0: 0, y1: v, total: true }); run = v; }
      else if (v >= 0) { cum.push({ y0: run, y1: run + v }); run += v; }
      else { cum.push({ y0: run + v, y1: run }); run += v; }
    });
    var maxV = d3.max(cum, function (d) { return Math.max(d.y0, d.y1); });
    var x = d3.scaleBand().domain(labels).range([20, r.w - 20]).padding(0.34);
    var y = d3.scaleLinear().domain([0, maxV * 1.1]).range([r.h - 34, 16]);

    var g = r.svg.append('g');
    var tipW = makeTip(el, theme);
    g.selectAll('rect').data(cum).join('rect')
      .style('cursor', 'pointer')
      .on('mouseenter', function (ev, d) {
        var i = cum.indexOf(d);
        d3.select(this).attr('opacity', 1);
        tipW.show('<b>' + labels[i] + '</b><br/>' + (vals[i] >= 0 ? '+' : '') + vals[i], ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
      })
      .on('mousemove', function (ev, d) {
        var i = cum.indexOf(d);
        tipW.show('<b>' + labels[i] + '</b><br/>' + (vals[i] >= 0 ? '+' : '') + vals[i], ev.offsetX || ev.layerX, ev.offsetY || ev.layerY);
      })
      .on('mouseleave', function () { d3.select(this).attr('opacity', 0.9); tipW.hide(); })
      .attr('x', function (d, i) { return x(labels[i]); })
      .attr('width', x.bandwidth())
      .attr('y', function (d) { return y(Math.max(d.y0, d.y1)); })
      .attr('height', 0)
      .attr('fill', function (d, i) {
        if (d.total) return ink(theme);
        return vals[i] >= 0 ? '#3E7A5A' : '#B5484B';
      })
      .attr('opacity', 0.9)
      .transition().duration(600).delay(function (d, i) { return i * 70; })
      .attr('height', function (d) { return Math.abs(y(d.y0) - y(d.y1)); });

    g.selectAll('text').data(cum).join('text')
      .attr('x', function (d, i) { return x(labels[i]) + x.bandwidth() / 2; })
      .attr('y', function (d) { return y(Math.max(d.y0, d.y1)) - 6; })
      .attr('text-anchor', 'middle').attr('font-family', FONT).attr('font-size', 9.5).attr('font-weight', 600)
      .attr('fill', function (d, i) { return d.total ? ink(theme) : (vals[i] >= 0 ? '#3E7A5A' : '#B5484B'); })
      .text(function (d, i) { return (vals[i] >= 0 ? '+' : '−') + Math.abs(vals[i]); });

    var gx = r.svg.append('g').attr('transform', 'translate(0,' + (r.h - 34) + ')')
      .call(d3.axisBottom(x).tickSize(0));
    gx.select('.domain').attr('stroke', rgba(ink(theme), 0.15));
    gx.selectAll('text').attr('fill', muted(theme)).attr('font-size', 9.5).attr('font-family', FONT);

    return function () {};
  };


  /* ============================================================
     GitHub Primer 风格流程图
     参考 GitHub Docs / Primer 的设计语言：
       节点 = 圆角矩形（#f6f8fa 底 / #d0d7de 边），开始/结束用胶囊，
       判定用菱形（注意色 #fff8c5 / 边 #d4a72c），
       连线 = 直角折线 + 小圆角 + 细箭头（#6e7781），
       分支标注「是／否」用次级灰字，交汇点用小实心圆点。
     ============================================================ */
  var PRIMER = {
    bg: '#FFFFFF',
    nodeFill: '#F6F8FA',
    nodeStroke: '#D0D7DE',
    text: '#1F2328',
    muted: '#656D76',
    line: '#6E7781',
    blue: '#0969DA', blueFill: '#DDF4FF',
    green: '#1A7F37', greenFill: '#DAFBE1',
    red: '#CF222E', redFill: '#FFEBE9',
    amber: '#9A6700', amberFill: '#FFF8C5', amberStroke: '#D4A72C',
    purple: '#8250DF', purpleFill: '#FBEFFF'
  };

  /* CJK 按 1 个字宽、拉丁按 0.58 估宽，用于节点自适应宽度 */
  function textWidth(str) {
    var w = 0;
    String(str || '').split('').forEach(function (ch) {
      w += /[\u4e00-\u9fa5\uff00-\uffef]/.test(ch) ? 12 : 6.6;
    });
    return w;
  }
  function nodeBox(n) {
    var type = n.type || 'process';
    var tw = Math.max(textWidth(n.label), textWidth(n.sub) * 0.85);
    var minW = (type === 'decision' ? 150 : (type === 'start' || type === 'end' ? 110 : 130));
    var w = n.w || Math.max(minW, tw + (type === 'decision' ? 44 : 34));
    var h = n.h || (type === 'decision' ? 86 : (n.sub ? 52 : 38));
    return { w: w, h: h, type: type };
  }

  function anchor(n, dir) {
    var b = nodeBox(n);
    if (dir === 'top') return [n.x, n.y - b.h / 2];
    if (dir === 'bottom') return [n.x, n.y + b.h / 2];
    if (dir === 'left') return [n.x - b.w / 2, n.y];
    return [n.x + b.w / 2, n.y];
  }

  /* 折线 → 圆角 path */
  function roundedPath(pts, r) {
    if (!pts.length) return '';
    var d = 'M' + pts[0][0] + ',' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      var p0 = pts[i - 1], p1 = pts[i], p2 = pts[i + 1];
      var v1 = [p1[0] - p0[0], p1[1] - p0[1]];
      var v2 = [p2[0] - p1[0], p2[1] - p1[1]];
      var l1 = Math.hypot(v1[0], v1[1]) || 1, l2 = Math.hypot(v2[0], v2[1]) || 1;
      var rr = Math.min(r, l1 / 2, l2 / 2);
      var a = [p1[0] - v1[0] / l1 * rr, p1[1] - v1[1] / l1 * rr];
      var b = [p1[0] + v2[0] / l2 * rr, p1[1] + v2[1] / l2 * rr];
      d += 'L' + a[0] + ',' + a[1] + 'Q' + p1[0] + ',' + p1[1] + ' ' + b[0] + ',' + b[1];
    }
    var last = pts[pts.length - 1];
    d += 'L' + last[0] + ',' + last[1];
    return d;
  }

  function primerFlow(el, data, theme) {
    clear(el);
    var d3 = global.d3;
    var nodes = data.nodes || [], edges = data.edges || [];
    var byId = {};
    nodes.forEach(function (n) { byId[n.id] = n; });

    /* 逻辑坐标 → 自适应缩放 */
    var pad = 16;
    var xs = nodes.map(function (n) { var b = nodeBox(n); return [n.x - b.w / 2, n.x + b.w / 2]; });
    var ys = nodes.map(function (n) { var b = nodeBox(n); return [n.y - b.h / 2, n.y + b.h / 2]; });
    var minX = Math.min.apply(null, xs.map(function (p) { return p[0]; })) - pad;
    var maxX = Math.max.apply(null, xs.map(function (p) { return p[1]; })) - -pad;
    var minY = Math.min.apply(null, ys.map(function (p) { return p[0]; })) - pad;
    var maxY = Math.max.apply(null, ys.map(function (p) { return p[1]; })) + pad;
    var lw = maxX - minX, lh = maxY - minY;
    var d = size(el);
    var scale = Math.min(d.w / lw, d.h / lh) * 0.96;
    var svg = d3.select(el).append('svg')
      .attr('width', d.w).attr('height', d.h)
      .style('display', 'block').style('overflow', 'visible');
    var g = svg.append('g')
      .attr('transform', 'translate(' + ((d.w - lw * scale) / 2 - minX * scale) + ',' +
        ((d.h - lh * scale) / 2 - minY * scale) + ') scale(' + scale + ')');

    /* 箭头 */
    var defs = svg.append('defs');
    defs.append('marker').attr('id', 'adv-flow-arrow').attr('viewBox', '0 0 10 10')
      .attr('refX', 9).attr('refY', 5).attr('markerWidth', 6).attr('markerHeight', 6)
      .attr('orient', 'auto-start-reverse')
      .append('path').attr('d', 'M0,0 L10,5 L0,10 z').attr('fill', PRIMER.line);

    /* 连线层 */
    var gE = g.append('g').attr('class', 'flow-edges');
    edges.forEach(function (e) {
      var a = byId[e.from], b = byId[e.to];
      if (!a || !b) return;
      var pts = [];
      var dirA = e.dirFrom || (Math.abs(b.x - a.x) > Math.abs(b.y - a.y) ? (b.x > a.x ? 'right' : 'left') : (b.y > a.y ? 'bottom' : 'top'));
      var dirB = e.dirTo || (dirA === 'right' ? 'left' : dirA === 'left' ? 'right' : dirA === 'bottom' ? 'top' : 'bottom');
      pts.push(anchor(a, dirA));
      (e.via || []).forEach(function (p) { pts.push(p); });
      pts.push(anchor(b, dirB));
      var path = gE.append('path')
        .attr('d', roundedPath(pts, 9))
        .attr('fill', 'none')
        .attr('stroke', PRIMER.line)
        .attr('stroke-width', 1.5)
        .attr('marker-end', 'url(#adv-flow-arrow)')
        .attr('opacity', e.faint ? 0.55 : 0.95);
      if (e.dashed) path.attr('stroke-dasharray', '4 4');
      if (e.label) {
        var mid = e.labelAt || pts[Math.floor((pts.length - 1) / 2)];
        var lp = [(mid[0] + (e.labelDx || 0)), (mid[1] + (e.labelDy || 0))];
        gE.append('text').attr('x', lp[0]).attr('y', lp[1])
          .attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('font-family', FONT).attr('font-size', 11).attr('font-weight', 600)
          .attr('fill', PRIMER.muted)
          .text(e.label);
      }
      e._path = path;
    });

    /* 节点层 */
    var gN = g.append('g').attr('class', 'flow-nodes');
    nodes.forEach(function (n) {
      var b = nodeBox(n), type = b.type;
      var ng = gN.append('g').attr('transform', 'translate(' + n.x + ',' + n.y + ')')
        .style('cursor', 'default');
      var fill = PRIMER.nodeFill, stroke = PRIMER.nodeStroke, color = PRIMER.text;
      if (type === 'start') { fill = PRIMER.blueFill; stroke = PRIMER.blue; }
      if (type === 'end') { fill = PRIMER.greenFill; stroke = PRIMER.green; }
      if (type === 'warn') { fill = PRIMER.redFill; stroke = PRIMER.red; color = PRIMER.red; }
      if (type === 'decision') { fill = PRIMER.amberFill; stroke = PRIMER.amberStroke; color = '#7D4E00'; }
      if (type === 'note') { fill = PRIMER.purpleFill; stroke = PRIMER.purple; }

      if (type === 'decision') {
        ng.append('path')
          .attr('d', 'M0,' + (-b.h / 2) + ' L' + (b.w / 2) + ',0 L0,' + (b.h / 2) + ' L' + (-b.w / 2) + ',0 Z')
          .attr('fill', fill).attr('stroke', stroke).attr('stroke-width', 1.3);
        ng.append('text').attr('y', n.sub ? -5 : 0).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('font-family', FONT).attr('font-size', 12).attr('font-weight', 600).attr('fill', color)
          .text(n.label);
        if (n.sub) ng.append('text').attr('y', 11).attr('text-anchor', 'middle')
          .attr('font-family', FONT).attr('font-size', 9.5).attr('fill', PRIMER.muted).text(n.sub);
      } else {
        var rx = (type === 'start' || type === 'end') ? b.h / 2 : 7;
        ng.append('rect')
          .attr('x', -b.w / 2).attr('y', -b.h / 2).attr('width', b.w).attr('height', b.h)
          .attr('rx', rx).attr('fill', fill).attr('stroke', stroke).attr('stroke-width', 1.2);
        ng.append('text').attr('y', n.sub ? -7 : 0).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
          .attr('font-family', FONT).attr('font-size', 12).attr('font-weight', type === 'start' || type === 'end' ? 700 : 500)
          .attr('fill', color).text(n.label);
        if (n.sub) ng.append('text').attr('y', 11).attr('text-anchor', 'middle')
          .attr('font-family', FONT).attr('font-size', 9.5).attr('fill', PRIMER.muted).text(n.sub);
      }
      n._dom = ng;
      n._edges = edges.filter(function (e) { return e.from === n.id || e.to === n.id; });

      ng.on('mouseenter', function () {
        gN.selectAll('g').transition().duration(120).style('opacity', function (d, i) { return 0.35; });
        ng.transition().duration(120).style('opacity', 1);
        gE.selectAll('path').transition().duration(120).attr('opacity', function () { return 0.2; });
        n._edges.forEach(function (e) { if (e._path) e._path.transition().duration(120).attr('opacity', 0.95); });
      });
      ng.on('mouseleave', function () {
        gN.selectAll('g').transition().duration(160).style('opacity', 1);
        gE.selectAll('path').transition().duration(160).attr('opacity', function (d, i) {
          return edges[i] && edges[i].faint ? 0.55 : 0.95;
        });
      });
    });

    /* 可选：分组框（虚线区域） */
    (data.groups || []).forEach(function (grp) {
      var gg = g.insert('g', ':first-child');
      gg.append('rect')
        .attr('x', grp.x).attr('y', grp.y).attr('width', grp.w).attr('height', grp.h)
        .attr('rx', 10).attr('fill', 'none')
        .attr('stroke', PRIMER.nodeStroke).attr('stroke-dasharray', '5 5').attr('stroke-width', 1);
      gg.append('text').attr('x', grp.x + 10).attr('y', grp.y + 15)
        .attr('font-family', FONT).attr('font-size', 10).attr('font-weight', 600)
        .attr('fill', PRIMER.muted).text(grp.label);
    });

    return function () {};
  }

  S.flowApproval = primerFlow;
  S.flowRelease = primerFlow;

  global.ADV_SHOWCASE = S;
})(window);
