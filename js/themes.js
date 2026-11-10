/* ============================================================
 * 配色主题系统 — 象牙白（白天）/ 暗夜（深色）
 *   外观由顶栏三态开关控制：白天 / 暗夜 / 跟随系统
 * ============================================================ */
(function (global) {
  'use strict';

  var THEMES = {
    'paper': {
      id: 'paper',
      mode: 'light',
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
        '--wash': 'rgba(17,24,28,0.045)',
        '--wash-strong': 'rgba(17,24,28,0.085)',
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
    },

    'obsidian': {
      id: 'obsidian',
      mode: 'dark',
      short: '暗夜', en: 'Obsidian',
      name: '暗夜 Obsidian',
      css: {
        '--bg': '#0E0F12',
        '--bg-elevated': '#16181E',
        '--panel': '#121318',
        '--sidebar-bg': '#101116',
        '--border': 'rgba(255,255,255,0.08)',
        '--text': '#F2EFE6',
        '--muted': '#8A8578',
        '--accent': '#C9A96A',
        '--accent-soft': 'rgba(201,169,106,0.16)',
        '--up': '#3FA97A',
        '--down': '#E0675F',
        '--input-bg': '#0B0C10',
        '--shadow': '0 10px 34px rgba(0,0,0,0.55)',
        '--wash': 'rgba(255,255,255,0.04)',
        '--wash-strong': 'rgba(255,255,255,0.08)',
        '--series-1': '#C9A96A', '--series-2': '#8A8578', '--series-3': '#7FBFA3',
        '--series-4': '#D98B85', '--series-5': '#B8975C', '--series-6': '#A5A5A5',
        '--series-7': '#D8B77E', '--series-8': '#8E9AA8'
      },
      chart: {
        bg: '#0E0F12', panel: '#121318', text: '#F2EFE6', muted: '#8A8578',
        accent: '#C9A96A', up: '#3FA97A', down: '#E0675F',
        grid: 'rgba(255,255,255,0.06)', axis: 'rgba(255,255,255,0.30)',
        series: ['#C9A96A', '#6F8FA8', '#B0805A', '#7FA06F', '#9B7FB5', '#C08484', '#5FA8A0', '#A8A06B', '#7A8494', '#D0B98E']
      }
    }
  };

  var MODES = ['light', 'dark', 'system'];
  /* 每一档的默认主题（用户没手动换过配色时用） */
  var DEFAULT_BY_MODE = { light: 'paper', dark: 'obsidian' };

  var activeId = 'paper';

  function getTheme(id) { return THEMES[id] || THEMES['paper']; }
  function active() { return getTheme(activeId); }
  function ids() { return Object.keys(THEMES); }
  function activeIdOf() { return activeId; }
  function modeOf(id) { return getTheme(id).mode || 'light'; }
  function idsByMode(mode) {
    return Object.keys(THEMES).filter(function (id) { return modeOf(id) === mode; });
  }
  function defaultForMode(mode) {
    var want = DEFAULT_BY_MODE[mode] || (mode === 'dark' ? 'obsidian' : 'paper');
    if (THEMES[want] && modeOf(want) === mode) return want;
    var list = idsByMode(mode);
    return list[0] || 'paper';
  }

  function applyTheme(id) {
    if (!THEMES[id]) id = 'paper';
    activeId = id;
    var t = getTheme(id);
    var root = document.documentElement;
    Object.keys(t.css).forEach(function (k) { root.style.setProperty(k, t.css[k]); });
    root.setAttribute('data-theme', id);
    var mode = modeOf(id);
    root.setAttribute('data-mode', mode);
    // 让浏览器原生控件（滚动条、表单、日期选择器）跟着明暗走
    try { root.style.colorScheme = mode; } catch (e) {}
    root.style.background = t.css['--bg'];
    /* 手机浏览器地址栏 / 状态栏颜色也跟着明暗走 */
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.css['--bg']);
    return t;
  }

  global.Themes = {
    THEMES: THEMES, MODES: MODES,
    getTheme: getTheme, active: active, ids: ids,
    activeId: activeIdOf, modeOf: modeOf, idsByMode: idsByMode, defaultForMode: defaultForMode,
    applyTheme: applyTheme
  };
})(window);
