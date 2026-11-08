/* ADV 双语支持（中文 / English） */
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
      'nav.examples': '图表分类',

      'home.logo': 'ADV',
      'home.title': '上传数据，直接出图',
      'home.sub': 'Excel / CSV / JSON · 全程本地处理 · 不用登录',
      'step1.t': '上传数据',
      'step1.d': 'Excel / CSV / JSON，本地处理不上传',
      'step2.t': '自动出图',
      'step2.d': '趋势 / 业绩评估 / 机器学习 / 宏观',
      'step3.t': '自由调整',
      'step3.d': '配色、区间、叠加指标、数据标注',
      'home.cta': '＋ 上传数据出图',
      'home.note': '左侧「图表分类」有 10 大类 44 种现成图表案例，点开即可看大图。',
      'home.browse': '先逛图表分类',
      'home.browse.desc': '10 大类 · 44 种图表案例，先看看能画什么',
      'home.flow.title': '三步出图',
      'home.flow.1': '上传 Excel / CSV',
      'home.flow.2': '选制图方式（推荐或自选）',
      'home.flow.3': '导出高清图',

      'home.ai.adv': '进阶用法（配置 MCP / 让 AI 自己装）',
      'home.ai.title': '🤖 用 WorkBuddy / Kimi 等 AI 画图',
      'home.ai.desc': '复制下面这段话粘给 AI —— 它会自己完成全部配置，你不用懂技术细节。',
      'home.ai.ex1': '「用近 5 年沪深300和中证500做对比折线图」',
      'home.ai.ex2': '「画一张全球主要经济体的 GDP 热力图」',
      'home.ai.tip': '也可以把 Excel 发给 AI，再说「用 ADV 画图」。',
      'home.ai.demo': '▶ 看示例',
      'home.ai.detail': '支持 Codex / Kimi / Cursor / Claude 等，配置见 mcp-server/README.md',
      'home.ai.wayA': '方式 A · 零安装',
      'home.ai.wayA.desc': '复制下面这段发给 AI，它会自己拼出图表链接',
      'home.ai.copy': '📋 复制这段话给 AI（自动配置）',
      'home.ai.hint': '粘完之后，直接把数据或需求发给它，例如「帮我画这组数据的折线图」。',
      'home.ai.wayB': '方式 B · 配一次 MCP',
      'home.ai.wayB.desc': '在客户端加一行配置，之后直接说「用 ADV 画图」',
      'home.ai.copied': '已复制，粘贴给 AI 即可',
      'home.ai.a1': '点「复制提示词给 AI」，粘到 Cursor / Claude / Kimi / WorkBuddy 的对话框',
      'home.ai.a2': '接着说「用这个格式，帮我做一张 XXX 图，象牙白主题」',
      'home.ai.a3': 'AI 会返回一个 ?chart= 链接，点开即图，可导出/分享',
      'home.ai.guideToggle': '📖 展开完整配置教程（5 步 + 排错）',
      'home.ai.wayC': '方式 C · 让 AI 自己装',
      'home.ai.wayC.desc': '如果你的 AI 有终端/文件权限（Claude Code、Cursor Agent、Kimi Code 等），复制下面这段，它会自动完成安装配置',
      'home.ai.copyC': '🤖 复制自安装指令',
      'home.ai.wayC.warn': '纯聊天型 AI（网页版 ChatGPT 等）没有文件权限，用「方式 A」',
      'home.fb.title': '🐞 帮它变得更好',
      'home.fb.desc': '遇到 bug、想要新图表、觉得哪里难用？直接告诉我——你的反馈会变成下一次更新。',
      'home.fb.li1': '某张图数据不对 / 报错',
      'home.fb.li2': '想要某个指标或图表类型',
      'home.fb.li3': '按钮找不到 / 操作不顺手',
      'home.fb.cta': '✍️ 写下我的反馈',
      'home.fb.count': '已收到 {n} 条反馈，全部都会看',

      'nav.back': '← 返回',
      'tb.events': '◈ 事件',
      'tb.eventsTitle': '标注重要历史事件',
      'tb.chart': '图表',
      'tb.range': '区间',
      'tb.add': '＋ 指标',
      'tb.labels': '◉ 数据', 'tb.palette': '🎨 配色', 'labels.all': '全部标注', 'labels.extreme': '极值标注', 'labels.off': '关闭标注',
      'tb.export': '⇩ 导出图片',
      'tb.share': '🔗 复制链接',
      'tb.more': '⚙ 更多',
      'range.all': '全部',
      'range.1y': '近1年',
      'range.5y': '近5年',
      'range.10y': '近10年',

      'more.color': '🎨 单条颜色',
      'more.swap': '⇅ 交换 X/Y',
      'more.transform': '⚙ 数据变换',
      'more.annot': '✎ 说明',
      'more.clearAnnot': '清除说明',
      'more.table': '☰ 表格',
      'more.watermark': '▦ 水印',
      'ex.title': '数据探索',
      'ex.sub': '用已有数据自由组合，一键生成热力矩阵 / 散点矩阵 / 雷达图等',
      'ex.source': '数据源',
      'ex.all': '全部（宏观+金融）',
      'ex.china': '中国宏观',
      'ex.intl': '国际宏观',
      'ex.fin': '金融数据',
      'ex.chartType': '图表类型',
      'ex.tHeat': '热力矩阵（指标×时间）',
      'ex.tMulti': '多线对比',
      'ex.tScatter': '散点矩阵（关联）',
      'ex.tRadar': '雷达图（最新快照）',
      'ex.tRank': '横向排名（最新值）',
      'ex.pick': '选择指标',
      'ex.hint': '可跨板块多选，例如「制造业PMI」+「GDP」做关联',
      'ex.gen': '生成图表',
      'ex.clear': '清空选择',
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
      'nav.examples': 'Chart Types',

      'home.logo': 'ADV',
      'home.title': 'Upload data, get charts',
      'home.sub': 'Excel / CSV / JSON · processed locally · no login',
      'step1.t': 'Upload',
      'step1.d': 'Excel / CSV / JSON, processed locally',
      'step2.t': 'Auto chart',
      'step2.d': 'Trend / Performance / ML / Macro',
      'step3.t': 'Customize',
      'step3.d': 'Colors, range, overlays, labels',
      'home.cta': '＋ Upload data',
      'home.note': '44 ready-made chart examples across 9 categories — click any to open.',
      'home.browse': 'Browse chart types',
      'home.browse.desc': '10 categories · 44 chart examples — see what you can make',
      'home.flow.title': 'Three steps',
      'home.flow.1': 'Upload Excel / CSV',
      'home.flow.2': 'Pick how to chart it',
      'home.flow.3': 'Export hi-res image',

      'home.ai.adv': 'Advanced (MCP setup / let the AI install)',
      'home.ai.title': '🤖 Chart with WorkBuddy / Kimi / Cursor',
      'home.ai.desc': 'Paste the block below to your AI — it configures everything itself. No technical knowledge needed.',
      'home.ai.ex1': '"Compare CSI300 and CSI500 over the last 5 years"',
      'home.ai.ex2': '"Make a GDP heatmap of major economies"',
      'home.ai.tip': 'You can also paste an Excel into the AI and say "chart it with ADV".',
      'home.ai.demo': '▶ See example',
      'home.ai.detail': 'Works with Codex / Kimi / Cursor / Claude. Setup: mcp-server/README.md',
      'home.ai.wayA': 'Option A · No install',
      'home.ai.wayA.desc': 'Copy the prompt below to any AI — it builds the chart link itself',
      'home.ai.copy': '📋 Copy setup prompt',
      'home.ai.hint': 'After pasting, just send your data or request, e.g. \"chart this as a line chart\".',
      'home.ai.wayB': 'Option B · Configure MCP once',
      'home.ai.wayB.desc': 'Add one line to your client, then just say "chart it with ADV"',
      'home.ai.copied': 'Copied — paste it to your AI',
      'home.ai.a1': 'Click "Copy prompt" and paste it into Cursor / Claude / Kimi / WorkBuddy',
      'home.ai.a2': 'Then say: "use this format to chart XXX, paper theme"',
      'home.ai.a3': 'The AI returns a ?chart= link — open it, export or share',
      'home.ai.guideToggle': '📖 Full setup guide (5 steps + troubleshooting)',
      'home.ai.wayC': 'Option C · Let the AI install it',
      'home.ai.wayC.desc': 'If your agent has terminal/file access (Claude Code, Cursor Agent, Kimi Code), paste this and it will set everything up',
      'home.ai.copyC': '🤖 Copy self-install prompt',
      'home.ai.wayC.warn': 'Chat-only AIs (web ChatGPT etc.) have no file access — use Option A',
      'home.fb.title': '🐞 Help make it better',
      'home.fb.desc': 'Found a bug, want a new chart, or something feels awkward? Tell me — your feedback ships in the next update.',
      'home.fb.li1': 'Wrong data or an error',
      'home.fb.li2': 'An indicator or chart you need',
      'home.fb.li3': 'A button you cannot find',
      'home.fb.cta': '✍️ Send feedback',
      'home.fb.count': '{n} reports received — all read',

      'nav.back': '← Back',
      'tb.events': '◈ Events',
      'tb.eventsTitle': 'Mark key historical events',
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

      'more.color': '🎨 Series color',
      'more.swap': '⇅ Swap X/Y',
      'more.transform': '⚙ Transform',
      'more.annot': '✎ Annotate',
      'more.clearAnnot': 'Clear notes',
      'more.table': '☰ Table',
      'more.watermark': '▦ Watermark',
      'ex.title': 'Explore',
      'ex.sub': 'Combine any indicators to build heatmaps, scatter matrices, radar charts and more',
      'ex.source': 'Data source',
      'ex.all': 'All (macro + markets)',
      'ex.china': 'China Macro',
      'ex.intl': 'Global Macro',
      'ex.fin': 'Markets',
      'ex.chartType': 'Chart type',
      'ex.tHeat': 'Heatmap (indicator × time)',
      'ex.tMulti': 'Multi-line comparison',
      'ex.tScatter': 'Scatter matrix (correlation)',
      'ex.tRadar': 'Radar (latest snapshot)',
      'ex.tRank': 'Ranking (latest value)',
      'ex.pick': 'Select indicators',
      'ex.hint': 'Pick across sections, e.g. Manufacturing PMI + GDP',
      'ex.gen': 'Generate chart',
      'ex.clear': 'Clear',
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
