/* ADV 配色模板：仅保留 3 套顶级机构风格 */
(function (global) {
  'use strict';
  global.ADV_PALETTES = [
    { id: 'consult', name: '顾问深蓝', nameEn: 'Consulting Navy',
      colors: ['#051C2C', '#1B4B72', '#4A7FA8', '#A8C4D8', '#8A867E', '#B08A4F'],
      ramp: ['#051C2C', '#1B4B72', '#4A7FA8', '#A8C4D8', '#D6E2EC'],
      accent: '#B08A4F', ink: '#051C2C', neutral: '#C9C5BD',
      up: '#1E7A46', down: '#B5484B' },
    { id: 'burgundy', name: '投行酒红', nameEn: 'IB Burgundy',
      colors: ['#3B0F18', '#7A2534', '#B05162', '#E0B7BE', '#8A867E', '#C7A269'],
      ramp: ['#3B0F18', '#7A2534', '#B05162', '#E0B7BE', '#F3E3E6'],
      accent: '#C7A269', ink: '#3B0F18', neutral: '#C9C5BD',
      up: '#2F6B4F', down: '#A8354A' },
    { id: 'forest', name: '期刊墨绿', nameEn: 'Journal Forest',
      colors: ['#10322A', '#2E6B52', '#5E9A7E', '#B7D4C6', '#8A867E', '#C4A46B'],
      ramp: ['#10322A', '#2E6B52', '#5E9A7E', '#B7D4C6', '#E2EEE7'],
      accent: '#C4A46B', ink: '#10322A', neutral: '#C9C5BD',
      up: '#1E7A46', down: '#B5484B' }
  ];
})(window);
