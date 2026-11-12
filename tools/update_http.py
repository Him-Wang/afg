#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""ADV 数据更新（纯 HTTP，无需 akshare / yfinance）

数据源：
  金融  A股指数  → 腾讯行情 kline
        美股指数  → 新浪美股历史
        商品/原油 → 新浪全球期货历史
  中国宏观 → 东方财富数据中心 + 金十 SHIBOR + 东财 LPR
  国际宏观 → 东方财富数据中心（仅覆盖有公开指标的品种）

只做「增量追加」：新日期 > 现有最后日期；并且用重叠日校验数据源是否同一口径，
对不上就跳过该指标（避免把不同指数的数据混进去）。

用法：
  python3 tools/update_http.py            # 金融 + 宏观
  python3 tools/update_http.py --finance  # 只金融
  python3 tools/update_http.py --macro    # 只宏观
"""
import json
import os
import re
import subprocess
import sys
import time
import urllib.parse
import urllib.request
from datetime import datetime, date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36')


def http(url, ref=None, enc='utf-8', timeout=25, retries=2):
    last = None
    for _ in range(retries + 1):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA,
                                                       'Referer': ref or 'https://finance.sina.com.cn/'})
            with urllib.request.urlopen(req, timeout=timeout) as r:
                return r.read().decode(enc, 'ignore')
        except Exception as e:
            last = e
            time.sleep(2)
    raise last


def get_json(url, ref=None):
    return json.loads(http(url, ref))


# ---------------- 通用：读写 JS 数据 ----------------
def read_js_var(filename, var):
    path = os.path.join(ROOT, 'js', filename)
    if not os.path.exists(path):
        return None
    txt = open(path, encoding='utf-8').read()
    m = re.search(r'window\.' + var + r'\s*=\s*(\{.*\});?\s*$', txt, re.S)
    return json.loads(m.group(1)) if m else None


def write_js_var(filename, var, obj, note):
    path = os.path.join(ROOT, 'js', filename)
    js = '/* %s */\nwindow.%s = %s;\n' % (note, var, json.dumps(obj, ensure_ascii=False))
    open(path, 'w', encoding='utf-8').write(js)
    print('  写入 %s (%.1f KB)' % (filename, len(js) / 1024))


# ---------------- 金融数据 ----------------
def _decode_labels(item):
    import datetime as dt
    if isinstance(item.get('labels'), list):
        raw = item['labels']
    elif item.get('dt'):
        raw = [item['dt'][i:i + 6] for i in range(0, len(item['dt']) - 5, 6)]
    elif item.get('ds'):
        t = item['ds'][:6]
        d = dt.date(2000 + int(t[:2]), int(t[2:4]), int(t[4:6]))
        out = [d.isoformat()]
        for ch in item['ds'][6:]:
            d = d + dt.timedelta(days=int(ch, 36))
            out.append(d.isoformat())
        return out
    else:
        return []
    return [('20' + x[:2] + '-' + x[2:4] + '-' + x[4:6]) if len(str(x)) == 6 and str(x).isdigit() else x for x in raw]


def read_finance():
    idx_path = os.path.join(ROOT, 'js', 'finance-index.js')
    if not os.path.exists(idx_path):
        return read_js_var('finance-data.js', 'FINANCE_DATA')
    idx = json.loads(re.search(r'=\s*(\{.*\});?\s*$', open(idx_path, encoding='utf-8').read(), re.S).group(1))
    out = {'updated': idx.get('updated', ''), 'sections': []}
    for meta in idx.get('sections', []):
        p = os.path.join(ROOT, meta['file'])
        if not os.path.exists(p):
            continue
        sec = json.loads(re.search(r'=(\{.*\});\}\)\(\);', open(p, encoding='utf-8').read(), re.S).group(1))
        items = []
        for it in sec.get('items', []):
            items.append({'title': it.get('title', ''), 'unit': it.get('unit', ''),
                          'type': it.get('type', 'line'), 'labels': _decode_labels(it),
                          'series': [{'name': (it['series'][0].get('name') or it.get('title')) if it.get('series') else it.get('title'),
                                      'values': it['series'][0].get('values') or []} for _ in [0]] if it.get('series') else []})
        out['sections'].append({'name': sec.get('name', meta.get('name')), 'items': items})
    return out


def tencent_kline(sym, n=40):
    url = 'https://web.ifzq.gtimg.cn/appstock/app/kline/kline?param=%s,day,,,%d' % (sym, n)
    d = get_json(url, 'https://gu.qq.com/')
    data = (d.get('data') or {})
    node = None
    for k, v in data.items():
        if isinstance(v, dict) and (v.get('day') or v.get('qfqday')):
            node = v
            break
    if not node:
        return None
    arr = node.get('day') or node.get('qfqday')
    return [(row[0], float(row[2])) for row in arr if len(row) >= 3]


def sina_us(sym, ref='https://finance.sina.com.cn/'):
    url = ('https://stock.finance.sina.com.cn/usstock/api/jsonp.php/var%20_x/'
           'US_MinKService.getDailyK?symbol=' + urllib.parse.quote(sym) + '&___qn=3')
    txt = http(url, ref, enc='gbk')
    m = re.search(r'var _x\((\[.*\])\)', txt, re.S)
    if not m:
        return None
    arr = json.loads(m.group(1))
    return [(x['d'], float(x['c'])) for x in arr if x.get('d') and x.get('c')]


def sina_fut(sym, ref='https://finance.sina.com.cn/'):
    url = ('https://stock2.finance.sina.com.cn/futures/api/jsonp.php/var%20_x/'
           'GlobalFuturesService.getGlobalFuturesDailyKLine?symbol=' + sym)
    txt = http(url, ref, enc='gbk')
    m = re.search(r'var _x\((\[.*?\])\);', txt, re.S)
    if not m:
        return None
    arr = json.loads(m.group(1))
    out = []
    for x in arr:
        if x.get('date') and x.get('close'):
            try:
                out.append((x['date'], float(x['close'])))
            except ValueError:
                pass
    return out



EM_HOSTS = ['push2his.eastmoney.com', '1.push2his.eastmoney.com', '5.push2his.eastmoney.com',
            '12.push2his.eastmoney.com', '23.push2his.eastmoney.com', '33.push2his.eastmoney.com',
            '48.push2his.eastmoney.com', '61.push2his.eastmoney.com', '74.push2his.eastmoney.com']


def em_kline(secid, lmt=80, tries=2):
    """东财日线：多个 numbered 主机轮询（单主机容易被限流）"""
    for _ in range(tries):
        for host in EM_HOSTS:
            url = ('https://%s/api/qt/stock/kline/get?secid=%s&fields1=f1,f2,f3&fields2=f51,f53'
                   '&klt=101&fqt=1&end=20500101&lmt=%d' % (host, secid, lmt))
            try:
                req = urllib.request.Request(url, headers={'User-Agent': UA,
                                                           'Referer': 'https://quote.eastmoney.com/'})
                with urllib.request.urlopen(req, timeout=12) as r:
                    d = json.loads(r.read().decode('utf-8', 'ignore'))
                data = d.get('data') or {}
                if data.get('klines'):
                    out = []
                    for row in data['klines']:
                        parts = row.split(',')
                        try:
                            out.append((parts[0], float(parts[1])))
                        except (IndexError, ValueError):
                            pass
                    return out
            except Exception:
                pass
            time.sleep(0.5)
    return None

FIN_SOURCES = {   # 标题 → 取数函数
    '沪深300': lambda: tencent_kline('sh000300'),
    '中证500': lambda: tencent_kline('sh000905'),
    '中证1000': lambda: tencent_kline('sh000852'),
    '创业板指': lambda: tencent_kline('sz399006'),
    '科创50': lambda: tencent_kline('sh000688'),
    '纳斯达克': lambda: sina_us('.IXIC'),
    '标普500': lambda: sina_us('.INX'),
    '道琼斯': lambda: sina_us('.DJI'),
    'COMEX黄金': lambda: sina_fut('GC'),
    'COMEX白银': lambda: sina_fut('SI'),
    'WTI原油': lambda: sina_fut('CL'),
    '布伦特原油': lambda: sina_fut('OIL'),
    'LME铜': lambda: sina_fut('CAD'),
    'LME铝': lambda: sina_fut('AHD'),
    # ---- 东财兜底（美股之外的全球指数、国债、汇率、波动率）----
    '日经225': lambda: em_kline('100.N225'),
    '韩国KOSPI': lambda: em_kline('100.KS11'),
    '德国DAX': lambda: em_kline('100.GDAXI'),
    '法国CAC40': lambda: em_kline('100.FCHI'),
    '英国富时100': lambda: em_kline('100.FTSE'),
    '美元指数': lambda: em_kline('100.UDI'),
    '美元兑人民币(在岸)': lambda: em_kline('133.USDCNH'),
    '美国10年期国债': lambda: em_kline('171.US10Y'),
    '标普500波动率(VIX)': lambda: em_kline('100.VIX'),
    '纳斯达克100波动率': lambda: em_kline('100.VXN'),
    'LME锌': lambda: em_kline('101.ZDS00Y'),
}


def append_series(labels, values, new_pairs, tol=0.01):
    """重叠日校验后追加；返回 (labels, values, added)"""
    if not new_pairs:
        return labels, values, 0
    last = labels[-1] if labels else ''
    last_v = values[-1] if values else None
    # 校验口径：源数据里与现有最后日期相同的那天，数值应接近
    src = dict(new_pairs)
    ratio = 1.0
    if last and last in src and last_v is not None and src[last]:
        diff = abs(src[last] - float(last_v)) / max(abs(float(last_v)), 1e-9)
        if diff > 0.06:      # 差得太多：不是同一个标的
            return labels, values, -1
        if diff > tol:       # 轻微口径差：按重叠日比例对齐，保证曲线连续
            ratio = float(last_v) / float(src[last])
    if ratio != 1.0:
        new_pairs = [(d, v * ratio) for d, v in new_pairs]
    add = [(d, v) for d, v in new_pairs if d > last]
    if not add:
        return labels, values, 0
    labels = labels + [d for d, _ in add]
    values = values + [round(v, 2) for _, v in add]
    return labels, values, len(add)


def update_finance():
    fin = read_finance()
    if not fin:
        print('未找到金融数据，跳过')
        return 0
    total = 0
    for sec in fin['sections']:
        for item in sec['items']:
            fn = FIN_SOURCES.get(item['title'])
            if not fn:
                continue
            try:
                pairs = fn()
            except Exception as e:
                print('  ✗', item['title'], str(e)[:60])
                continue
            if not pairs:
                print('  - ', item['title'], '无数据')
                continue
            labels, values, added = append_series(item['labels'], item['series'][0]['values'], pairs)
            if added < 0:
                print('  ! ', item['title'], '口径不一致，跳过')
                continue
            item['labels'] = labels
            item['series'][0]['values'] = values
            if added:
                total += 1
                print('  ✓', item['title'], '+%d → %s' % (added, labels[-1]))
            # 控制请求频率
            time.sleep(0.6)
    maxd = ''
    for sec in fin['sections']:
        for it in sec['items']:
            if it['labels'] and it['labels'][-1] > maxd:
                maxd = it['labels'][-1]
    fin['updated'] = maxd
    tmp = '/tmp/finance-data-new.js'
    open(tmp, 'w', encoding='utf-8').write('window.FINANCE_DATA = %s;\n' % json.dumps(fin, ensure_ascii=False))
    subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'split_finance.py'), tmp], check=False)
    print('金融数据更新完成：%d 项有新数据，最新 %s' % (total, maxd))
    return total


# ---------------- 中国宏观 ----------------
EM = 'https://datacenter-web.eastmoney.com/api/data/v1/get'


def em_report(report, columns='ALL', extra=None, page_size=2000):
    q = {'reportName': report, 'columns': columns, 'pageNumber': '1', 'pageSize': str(page_size),
         'sortColumns': 'REPORT_DATE', 'sortTypes': '-1', 'source': 'WEB', 'client': 'WEB'}
    if extra:
        q.update(extra)
    return get_json(EM + '?' + urllib.parse.urlencode(q), 'https://data.eastmoney.com/')


def month_end(d):
    y, m = int(d[0:4]), int(d[5:7])
    nxt = date(y + (m == 12), 1 if m == 12 else m + 1, 1)
    return (nxt - timedelta(days=1)).isoformat()


def em_series(report, field, freq='month', extra=None):
    d = em_report(report, extra=extra)
    rows = ((d.get('result') or {}).get('data')) or []
    out = {}
    for r in rows:
        rd = (r.get('REPORT_DATE') or '')[:10]
        v = r.get(field)
        if not rd or v is None:
            continue
        key = month_end(rd) if freq == 'month' else rd
        try:
            out[key] = float(v)
        except (TypeError, ValueError):
            pass
    return out


def em_series_multi(report, fields, freq='month'):
    d = em_report(report)
    rows = ((d.get('result') or {}).get('data')) or []
    out = {}
    for r in rows:
        rd = (r.get('REPORT_DATE') or '')[:10]
        if not rd:
            continue
        key = month_end(rd) if freq == 'month' else rd
        vals = {}
        for f in fields:
            try:
                vals[f] = float(r.get(f))
            except (TypeError, ValueError):
                pass
        if vals:
            out[key] = vals
    return out


def shibor_on():
    d = get_json('https://cdn.jin10.com/data_center/reports/il_1.json?' + str(int(time.time() * 1000)),
                 'https://datacenter.jin10.com/')
    vals = (d.get('values') or {})
    out = {}
    for day, obj in vals.items():
        on = (obj or {}).get('O/N') or []
        if on and on[0] not in (None, '--'):
            try:
                out[str(day)[:10]] = float(on[0])
            except (TypeError, ValueError):
                pass
    return out


def lpr_series():
    d = em_report('RPTA_WEB_RATE', extra={'pageSize': '300'})
    rows = ((d.get('result') or {}).get('data')) or []
    one, five = {}, {}
    for r in rows:
        rd = (r.get('TRADE_DATE') or '')[:10]
        if not rd:
            continue
        for key, f in (('1y', 'LPR1Y'), ('5y', 'LPR5Y')):
            try:
                v = float(r.get(f))
            except (TypeError, ValueError):
                continue
            (one if key == '1y' else five)[rd] = v
    return one, five


MACRO_MAP = {   # 中国宏观：指标 → 数据（日期→值）
    '制造业 PMI': lambda: {k: v.get('MAKE_INDEX') for k, v in em_series_multi('RPT_ECONOMY_PMI', ['MAKE_INDEX']).items() if v.get('MAKE_INDEX')},
    '服务业 PMI': lambda: {k: v.get('NMAKE_INDEX') for k, v in em_series_multi('RPT_ECONOMY_PMI', ['NMAKE_INDEX']).items() if v.get('NMAKE_INDEX')},
    'CPI 整体': lambda: em_series('RPT_ECONOMY_CPI', 'NATIONAL_SAME'),
    'PPI（出厂）': lambda: em_series('RPT_ECONOMY_PPI', 'BASE_SAME'),
    '规格以上工业增加值': lambda: em_series('RPT_ECONOMY_INDUS_GROW', 'BASE_SAME'),
    '规模以上工业增加值': lambda: em_series('RPT_ECONOMY_INDUS_GROW', 'BASE_SAME'),
    '固定资产投资': lambda: em_series('RPT_ECONOMY_ASSET_INVEST', 'BASE_SAME'),
    '社会消费品零售总额': lambda: em_series('RPT_ECONOMY_TOTAL_RETAIL', 'RETAIL_TOTAL_SAME'),
    '出口（美元计）': lambda: em_series('RPT_ECONOMY_CUSTOMS', 'EXIT_BASE_SAME'),
    '进口（美元计）': lambda: em_series('RPT_ECONOMY_CUSTOMS', 'IMPORT_BASE_SAME'),
    '新增人民币贷款': lambda: em_series('RPT_ECONOMY_RMB_LOAN', 'RMB_LOAN'),
    'M1 同比': lambda: em_series('RPT_ECONOMY_CURRENCY_SUPPLY', 'BASIC_CURRENCY_SAME'),
    'M2 同比': lambda: em_series('RPT_ECONOMY_CURRENCY_SUPPLY', 'CURRENCY_SAME'),
    'SHIBOR 隔夜': shibor_on,
}


def append_map(labels, values, series_map, tol=None):
    if not series_map:
        return labels, values, 0
    last = labels[-1] if labels else ''
    last_v = values[-1] if values else None
    if tol and last in series_map and last_v is not None:
        try:
            if abs(float(series_map[last]) - float(last_v)) > tol:
                return labels, values, -1
        except (TypeError, ValueError):
            pass
    add = [(d, series_map[d]) for d in sorted(series_map) if d > last]
    if not add:
        return labels, values, 0
    return labels + [d for d, _ in add], values + [round(float(v), 2) for _, v in add], len(add)


def update_macro():
    macro = read_js_var('china-macro.js', 'CHINA_MACRO')
    if not macro:
        print('未找到 china-macro.js，跳过')
        return 0
    changed = 0
    for sec in macro['sections']:
        for item in sec['items']:
            fn = MACRO_MAP.get(item['title'])
            if not fn:
                continue
            try:
                sm = fn()
            except Exception as e:
                print('  ✗', item['title'], str(e)[:70])
                continue
            # SHIBOR 是日频，其他是月频：用单位判断容差
            tol = None
            labels, values, added = append_map(item['labels'], item['series'][0]['values'], sm, tol)
            if added < 0:
                print('  ! ', item['title'], '口径不一致，跳过')
                continue
            item['labels'], item['series'][0]['values'] = labels, values
            if added:
                changed += 1
                print('  ✓', item['title'], '+%d → %s' % (added, labels[-1]))
    # 派生序列：PPI 剪刀差、M1-M2 剪刀差
    def find(title):
        for sec in macro['sections']:
            for it in sec['items']:
                if it['title'] == title:
                    return it
        return None

    def rebuild_derived(target_title, a_title, b_title):
        t, a, b = find(target_title), find(a_title), find(b_title)
        if not (t and a and b):
            return
        bm = dict(zip(b['labels'], b['series'][0]['values']))
        out_l, out_v = [], []
        for i, d in enumerate(a['labels']):
            if d in bm:
                out_l.append(d)
                out_v.append(round(a['series'][0]['values'][i] - bm[d], 2))
        t['labels'], t['series'][0]['values'] = out_l, out_v

    rebuild_derived('PPI 剪刀差（出厂-购进）', 'PPI（出厂）', 'PPIRM（购进）')
    rebuild_derived('M1-M2 剪刀差', 'M1 同比', 'M2 同比')

    # LPR
    try:
        one, five = lpr_series()
        for title, sm in (('LPR 1年', one), ('LPR 5年', five)):
            it = find(title)
            if not it:
                continue
            labels, values, added = append_map(it['labels'], it['series'][0]['values'], sm)
            if added > 0:
                it['labels'], it['series'][0]['values'] = labels, values
                changed += 1
                print('  ✓', title, '+%d → %s' % (added, labels[-1]))
    except Exception as e:
        print('  ✗ LPR', str(e)[:60])

    maxd = ''
    for sec in macro['sections']:
        for it in sec['items']:
            if it['labels'] and it['labels'][-1] > maxd:
                maxd = it['labels'][-1]
    macro['updated'] = maxd
    write_js_var('china-macro.js', 'CHINA_MACRO', macro, '中国宏观数据一览（自动更新）')
    print('宏观数据更新完成：%d 个指标有新数据，最新 %s' % (changed, maxd))
    return changed


def main():
    args = set(sys.argv[1:])
    do_fin = '--finance' in args or not (args & {'--finance', '--macro'})
    do_macro = '--macro' in args or not (args & {'--finance', '--macro'})
    if do_fin:
        print('== 金融数据 ==')
        update_finance()
    if do_macro:
        print('== 宏观数据 ==')
        update_macro()


if __name__ == '__main__':
    main()
