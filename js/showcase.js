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
      grd.append('stop').attr('offset', '0%').attr('stop-color', rgba(pal(theme, d.index), 0.55));
      grd.append('stop').attr('offset', '100%').attr('stop-color', rgba(accent(theme), 0.25));
    });

    g.append('g').selectAll('path').data(chord).join('path')
      .attr('d', ribbon)
      .attr('fill', function (d) { return 'url(#chordGrad' + d.source.index + ')'; })
      .attr('stroke', rgba(ink(theme), 0.12))
      .attr('stroke-width', 0.5)
      .style('mix-blend-mode', 'multiply');

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
    var radius = Math.min(r.w * 0.44, r.h * 0.47);
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

    node.append('circle')
      .attr('r', function (d) { return d.depth === 0 ? 7 : (d.children ? 4.5 : 3); })
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

    r.svg.append('g').selectAll('path').data(arr).join('path')
      .attr('d', hexPath(hexPts))
      .attr('transform', function (b) { return 'translate(' + b.cx + ',' + b.cy + ')'; })
      .attr('fill', function (b) { return color(b.n); })
      .attr('stroke', '#fff').attr('stroke-width', 1.2);

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
    g.selectAll('rect').data(cum).join('rect')
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

  global.ADV_SHOWCASE = S;
})(window);
