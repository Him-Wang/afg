# -*- coding: utf-8 -*-
"""用 FRED 更新美国非农就业 + 失业率（FRED 公开 CSV 端点，无需 API key）"""
import csv, io, json, re, urllib.request

FRED = 'https://fred.stlouisfed.org/graph/fredgraph.csv?id=%s'

def fetch(series_id):
    import subprocess
    txt = subprocess.run(['curl','-s','-m','40', FRED % series_id],
                         capture_output=True, text=True).stdout
    out = []
    for r in csv.reader(io.StringIO(txt)):
        if len(r) < 2: continue
        d, v = r[0].strip(), r[1].strip()
        if not re.match(r'^\d{4}-\d{2}-\d{2}$', d): continue
        if v in ('', '.', 'NA'): continue
        try: out.append((d, float(v)))
        except ValueError: continue
    out.sort(key=lambda x: x[0])
    return out

unrate = fetch('UNRATE')     # 失业率 %
payems = fetch('PAYEMS')     # 非农就业人数（千人，水平值）

# 非农改为「月度变化（万人）」
nf = []
for i in range(1, len(payems)):
    d, v = payems[i]
    prev = payems[i-1][1]
    nf.append((d, round((v - prev) / 10.0, 1)))

print('UNRATE:', len(unrate), unrate[-1])
print('PAYEMS:', len(payems), payems[-1])
print('非农变化(万人):', len(nf), nf[-3:])

# 载入现有数据
P = 'js/intl-macro.js'
txt = open(P, encoding='utf-8').read()
m = re.search(r'window\.INTL_MACRO\s*=\s*(\{.*\})\s*;?\s*$', txt, re.S)
D = json.loads(m.group(1))

sec = None
for s in D['sections']:
    if '就业' in s['name']:
        sec = s; break
assert sec, '未找到就业分组'

def replace_item(title, labels, values, unit):
    for it in sec['items']:
        if it['title'] == title:
            it['labels'] = labels
            it['series'] = [{'name': title, 'values': values}]
            it['unit'] = unit
            it['type'] = 'line'
            print(' ✓', title, '更新为', len(labels), '点，末:', labels[-1], '=', values[-1])
            return True
    print(' ✗ 未找到', title)
    return False

replace_item('美国失业率', [d for d, _ in unrate], [v for _, v in unrate], '%')
replace_item('美国非农就业', [d for d, _ in nf], [v for _, v in nf], '万人')

# 全局最新（取所有条目最大标签）
maxd = ''
for s in D['sections']:
    for it in s['items']:
        if it['labels'] and it['labels'][-1] > maxd:
            maxd = it['labels'][-1]
D['updated'] = D.get('updated', '')
out = '/* 国际宏观数据（FRED + akshare 自动更新） */\nwindow.INTL_MACRO = ' + json.dumps(D, ensure_ascii=False) + ';\n'
open(P, 'w', encoding='utf-8').write(out)
print('写入完成 | %.1f KB | 数据最新标签: %s' % (len(out)/1024, maxd))
