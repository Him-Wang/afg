/* AFG 双语支持（中文 / English） */
(function (global) {
  'use strict';

  var DICT = {
    zh: {
      'app.import': '＋ 导入数据',
      'app.menu': '菜单',
      'app.theme': '切换配色',
      'app.lang': '语言',
      'app.feedback': '反馈',

      'nav.home': '使用说明',
      'nav.china': '中国宏观数据',
      'nav.intl': '国际宏观数据',
      'nav.finance': '金融数据',
      'nav.explore': '数据探索',
      'nav.examples': '示例图',

      'home.logo': 'AFG',
      'home.title': '智能制图 · 上传即用',
      'home.sub': '上传数据，自动识别并出图',
      'step1.t': '上传数据',
      'step1.d': 'Excel / CSV / JSON，本地处理不上传',
      'step2.t': '自动出图',
      'step2.d': '趋势 / 业绩评估 / 机器学习 / 宏观',
      'step3.t': '自由调整',
      'step3.d': '配色、区间、叠加指标、数据标注',
      'home.cta': '＋ 上传数据开始',
      'home.note': '想先看效果？左侧「示例图」里有 25+ 张真实数据图表。',
      'home.ai.title': '🤖 用 AI 一句话画图',
      'home.ai.desc': '把需求说给 AI，它会调用 AFG 生成图表链接。',
      'home.ai.ex1': '「用近 5 年沪深300和中证500做对比折线图」',
      'home.ai.ex2': '「画一张全球主要经济体的 GDP 热力图」',
      'home.ai.tip': '也可以把 Excel 发给 AI，再说「用 AFG 画图」。',
      'home.ai.demo': '▶ 看示例',
      'home.ai.detail': '支持 Codex / Kimi / Cursor / Claude 等，配置见 mcp-server/README.md',
      'home.ai.wayA': '方式 A · 零安装',
      'home.ai.wayA.desc': '复制下面这段发给 AI，它会自己拼出图表链接',
      'home.ai.copy': '📋 复制提示词给 AI',
      'home.ai.wayB': '方式 B · 配一次 MCP',
      'home.ai.wayB.desc': '在客户端加一行配置，之后直接说「用 AFG 画图」',
      'home.ai.copied': '已复制，粘贴给 AI 即可',
      'home.ai.a1': '点「复制提示词给 AI」，粘到 Cursor / Claude / Kimi / WorkBuddy 的对话框',
      'home.ai.a2': '接着说「用这个格式，帮我做一张 XXX 图，象牙白主题」',
      'home.ai.a3': 'AI 会返回一个 ?chart= 链接，点开即图，可导出/分享',
      'home.ai.guideToggle': '📖 展开完整配置教程（5 步 + 排错）',
      'home.fb.title': '🐞 帮它变得更好',
      'home.fb.desc': '遇到 bug、想要新图表、觉得哪里难用？直接告诉我——你的反馈会变成下一次更新。',
      'home.fb.li1': '某张图数据不对 / 报错',
      'home.fb.li2': '想要某个指标或图表类型',
      'home.fb.li3': '按钮找不到 / 操作不顺手',
      'home.fb.cta': '✍️ 写下我的反馈',
      'home.fb.count': '已收到 {n} 条反馈，全部都会看',

      'tb.chart': '图表',
      'tb.range': '区间',
      'tb.add': '＋ 指标',
      'tb.labels': '极值标注',
      'tb.export': '⇩ 导出图片',
      'tb.share': '🔗 复制链接',
      'tb.more': '⚙ 更多',
      'range.all': '全部',
      'range.1y': '近1年',
      'range.5y': '近5年',
      'range.10y': '近10年',

      'fb.title': '反馈与建议',
      'fb.sub': '遇到问题或有想法？告诉我，我会尽快修复。',
      'fb.type': '类型',
      'fb.type.bug': '问题反馈',
      'fb.type.idea': '功能建议',
      'fb.content': '具体内容',
      'fb.content.ph': '描述你遇到的问题，或想要的功能…',
      'fb.contact': '联系方式（可选）',
      'fb.contact.ph': '邮箱 / 微信，方便我回复你',
      'fb.submit': '提交到 GitHub',
      'fb.copy': '复制内容',
      'fb.cancel': '取消',
      'fb.done.github': '已打开 GitHub 页面，提交后我会收到通知',
      'fb.done.copy': '内容已复制，可直接发给我'
    },
    en: {
      'app.import': '＋ Import data',
      'app.menu': 'Menu',
      'app.theme': 'Theme',
      'app.lang': 'Language',
      'app.feedback': 'Feedback',

      'nav.home': 'Guide',
      'nav.china': 'China Macro',
      'nav.intl': 'Global Macro',
      'nav.finance': 'Markets',
      'nav.explore': 'Explore',
      'nav.examples': 'Gallery',

      'home.logo': 'AFG',
      'home.title': 'Smart Charts · Just Upload',
      'home.sub': 'Upload data, get charts automatically',
      'step1.t': 'Upload',
      'step1.d': 'Excel / CSV / JSON, processed locally',
      'step2.t': 'Auto chart',
      'step2.d': 'Trend / Performance / ML / Macro',
      'step3.t': 'Customize',
      'step3.d': 'Colors, range, overlays, labels',
      'home.cta': '＋ Get started',
      'home.note': 'Want a preview? 25+ chart templates with live data are in the Gallery.',
      'home.ai.title': '🤖 Ask AI to chart it',
      'home.ai.desc': 'Describe what you need — the agent calls AFG and returns a chart link.',
      'home.ai.ex1': '"Compare CSI300 and CSI500 over the last 5 years"',
      'home.ai.ex2': '"Make a GDP heatmap of major economies"',
      'home.ai.tip': 'You can also paste an Excel into the AI and say "chart it with AFG".',
      'home.ai.demo': '▶ See example',
      'home.ai.detail': 'Works with Codex / Kimi / Cursor / Claude. Setup: mcp-server/README.md',
      'home.ai.wayA': 'Option A · No install',
      'home.ai.wayA.desc': 'Copy the prompt below to any AI — it builds the chart link itself',
      'home.ai.copy': '📋 Copy prompt for AI',
      'home.ai.wayB': 'Option B · Configure MCP once',
      'home.ai.wayB.desc': 'Add one line to your client, then just say "chart it with AFG"',
      'home.ai.copied': 'Copied — paste it to your AI',
      'home.ai.a1': 'Click "Copy prompt" and paste it into Cursor / Claude / Kimi / WorkBuddy',
      'home.ai.a2': 'Then say: "use this format to chart XXX, paper theme"',
      'home.ai.a3': 'The AI returns a ?chart= link — open it, export or share',
      'home.ai.guideToggle': '📖 Full setup guide (5 steps + troubleshooting)',
      'home.fb.title': '🐞 Help make it better',
      'home.fb.desc': 'Found a bug, want a new chart, or something feels awkward? Tell me — your feedback ships in the next update.',
      'home.fb.li1': 'Wrong data or an error',
      'home.fb.li2': 'An indicator or chart you need',
      'home.fb.li3': 'A button you cannot find',
      'home.fb.cta': '✍️ Send feedback',
      'home.fb.count': '{n} reports received — all read',

      'tb.chart': 'Chart',
      'tb.range': 'Range',
      'tb.add': '＋ Series',
      'tb.labels': 'Extremes',
      'tb.export': '⇩ Export',
      'tb.share': '🔗 Share link',
      'tb.more': '⚙ More',
      'range.all': 'All',
      'range.1y': '1Y',
      'range.5y': '5Y',
      'range.10y': '10Y',

      'fb.title': 'Feedback',
      'fb.sub': 'Found a bug or have an idea? Let me know.',
      'fb.type': 'Type',
      'fb.type.bug': 'Bug report',
      'fb.type.idea': 'Feature request',
      'fb.content': 'Details',
      'fb.content.ph': 'Describe the issue or the feature you want…',
      'fb.contact': 'Contact (optional)',
      'fb.contact.ph': 'Email / WeChat so I can reply',
      'fb.submit': 'Submit on GitHub',
      'fb.copy': 'Copy text',
      'fb.cancel': 'Cancel',
      'fb.done.github': 'GitHub opened — I will be notified after you submit',
      'fb.done.copy': 'Copied. Send it to me anytime.'
    }
  };

  var LANG = 'zh';

  function t(key) {
    var d = DICT[LANG] || DICT.zh;
    return d[key] !== undefined ? d[key] : (DICT.zh[key] !== undefined ? DICT.zh[key] : key);
  }

  function setLang(l) {
    LANG = (l === 'en') ? 'en' : 'zh';
    document.documentElement.setAttribute('lang', LANG === 'en' ? 'en' : 'zh-CN');
    try { localStorage.setItem('afg_lang', LANG); } catch (e) {}
    applyI18n();
  }
  function getLang() { return LANG; }

  /* 静态 HTML 上带 data-i18n 的元素自动翻译 */
  function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var k = el.getAttribute('data-i18n');
      var txt = t(k);
      if (el.tagName === 'OPTION') el.textContent = txt;
      else if (el.hasAttribute('data-i18n-attr') && el.getAttribute('data-i18n-attr') === 'title') el.title = txt;
      else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') el.placeholder = txt;
      else el.textContent = txt;
    });
    document.querySelectorAll('[data-i18n-title]').forEach(function (el) {
      el.title = t(el.getAttribute('data-i18n-title'));
    });
  }

  global.I18N = { t: t, setLang: setLang, getLang: getLang, apply: applyI18n, dict: DICT };
})(window);
