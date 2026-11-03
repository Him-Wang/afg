/* ============================================================
 * 股价技术图 — TradingView Lightweight Charts
 * K 线 + 成交量 + 移动均线（MA20 / MA60 / MA120）
 * ============================================================ */
(function (global) {
  'use strict';

  function hexToRgba(hex, alpha) {
    if (hex[0] === '#') hex = hex.slice(1);
    if (hex.length === 3) hex = hex.split('').map(function (c) { return c + c; }).join('');
    var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), b = parseInt(hex.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  function ma(values, n) {
    var out = [];
    for (var i = 0; i < values.length; i++) {
      if (i < n - 1) { out.push(null); continue; }
      var sum = 0;
      for (var j = i - n + 1; j <= i; j++) sum += values[j];
      out.push({ time: values[i].time, value: Math.round((sum / n) * 100) / 100 });
    }
    return out;
  }

  function create(container, theme) {
    var chart = LightweightCharts.createChart(container, {
      autoSize: true,
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: 'solid', color: theme.bg },
        textColor: theme.muted,
        fontSize: 11,
        fontFamily: "'Inter','PingFang SC',sans-serif",
        attributionLogo: false
      },
      watermark: {
        visible: true,
        text: 'AFG',
        fontSize: 44,
        color: hexToRgba(theme.text, 0.05),
        fontFamily: "'Inter', sans-serif"
      },
      grid: {
        vertLines: { color: hexToRgba(theme.text, 0.05) },
        horzLines: { color: hexToRgba(theme.text, 0.05) }
      },
      crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
        vertLine: { color: hexToRgba(theme.text, 0.35), labelBackgroundColor: theme.accent },
        horzLine: { color: hexToRgba(theme.text, 0.35), labelBackgroundColor: theme.accent }
      },
      rightPriceScale: { borderColor: hexToRgba(theme.text, 0.2) },
      timeScale: { borderColor: hexToRgba(theme.text, 0.2), rightOffset: 4, barSpacing: 7 },
      localization: { locale: 'zh-CN' }
    });

    var candle = chart.addCandlestickSeries({
      upColor: theme.up, downColor: theme.down,
      wickUpColor: theme.up, wickDownColor: theme.down,
      borderVisible: true,
      borderColor: hexToRgba(theme.text, 0.25)
    });

    var volume = chart.addHistogramSeries({
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
      color: hexToRgba(theme.muted, 0.55)
    });
    chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    var ma20 = chart.addLineSeries({ color: theme.accent, lineWidth: 1.6, priceLineVisible: false, lastValueVisible: true });
    var ma60 = chart.addLineSeries({ color: theme.series[2] || '#9B6CF6', lineWidth: 1.6, priceLineVisible: false, lastValueVisible: true });
    var ma120 = chart.addLineSeries({ color: theme.series[1] || '#8A8578', lineWidth: 1.6, priceLineVisible: false, lastValueVisible: true });

    return { chart: chart, candle: candle, volume: volume, ma20: ma20, ma60: ma60, ma120: ma120, upColor: theme.up, downColor: theme.down };
  }

  function setData(inst, ohlc) {
    var closes = ohlc.map(function (d) { return { time: d.time, value: d.close }; });
    inst.candle.setData(ohlc.map(function (d) {
      return { time: d.time, open: d.open, high: d.high, low: d.low, close: d.close };
    }));
    inst.volume.setData(ohlc.map(function (d) {
      return { time: d.time, value: d.volume, color: d.close >= d.open ? hexToRgba(inst.upColor, 0.4) : hexToRgba(inst.downColor, 0.4) };
    }));
    inst.ma20.setData(ma(closes, 20));
    inst.ma60.setData(ma(closes, 60));
    inst.ma120.setData(ma(closes, 120));
    inst.chart.timeScale().fitContent();
  }

  function destroy(inst) { if (inst && inst.chart) { try { inst.chart.remove(); } catch (e) {} } }

  global.PriceChart = { create: create, setData: setData, destroy: destroy };
})(window);
