/* ============================================================
 * 配色主题系统 — 5 套高级金融配色，一键切换
 * ============================================================ */
(function (global) {
  'use strict';

  var THEMES = {
    'midnight-gold': {
      id: 'midnight-gold',
      name: '黑金 Midnight Gold',
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
        '--up': '#E6C88A',
        '--down': '#6E6A60',
        '--input-bg': '#0B0C10',
        '--shadow': '0 10px 34px rgba(0,0,0,0.55)',
        '--series-1': '#C9A96A', '--series-2': '#8A8578', '--series-3': '#E6C88A',
        '--series-4': '#5A5548', '--series-5': '#B8975C', '--series-6': '#A5A5A5',
        '--series-7': '#D8B77E', '--series-8': '#6B6560'
      },
      chart: {
        bg: '#0E0F12', panel: '#121318', text: '#F2EFE6', muted: '#8A8578',
        accent: '#C9A96A', up: '#E6C88A', down: '#6E6A60',
        grid: 'rgba(255,255,255,0.06)', axis: 'rgba(255,255,255,0.30)',
        series: ['#C9A96A', '#6F8FA8', '#B0805A', '#7FA06F', '#9B7FB5', '#C08484', '#5FA8A0', '#A8A06B', '#7A8494', '#D0B98E']
      }
    },

    'tradingview-dark': {
      id: 'tradingview-dark',
      name: '深蓝 TradingView Dark',
      css: {
        '--bg': '#131722',
        '--bg-elevated': '#1E222D',
        '--panel': '#171B26',
        '--sidebar-bg': '#141824',
        '--border': 'rgba(255,255,255,0.08)',
        '--text': '#D1D4DC',
        '--muted': '#787B86',
        '--accent': '#2962FF',
        '--accent-soft': 'rgba(41,98,255,0.18)',
        '--up': '#26A69A',
        '--down': '#EF5350',
        '--input-bg': '#0F121A',
        '--shadow': '0 10px 34px rgba(0,0,0,0.55)',
        '--series-1': '#2962FF', '--series-2': '#26A69A', '--series-3': '#D4AF37',
        '--series-4': '#EF5350', '--series-5': '#7B9BFF', '--series-6': '#5BE7C4',
        '--series-7': '#9B6CF6', '--series-8': '#F0A85A'
      },
      chart: {
        bg: '#131722', panel: '#171B26', text: '#D1D4DC', muted: '#787B86',
        accent: '#2962FF', up: '#26A69A', down: '#EF5350',
        grid: 'rgba(255,255,255,0.06)', axis: 'rgba(255,255,255,0.30)',
        series: ['#2962FF', '#26A69A', '#D4AF37', '#EF5350', '#7B9BFF', '#5BE7C4', '#9B6CF6', '#F0A85A', '#FFB74D', '#4DB6AC']
      }
    },

    'paper': {
      id: 'paper',
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
    },

    'emerald': {
      id: 'emerald',
      name: '墨绿 Emerald',
      css: {
        '--bg': '#0E1B17',
        '--bg-elevated': '#14231F',
        '--panel': '#101D19',
        '--sidebar-bg': '#0D1915',
        '--border': 'rgba(255,255,255,0.08)',
        '--text': '#E9F2EC',
        '--muted': '#7F9389',
        '--accent': '#2EC4A6',
        '--accent-soft': 'rgba(46,196,166,0.16)',
        '--up': '#5BE7C4',
        '--down': '#E06C75',
        '--input-bg': '#0A120F',
        '--shadow': '0 10px 34px rgba(0,0,0,0.55)',
        '--series-1': '#2EC4A6', '--series-2': '#5BE7C4', '--series-3': '#C9A96A',
        '--series-4': '#E06C75', '--series-5': '#7FD1B9', '--series-6': '#B8D4C6',
        '--series-7': '#8FAE9B', '--series-8': '#D4AF37'
      },
      chart: {
        bg: '#0E1B17', panel: '#101D19', text: '#E9F2EC', muted: '#7F9389',
        accent: '#2EC4A6', up: '#5BE7C4', down: '#E06C75',
        grid: 'rgba(255,255,255,0.06)', axis: 'rgba(255,255,255,0.30)',
        series: ['#2EC4A6', '#5BE7C4', '#C9A96A', '#E06C75', '#7FD1B9', '#B8D4C6', '#8FAE9B', '#D4AF37', '#6BA8C9', '#C98A6B']
      }
    },

    'graphite': {
      id: 'graphite',
      name: '石墨 Graphite',
      css: {
        '--bg': '#1B1E24',
        '--bg-elevated': '#24282F',
        '--panel': '#1F232A',
        '--sidebar-bg': '#191C21',
        '--border': 'rgba(255,255,255,0.08)',
        '--text': '#E8EAED',
        '--muted': '#8A8F98',
        '--accent': '#7B9BFF',
        '--accent-soft': 'rgba(123,155,255,0.16)',
        '--up': '#2EC4A6',
        '--down': '#EF5350',
        '--input-bg': '#14171C',
        '--shadow': '0 10px 34px rgba(0,0,0,0.55)',
        '--series-1': '#7B9BFF', '--series-2': '#2EC4A6', '--series-3': '#F0A85A',
        '--series-4': '#EF5350', '--series-5': '#9B6CF6', '--series-6': '#5BE7C4',
        '--series-7': '#E6C88A', '--series-8': '#A5A5A5'
      },
      chart: {
        bg: '#1B1E24', panel: '#1F232A', text: '#E8EAED', muted: '#8A8F98',
        accent: '#7B9BFF', up: '#2EC4A6', down: '#EF5350',
        grid: 'rgba(255,255,255,0.06)', axis: 'rgba(255,255,255,0.30)',
        series: ['#7B9BFF', '#2EC4A6', '#F0A85A', '#EF5350', '#9B6CF6', '#5BE7C4', '#E6C88A', '#A5A5A5', '#FFB74D', '#B39DDB']
      }
    }
  };

  var activeId = 'midnight-gold';

  function getTheme(id) { return THEMES[id] || THEMES['midnight-gold']; }
  function active() { return getTheme(activeId); }
  function ids() { return Object.keys(THEMES); }

  function applyTheme(id) {
    activeId = id;
    var t = getTheme(id);
    var root = document.documentElement;
    Object.keys(t.css).forEach(function (k) { root.style.setProperty(k, t.css[k]); });
    root.setAttribute('data-theme', id);
    return t;
  }

  global.Themes = { THEMES: THEMES, getTheme: getTheme, active: active, ids: ids, applyTheme: applyTheme };
})(window);
