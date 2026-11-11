#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把 finance-data.js 拆成「索引 + 按板块的文件」，并把数据瘦身：
   · 日期压缩成 YYMMDD（6 字符），加载时再还原
   · 数值最多保留 2 位小数
用法：python3 tools/split_finance.py [js/finance-data.js]
产物：js/finance-index.js + js/finance-<key>.js（原文件删除）
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'js', 'finance-data.js')

SECTION_KEYS = {'股票': 'stock', '债券': 'bond', '商品': 'commodity', '外汇': 'fx', 'VIX': 'vix'}


def round2(v):
    if isinstance(v, bool) or v is None:
        return v
    if isinstance(v, (int, float)):
        r = round(float(v), 2)
        return int(r) if r == int(r) else r
    return v


def compact_labels(labels):
    out = []
    for s in labels:
        m = re.match(r'^(\d{4})-(\d{2})-(\d{2})$', str(s))
        out.append(m.group(1)[2:] + m.group(2) + m.group(3) if m else str(s))
    return out


def pack_dates(comp):
    """首日 YYMMDD + 逐日间隔 base36 字符；不适用时返回 {}。"""
    if len(comp) < 3 or not all(re.match(r'^\d{6}$', str(x)) for x in comp):
        return {}
    import datetime as _dt

    def to_date(t):
        return _dt.date(2000 + int(t[:2]), int(t[2:4]), int(t[4:6]))

    try:
        dates = [to_date(x) for x in comp]
    except ValueError:
        return {}
    out = [comp[0]]
    for a, b in zip(dates, dates[1:]):
        gap = (b - a).days
        if gap < 1 or gap > 35:
            return {}
        out.append('0123456789abcdefghijklmnopqrstuvwxyz'[gap])
    return {'ds': ''.join(out)}


def main():
    if not os.path.exists(SRC):
        print('找不到', SRC)
        return 1
    txt = open(SRC, encoding='utf-8').read()
    m = re.search(r'window\.FINANCE_DATA\s*=\s*(\{.*\});?\s*$', txt, re.S)
    if not m:
        print('解析失败：finance-data.js 不是预期结构')
        return 1
    data = json.loads(m.group(1))

    index = {'updated': data.get('updated', ''), 'sections': []}
    total_before = len(txt.encode())
    total_after = 0

    for sec in data.get('sections', []):
        name = sec.get('name', '')
        key = SECTION_KEYS.get(name) or re.sub(r'\W+', '', name).lower() or 'misc'
        items = []
        for it in sec.get('items', []):
            labels = it.get('labels') or []
            series = []
            for s in it.get('series') or []:
                series.append({'name': s.get('name', it.get('title', '')),
                               'values': [round2(v) for v in (s.get('values') or [])]})
            comp = compact_labels(labels)
            item = {'title': it.get('title', ''), 'unit': it.get('unit', ''),
                    'type': it.get('type', 'line')}
            # 日期压缩：首日 YYMMDD + 每天间隔用 base36 单字符（间隔 1-35 天时可用）
            packed = pack_dates(comp)
            if packed.get('ds'):
                item['ds'] = packed['ds']
            elif comp and all(re.match(r'^\d{6}$', str(x)) for x in comp):
                item['dt'] = ''.join(comp)
            else:
                item['labels'] = comp
            if len(series) == 1 and series[0]['name'] == item['title']:
                item['series'] = [{'values': series[0]['values']}]
            else:
                item['series'] = series
            items.append(item)
        payload = {'name': name, 'key': key, 'items': items}
        body = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
        out = ('(function(){window.FINANCE_SECTIONS=window.FINANCE_SECTIONS||{};'
               'window.FINANCE_SECTIONS["%s"]=%s;})();\n' % (key, body))
        path = os.path.join(ROOT, 'js', 'finance-%s.js' % key)
        open(path, 'w', encoding='utf-8').write(out)
        size = len(out.encode())
        total_after += size
        print('  %-8s %2d 项  %6.1f KB  → js/finance-%s.js' % (name, len(items), size / 1024, key))
        index['sections'].append({
            'key': key, 'name': name, 'file': 'js/finance-%s.js' % key,
            'count': len(items),
            'items': [{'title': i['title'], 'unit': i['unit'], 'type': i['type']} for i in items]
        })

    idx_body = json.dumps(index, ensure_ascii=False, separators=(',', ':'))
    idx_out = 'window.FINANCE_INDEX = %s;\n' % idx_body
    open(os.path.join(ROOT, 'js', 'finance-index.js'), 'w', encoding='utf-8').write(idx_out)
    total_after += len(idx_out.encode())
    print('  index    %6.1f KB  → js/finance-index.js' % (len(idx_out.encode()) / 1024))
    print('总计：%.2f MB → %.2f MB（-%.0f%%）' % (total_before / 1048576, total_after / 1048576,
                                               (1 - total_after / total_before) * 100))
    if os.path.abspath(SRC) == os.path.join(ROOT, 'js', 'finance-data.js'):
        os.remove(SRC)
    return 0


if __name__ == '__main__':
    sys.exit(main())
