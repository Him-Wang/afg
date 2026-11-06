/* ============================================================
 * 机器学习 / 统计计算模块（纯 JS，无外部依赖）
 * 线性回归 · 预测区间 · K-Means 聚类 · 皮尔逊相关 · 直方图 · KDE
 * ============================================================ */
(function (global) {
  'use strict';

  function mean(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : 0; }

  function std(a) {
    var m = mean(a), s = 0;
    for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m);
    return Math.sqrt(s / a.length);
  }

  function linearRegression(xs, ys) {
    var n = xs.length, mx = mean(xs), my = mean(ys);
    var sxy = 0, sxx = 0;
    for (var i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) * (xs[i] - mx); }
    var slope = sxx === 0 ? 0 : sxy / sxx;
    var intercept = my - slope * mx;
    var ssRes = 0, ssTot = 0;
    for (i = 0; i < n; i++) {
      var f = intercept + slope * xs[i];
      ssRes += (ys[i] - f) * (ys[i] - f);
      ssTot += (ys[i] - my) * (ys[i] - my);
    }
    var r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
    var residStd = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;
    return { slope: slope, intercept: intercept, r2: r2, residStd: residStd, xmean: mx, sxx: sxx, n: n };
  }

  /* 预测 + 多层置信扇面（基于残差标准差随步长加宽） */
  function forecast(xs, ys, horizon) {
    var lr = linearRegression(xs, ys);
    var lastX = xs[xs.length - 1];
    var pred = [], bands = [];
    var levels = [{ z: 0.67, label: '50%' }, { z: 1.28, label: '80%' }, { z: 1.64, label: '90%' }];
    for (var h = 1; h <= horizon; h++) {
      var x = lastX + h;
      var y = lr.intercept + lr.slope * x;
      pred.push({ x: x, y: y });
      var b = [];
      levels.forEach(function (lv) {
        var w = lr.residStd * lv.z * Math.sqrt(h);
        b.push({ lower: y - w, upper: y + w, label: lv.label });
      });
      bands.push(b);
    }
    return { line: pred, bands: bands, residStd: lr.residStd };
  }

  /* 简单确定性随机数 */
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      var t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function kmeans(points, k, iters) {
    iters = iters || 40;
    var r = rng(20260101);
    var order = points.map(function (_, i) { return i; });
    for (var i = order.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = order[i]; order[i] = order[j]; order[j] = t; }
    var cents = [];
    for (i = 0; i < k; i++) { var p = points[order[i]]; cents.push({ x: p.x, y: p.y }); }

    for (var it = 0; it < iters; it++) {
      var assign = points.map(function (p) {
        var best = 0, bd = Infinity;
        cents.forEach(function (c, ci) { var d = (p.x - c.x) * (p.x - c.x) + (p.y - c.y) * (p.y - c.y); if (d < bd) { bd = d; best = ci; } });
        return best;
      });
      var sums = cents.map(function () { return { x: 0, y: 0, n: 0 }; });
      points.forEach(function (p, pi) { sums[assign[pi]].x += p.x; sums[assign[pi]].y += p.y; sums[assign[pi]].n++; });
      var moved = false;
      cents = cents.map(function (c, ci) {
        var s = sums[ci]; if (s.n === 0) return c;
        var nx = s.x / s.n, ny = s.y / s.n;
        if (Math.abs(nx - c.x) + Math.abs(ny - c.y) > 1e-9) moved = true;
        return { x: nx, y: ny };
      });
      if (!moved) break;
    }
    var assignment = points.map(function (p) {
      var best = 0, bd = Infinity;
      cents.forEach(function (c, ci) { var d = (p.x - c.x) * (p.x - c.x) + (p.y - c.y) * (p.y - c.y); if (d < bd) { bd = d; best = ci; } });
      return best;
    });
    return { centroids: cents, assignment: assignment, k: k };
  }

  function pearson(a, b) {
    var n = a.length, ma = mean(a), mb = mean(b), sa = 0, sb = 0, sab = 0;
    for (var i = 0; i < n; i++) { sa += (a[i] - ma) * (a[i] - ma); sb += (b[i] - mb) * (b[i] - mb); sab += (a[i] - ma) * (b[i] - mb); }
    var den = Math.sqrt(sa * sb);
    return den === 0 ? 0 : sab / den;
  }

  function correlationMatrix(series) {
    var names = series.map(function (s) { return s.name; });
    var n = names.length, mat = [];
    for (var i = 0; i < n; i++) {
      var row = [];
      for (var j = 0; j < n; j++) row.push(pearson(series[i].values, series[j].values));
      mat.push(row);
    }
    return { names: names, matrix: mat };
  }

  function histogram(values, bins) {
    var min = Math.min.apply(null, values), max = Math.max.apply(null, values);
    var step = (max - min) / bins || 1;
    var counts = new Array(bins).fill(0), centers = new Array(bins);
    values.forEach(function (v) {
      var b = Math.min(bins - 1, Math.max(0, Math.floor((v - min) / step)));
      counts[b]++;
    });
    for (var i = 0; i < bins; i++) centers[i] = min + step * (i + 0.5);
    return { centers: centers, counts: counts, min: min, max: max, step: step };
  }

  function kde(values, n, xmin, xmax) {
    n = n || 120;
    var s = std(values);
    var bw = Math.max(1.06 * s * Math.pow(values.length, -0.2), (xmax - xmin) / 200, 1e-9);
    var xs = [], ys = [];
    var c = values.length * bw * Math.sqrt(2 * Math.PI);
    for (var i = 0; i < n; i++) {
      var x = xmin + (xmax - xmin) * i / (n - 1), sum = 0;
      for (var j = 0; j < values.length; j++) {
        var u = (x - values[j]) / bw;
        sum += Math.exp(-0.5 * u * u);
      }
      xs.push(x); ys.push(sum / c);
    }
    return { x: xs, y: ys, bandwidth: bw };
  }

  function normalPdf(x, mu, sigma) {
    var u = (x - mu) / sigma;
    return Math.exp(-0.5 * u * u) / (sigma * Math.sqrt(2 * Math.PI));
  }

  /* 根据日期标签推断每年期数（日/周/月/季/年），用于正确的年化 */
  function periodsPerYear(labels) {
    if (!labels || labels.length < 3) return 252;
    var times = [];
    for (var i = 0; i < labels.length; i++) {
      var t = Date.parse(String(labels[i]).replace(/年|月|日/g, '-').replace(/-+$/, ''));
      if (!isNaN(t)) times.push(t);
    }
    if (times.length < 3) return 252;
    var gaps = [];
    for (var j = 1; j < times.length; j++) {
      var g = Math.abs(times[j] - times[j - 1]) / 86400000;
      if (g > 0) gaps.push(g);
    }
    if (!gaps.length) return 252;
    gaps.sort(function (a, b) { return a - b; });
    var med = gaps[Math.floor(gaps.length / 2)];
    if (med <= 1.5) return 252;   // 日
    if (med <= 10) return 52;     // 周
    if (med <= 45) return 12;     // 月
    if (med <= 100) return 4;     // 季
    return 1;                     // 年
  }

  /* 基金/指数业绩指标：年化收益、年化波动、最大回撤、夏普、索提诺、M²、Jensen-alpha、VaR、卡玛 */
  var RF = 0.02; // 无风险利率
  function perfMetrics(values, benchmark, labels) {
    if (!values || values.length < 2) return null;
    var ppy = periodsPerYear(labels);
    // 剔除空值
    var pts = [];
    for (var k = 0; k < values.length; k++) {
      var v = values[k];
      if (v === null || v === undefined || isNaN(v) || v <= 0) continue;
      pts.push(v);
    }
    var n = pts.length;
    if (n < 2) return null;
    var start = pts[0], end = pts[n - 1];
    var rets = [];
    for (var i = 1; i < n; i++) rets.push(pts[i] / pts[i - 1] - 1);
    var annReturn = Math.pow(end / start, ppy / (n - 1)) - 1;
    var annVol = std(rets) * Math.sqrt(ppy);
    var peak = -Infinity, maxDD = 0;
    pts.forEach(function (v) { peak = Math.max(peak, v); var dd = v / peak - 1; if (dd < maxDD) maxDD = dd; });
    var sharp = annVol > 0 ? (annReturn - RF) / annVol : 0;
    var sorted = rets.slice().sort(function (a, b) { return a - b; });
    var q = sorted.length ? sorted[Math.floor(sorted.length * 0.05)] : 0;
    var var95 = -q;
    // 索提诺：下行偏差（以无风险日收益率作为最低可接受收益）
    var mar = RF / ppy;
    var downSum = 0, downCnt = 0;
    rets.forEach(function (r) { if (r < mar) { downSum += (r - mar) * (r - mar); downCnt++; } });
    var downDev = Math.sqrt(downSum / Math.max(1, rets.length)) * Math.sqrt(ppy);
    var sortino = downDev > 0 ? (annReturn - RF) / downDev : 0;
    var calmar = maxDD < 0 ? annReturn / Math.abs(maxDD) : null;
    // 基准相关：Jensen alpha / beta / M²
    var alpha = null, beta = null, m2 = null, benchAnn = null;
    if (benchmark && benchmark.length >= 2) {
      // 按同一索引取成对有效值（避免空值导致错位）
      var pa = [], pb = [];
      var lim = Math.min(values.length, benchmark.length);
      for (var j = 0; j < lim; j++) {
        var av = values[j], bv = benchmark[j];
        if (av > 0 && bv > 0) { pa.push(av); pb.push(bv); }
      }
      if (pa.length >= 3) {
        var ra = [], rb = [];
        for (var j2 = 1; j2 < pa.length; j2++) { ra.push(pa[j2] / pa[j2 - 1] - 1); rb.push(pb[j2] / pb[j2 - 1] - 1); }
        var ma = mean(ra), mb = mean(rb);
        var cov = 0, varb = 0;
        for (var z = 0; z < ra.length; z++) { cov += (ra[z] - ma) * (rb[z] - mb); varb += (rb[z] - mb) * (rb[z] - mb); }
        cov /= ra.length; varb /= ra.length;
        beta = varb > 0 ? cov / varb : null;
        // 基准年化用几何口径，与资产口径一致
        benchAnn = Math.pow(pb[pb.length - 1] / pb[0], ppy / (pb.length - 1)) - 1;
        if (beta !== null) alpha = annReturn - (RF + beta * (benchAnn - RF));
        // M² = Rf + Sharpe × σ_基准
        var benchVol = Math.sqrt(varb) * Math.sqrt(ppy);
        m2 = RF + sharp * benchVol;
      }
    }
    return {
      annReturn: annReturn, annVol: annVol, maxDD: maxDD, sharp: sharp, sortino: sortino,
      m2: m2, alpha: alpha, beta: beta, benchAnn: benchAnn, calmar: calmar,
      var95: var95, totalReturn: end / start - 1, n: n, ppy: ppy
    };
  }

  global.ML = {
    mean: mean, std: std, linearRegression: linearRegression, forecast: forecast,
    kmeans: kmeans, pearson: pearson, correlationMatrix: correlationMatrix,
    histogram: histogram, kde: kde, normalPdf: normalPdf, rng: rng, perfMetrics: perfMetrics, periodsPerYear: periodsPerYear
  };
})(window);
