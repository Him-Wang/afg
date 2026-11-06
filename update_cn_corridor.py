# -*- coding: utf-8 -*-
"""中国利率走廊：隔夜逆回购为锚，±25bp 形成上下限（2024-01 至今）
   数据来源：
   - 7 天逆回购利率历史（2024-07-22:1.70 / 2024-09-27:1.50 / 2025-05-08:1.40）
   - 2026-11-02 起换锚为隔夜逆回购 1.25%（央行公告，证券时报 2026-11-02 报道）
"""
import json, re
from datetime import date

# (生效日, 政策利率)
ANCHOR = [
    ('2024-01-01', 1.80),
    ('2024-07-22', 1.70),
    ('2024-09-27', 1.50),
    ('2025-05-08', 1.40),
    ('2026-11-02', 1.25),
]
SPREAD = 0.25

def rate_on(d):
    v = ANCHOR[0][1]
    for eff, r in ANCHOR:
        if d >= eff: v = r
        else: break
    return v

pts = set()
y, m = 2024, 1
while (y, m) <= (2026, 11):
    pts.add('%04d-%02d-01' % (y, m))
    m += 1
    if m > 12: m = 1; y += 1
for eff, _ in ANCHOR: pts.add(eff)
labels, mid, up, low = [], [], [], []
for d in sorted(pts):
    r = rate_on(d)
    labels.append(d); mid.append(round(r,2)); up.append(round(r+SPREAD,2)); low.append(round(r-SPREAD,2))

P = 'js/intl-macro.js'
txt = open(P, encoding='utf-8').read()
m_ = re.search(r'window\.INTL_MACRO\s*=\s*(\{.*\})\s*;?\s*$', txt, re.S)
D = json.loads(m_.group(1))

it = None
for s in D['sections']:
    for x in s['items']:
        if x['title'] == '中国央行利率':
            it = x
if it is None: raise SystemExit('未找到 中国央行利率')

it['title'] = '中国政策利率（走廊）'
it['unit'] = '%'
it['type'] = 'line'
it['labels'] = labels
it['series'] = [
    {'name': '政策利率', 'values': mid},
    {'name': '走廊上限', 'values': up},
    {'name': '走廊下限', 'values': low},
]
D['updated'] = '2026-11-06'
out = '/* 国际宏观数据（FRED + BIS + Eurostat + akshare 自动更新） */\nwindow.INTL_MACRO = ' + json.dumps(D, ensure_ascii=False) + ';\n'
open(P, 'w', encoding='utf-8').write(out)
print(' ✓ 中国政策利率（走廊）%s ~ %s | %d 个月 | 末: 上限%.2f / 中枢%.2f / 下限%.2f' % (
    labels[0], labels[-1], len(labels), up[-1], mid[-1], low[-1]))
print('   变动点:', [(l, mid[i]) for i, l in enumerate(labels) if i == 0 or mid[i] != mid[i-1]])
