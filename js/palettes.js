/* ============================================================
 * ADV 图表配色体系 — 4 套，参考顶级咨询 / 投行 / 期刊出版规范
 *   01 麦肯锡深蓝 McKinsey Deep Blue
 *   02 编辑多彩   Editorial Multi-hue
 *   03 投行酒红   IB Burgundy
 *   04 期刊墨绿   BCG Forest
 * 每套含：系列色 series、明度阶梯 ramp（用于渐变/地图）、强调色 accent
 * ============================================================ */
(function (global) {
  'use strict';
  global.ADV_PALETTES = [
    /* ---------- 01 麦肯锡深蓝 ---------- */
    { id: 'consult', name: '麦肯锡深蓝', nameEn: 'McKinsey Blue',
      colors: ['#0B2A45', '#1D5B7C', '#4C8CA8', '#9FC2CF', '#C8A45C', '#7C8B99'],
      ramp: ['#0B2A45', '#1D5B7C', '#4C8CA8', '#9FC2CF', '#E5EEF3'],
      accent: '#C8A45C', ink: '#0B2A45', neutral: '#C9C5BD',
      up: '#2E7D5B', down: '#B4483F' },

    /* ---------- 02 编辑多彩（低饱和多色相，供多系列对比） ---------- */
    { id: 'contrast', name: '编辑多彩', nameEn: 'Editorial Multi',
      colors: ['#1B3A57', '#A8763E', '#5B7F6B', '#8C3B3B', '#6E5A8A', '#8A8F98'],
      ramp: ['#1B3A57', '#35688F', '#6E9CBE', '#B7CFE0', '#EDF2F6'],
      accent: '#A8763E', ink: '#1B3A57', neutral: '#C9C5BD',
      up: '#3F7F5F', down: '#8C3B3B', multiHue: true },

    /* ---------- 03 投行酒红 ---------- */
    { id: 'burgundy', name: '投行酒红', nameEn: 'IB Burgundy',
      colors: ['#3A0F16', '#6E2230', '#A34A56', '#D4A7AC', '#B08A4F', '#8A8F98'],
      ramp: ['#3A0F16', '#6E2230', '#A34A56', '#D4A7AC', '#F3E4E6'],
      accent: '#B08A4F', ink: '#3A0F16', neutral: '#C9C5BD',
      up: '#2F6B4F', down: '#9E2B3A' },

    /* ---------- 04 期刊墨绿 ---------- */
    { id: 'forest', name: '期刊墨绿', nameEn: 'BCG Forest',
      colors: ['#0E3B32', '#1F6B57', '#4E9C82', '#A3CBB9', '#C8A45C', '#7C8B99'],
      ramp: ['#0E3B32', '#1F6B57', '#4E9C82', '#A3CBB9', '#E3F0EA'],
      accent: '#C8A45C', ink: '#0E3B32', neutral: '#C9C5BD',
      up: '#1F6B57', down: '#B4483F' }
  ];
})(window);
