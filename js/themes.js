/* ============================================================
 * 配色主题系统 — 象牙白（唯一主题）
 * ============================================================ */
(function (global) {
  'use strict';

  var THEMES = {
    'paper': {
      id: 'paper',
      short: '象牙白', en: 'Ivory',
      name: '象牙白 Paper / Print',
      css: {
        '--bg': '#FAFAF7',
        '--bg-elevated': '#FFFFFF',
        '--panel': '#FFFFFF',
        '--sidebar-bg': '#F3F2EE',
        '--border': 'rgba(0,0,0,0.08)',
        '--text': '#1A1A1A',
        '--muted': '#6B6B6B',
        '--accent': '#C9A96A',
        '--accent-soft': 'rgba(201,169,106,0.22)',
        '--up': '#1E7A46',
        '--down': '#C0392B',
        '--input-bg': '#FFFFFF',
        '--shadow': '0 8px 24px rgba(0,0,0,0.08)',
        '--series-1': '#1A1A2E', '--series-2': '#C9A96A', '--series-3': '#1E7A46',
        '--series-4': '#C0392B', '--series-5': '#2C3E50', '--series-6': '#8E6F3E',
        '--series-7': '#4A6FA5', '--series-8': '#7D3C98'
      },
      chart: {
        bg: '#FAFAF7', panel: '#FFFFFF', text: '#1A1A1A', muted: '#6B6B6B',
        accent: '#C9A96A', up: '#1E7A46', down: '#C0392B',
        grid: 'rgba(0,0,0,0.06)', axis: 'rgba(0,0,0,0.32)',
        series: ['#1A1A2E', '#C9A96A', '#1E7A46', '#C0392B', '#2C3E50', '#8E6F3E', '#4A6FA5', '#7D3C98', '#5B6B8C', '#B08D57']
      }
    }
  };

  var activeId = 'paper';

  function getTheme(id) { return THEMES[id] || THEMES['paper']; }
  function active() { return getTheme(activeId); }
  function ids() { return Object.keys(THEMES); }

  function applyTheme(id) {
    if (!THEMES[id]) id = 'paper';
    activeId = id;
    var t = getTheme(id);
    var root = document.documentElement;
    Object.keys(t.css).forEach(function (k) { root.style.setProperty(k, t.css[k]); });
    root.setAttribute('data-theme', id);
    return t;
  }

  global.Themes = { THEMES: THEMES, getTheme: getTheme, active: active, ids: ids, applyTheme: applyTheme };
})(window);
