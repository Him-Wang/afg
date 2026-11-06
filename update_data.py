#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AFG 数据自动更新脚本 v2（免登录，akshare + yfinance）

数据源：
    金融数据：A股指数用 akshare，全球指数/商品/外汇/VIX/美债用 yfinance
    宏观数据：中国宏观用 akshare

只追加最新数据：读取现有 finance-data.js / china-macro.js，仅抓取最近一段时间的
数据，把「晚于现有最后日期」的新点追加进去，不动历史数据。

用法：
    python3 update_data.py --finance    # 更新金融（周更）
    python3 update_data.py --macro      # 更新宏观（月更）
    python3 update_data.py              # 两者都更新
    python3 update_data.py --no-push    # 只生成不推送

依赖：
    pip install akshare yfinance requests
"""
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timedelta

import akshare as ak

ROOT = os.path.dirname(os.path.abspath(__file__))


# ---------- 通用 ----------
def read_js_var(filename, var):
    path = os.path.join(ROOT, "js", filename)
    if not os.path.exists(path):
        return None
    txt = open(path, encoding="utf-8").read()
    m = re.search(r"window\." + var + r"\s*=\s*(\{.*\})\s*;?\s*$", txt, re.S)
    if not m:
        m = re.search(r"window\." + var + r"\s*=\s*(.+)", txt)
    if not m:
        return None
    try:
        return json.loads(m.group(1))
    except json.JSONDecodeError:
        return None


def write_js_var(filename, var, obj, note):
    path = os.path.join(ROOT, "js", filename)
    js = "/* %s */\nwindow.%s = %s;\n" % (note, var, json.dumps(obj, ensure_ascii=False))
    with open(path, "w", encoding="utf-8") as f:
        f.write(js)
    print("生成", path, "%.1f KB" % (len(js) / 1024))


def git_push():
    try:
        subprocess.run(["git", "-C", ROOT, "add", "-A"], check=True)
        subprocess.run(["git", "-C", ROOT, "commit", "-m",
                        "chore: 自动更新数据 " + datetime.now().strftime("%Y-%m-%d")], check=True)
        subprocess.run(["git", "-C", ROOT, "push", "origin", "main"], check=True)
        print("已推送")
    except subprocess.CalledProcessError as e:
        print("git 推送失败：", e)


def append_series(existing_labels, existing_values, new_labels, new_values):
    """把晚于现有最后日期的新点追加进去（去重、按日期排序）"""
    last = existing_labels[-1] if existing_labels else ""
    merged = {}
    for d, v in zip(existing_labels, existing_values):
        if v is not None:
            merged[str(d)] = v
    for d, v in zip(new_labels, new_values):
        if v is not None and str(d) > last:
            merged[str(d)] = v
    labels = sorted(merged.keys())
    return labels, [merged[d] for d in labels]


# ---------- 金融数据（yfinance + akshare） ----------
# 短名 -> (source, code)。source: 'yf'=yfinance, 'ak_index'=akshare A股指数, 'ak_bond'=中国国债
FINANCE_MAP = {
    "沪深300": ("ak_index", "000300"),
    "中证500": ("ak_index", "000905"),
    "中证1000": ("ak_index", "000852"),
    "创业板指": ("ak_index", "399006"),
    "科创50": ("ak_index", "000688"),
    "日经225": ("yf", "^N225"),
    "韩国KOSPI": ("yf", "^KS11"),
    "德国DAX": ("yf", "^GDAXI"),
    "法国CAC40": ("yf", "^FCHI"),
    "英国富时100": ("yf", "^FTSE"),
    "纳斯达克": ("yf", "^IXIC"),
    "标普500": ("yf", "^GSPC"),
    "中国10年期国债": ("ak_bond", "10y"),
    "美国10年期国债": ("yf", "^TNX"),
    "COMEX黄金": ("yf", "GC=F"),
    "COMEX白银": ("yf", "SI=F"),
    "WTI原油": ("yf", "CL=F"),
    "布伦特原油": ("yf", "BZ=F"),
    "LME铜": ("yf", "HG=F"),
    "LME铝": ("yf", "ALI=F"),
    "LME锌": ("yf", "ZNC=F"),
    "美元指数": ("yf", "DX-Y.NYB"),
    "美元兑人民币(在岸)": ("yf", "CNY=X"),
    "纳斯达克100波动率": ("yf", "^VXN"),
    "标普500波动率(VIX)": ("yf", "^VIX"),
    "CBOE VIX": ("yf", "^VIX"),
}


def fetch_yf(code, days=30):
    import yfinance as yf
    for _ in range(3):  # 重试（yfinance 偶发限流）
        try:
            df = yf.download(code, period="%dd" % days, interval="1d", progress=False, auto_adjust=False)
            if df is not None and len(df):
                dates = [str(d)[:10] for d in df.index]
                closes = [float(v) for v in df["Close"]]
                return dates, closes
        except Exception:
            time.sleep(3)
    return [], []


def fetch_ak_index(code, days=30):
    end = datetime.now()
    start = end - timedelta(days=days)
    df = ak.index_zh_a_hist(symbol=code, period="daily",
                            start_date=start.strftime("%Y%m%d"), end_date=end.strftime("%Y%m%d"))
    dates = [str(d)[:10] for d in df["日期"]]
    closes = [float(v) for v in df["收盘"]]
    return dates, closes


def fetch_ak_bond_10y(days=90):
    df = ak.bond_china_yield()
    df = df[df["曲线名称"] == "中债国债收益率曲线"]
    dates = [str(d)[:10] for d in df["日期"]]
    vals = [float(v) for v in df["10年"]]
    return dates, vals


def update_finance():
    fin = read_js_var("finance-data.js", "FINANCE_DATA")
    if not fin:
        print("未找到 finance-data.js，跳过")
        return
    updated = 0
    for sec in fin["sections"]:
        for item in sec["items"]:
            name = item["title"]
            if name not in FINANCE_MAP:
                continue
            src, code = FINANCE_MAP[name]
            labels, values = item["labels"], item["series"][0]["values"]
            try:
                if src == "yf":
                    nl, nv = fetch_yf(code)
                elif src == "ak_index":
                    nl, nv = fetch_ak_index(code)
                elif src == "ak_bond":
                    nl, nv = fetch_ak_bond_10y()
                else:
                    continue
                if not nl:
                    continue
                new_labels, new_values = append_series(labels, values, nl, nv)
                if len(new_labels) > len(labels):
                    item["labels"] = new_labels
                    item["series"][0]["values"] = new_values
                    updated += 1
                    print("  ✓", name, "追加", len(new_labels) - len(labels), "点")
            except Exception as e:
                print("  ✗", name, "失败:", str(e)[:80])
    # 更新 updated 时间戳
    maxd = ""
    for sec in fin["sections"]:
        for it in sec["items"]:
            for d in it["labels"]:
                if d > maxd:
                    maxd = d
    fin["updated"] = maxd
    write_js_var("finance-data.js", "FINANCE_DATA", fin, "金融数据一览（自动更新）")
    print("金融数据更新完成：新增 %d 个指标，最新日期 %s" % (updated, maxd))


# ---------- 宏观数据（akshare） ----------
# 短名 -> akshare 函数 + 取数逻辑（返回 {日期: 值}）
def macro_fetch_series():
    out = {}
    # GDP 当季同比
    try:
        df = ak.macro_china_gdp()
        out["GDP 当季同比"] = {str(r["季度"]): float(r["国内生产总值-同比增长"]) for _, r in df.iterrows()}
    except Exception as e:
        print("  GDP 失败:", str(e)[:80])
    # CPI / PPI / PMI / M1 / M2 等可扩展
    return out


def update_macro():
    macro = read_js_var("china-macro.js", "CHINA_MACRO")
    if not macro:
        print("未找到 china-macro.js，跳过")
        return
    new_series = macro_fetch_series()
    updated = 0
    for sec in macro["sections"]:
        for item in sec["items"]:
            name = item["title"]
            if name not in new_series:
                continue
            series_map = new_series[name]  # {date: value}
            existing = dict(zip(item["labels"], item["series"][0]["values"]))
            last = item["labels"][-1] if item["labels"] else ""
            for d, v in series_map.items():
                if str(d) > last:
                    existing[str(d)] = v
            labels = sorted(existing.keys())
            item["labels"] = labels
            item["series"][0]["values"] = [existing[d] for d in labels]
            updated += 1
            print("  ✓", name, "已更新到", labels[-1] if labels else "-")
    maxd = ""
    for sec in macro["sections"]:
        for it in sec["items"]:
            for d in it["labels"]:
                if d > maxd:
                    maxd = d
    macro["updated"] = maxd
    write_js_var("china-macro.js", "CHINA_MACRO", macro, "中国宏观数据一览（自动更新）")
    print("宏观数据更新完成：更新 %d 个指标" % updated)


# ---------- 国际宏观数据（akshare） ----------
INTL_GROUPS = {
    "央行基准利率": [
        ("美国联邦基金利率", "macro_bank_usa_interest_rate"),
        ("欧元区央行利率", "macro_bank_euro_interest_rate"),
        ("日本央行利率", "macro_bank_japan_interest_rate"),
        ("英国央行利率", "macro_bank_english_interest_rate"),
        ("澳大利亚央行利率", "macro_bank_australia_interest_rate"),
        ("印度央行利率", "macro_bank_india_interest_rate"),
        ("巴西央行利率", "macro_bank_brazil_interest_rate"),
    ],
    "通胀 CPI": [
        ("美国CPI同比", "macro_usa_cpi_yoy"),
        ("欧元区CPI同比", "macro_euro_cpi_yoy"),
        ("日本CPI同比", "macro_japan_cpi_yearly"),
        ("英国CPI同比", "macro_uk_cpi_yearly"),
        ("德国CPI同比", "macro_germany_cpi_yearly"),
        ("澳大利亚CPI同比", "macro_australia_cpi_yearly"),
        ("加拿大CPI同比", "macro_canada_cpi_yearly"),
    ],
    "增长 GDP": [
        ("欧元区GDP同比", "macro_euro_gdp_yoy"),
        ("英国GDP同比", "macro_uk_gdp_yearly"),
        ("德国GDP同比", "macro_germany_gdp"),
        ("加拿大GDP", "macro_canada_gdp_monthly"),
        ("美国GDP", "macro_usa_gdp_monthly"),
    ],
    "PPI": [
        ("美国PPI", "macro_usa_ppi"),
        ("美国核心PPI", "macro_usa_core_ppi"),
        ("欧元区PPI环比", "macro_euro_ppi_mom"),
        ("澳大利亚PPI", "macro_australia_ppi_quarterly"),
    ],
    "景气 PMI": [
        ("美国ISM制造业PMI", "macro_usa_ism_pmi"),
        ("美国ISM非制造业PMI", "macro_usa_ism_non_pmi"),
        ("欧元区制造业PMI", "macro_euro_manufacturing_pmi"),
        ("欧元区服务业PMI", "macro_euro_services_pmi"),
    ],
    "就业": [
        ("美国失业率", "macro_usa_unemployment_rate"),
        ("美国非农就业", "macro_usa_non_farm"),
        ("欧元区失业率", "macro_euro_unemployment_rate_mom"),
        ("英国失业率", "macro_uk_unemployment_rate"),
        ("日本失业率", "macro_japan_unemployment_rate"),
        ("加拿大失业率", "macro_canada_unemployment_rate"),
        ("澳大利亚失业率", "macro_australia_unemployment_rate"),
    ],
    "货币供应": [
        ("中国M1同比", "china_m1"),
        ("中国M2同比", "china_m2"),
    ],
}


def _sorted_series(labels, values):
    pairs = sorted(zip(labels, values), key=lambda x: x[0])
    return [p[0] for p in pairs], [p[1] for p in pairs]


def fetch_china_money(col):
    df = ak.macro_china_money_supply()
    labels, values = [], []
    for _, r in df.iterrows():
        v = r[col]
        try:
            v = float(v)
        except (TypeError, ValueError):
            continue
        if v != v:
            continue
        labels.append(str(r["月份"]))
        values.append(v)
    return _sorted_series(labels, values)


def fetch_ak_macro(fn):
    if fn == "china_m1":
        return fetch_china_money("货币(M1)-同比增长")
    if fn == "china_m2":
        return fetch_china_money("货币和准货币(M2)-同比增长")
    try:
        df = getattr(ak, fn)()
    except Exception:
        return [], []
    if df is None or len(df) == 0:
        return [], []
    cols = list(df.columns)
    date_col = next((c for c in ["日期", "时间", "发布日期"] if c in cols), None)
    val_col = next((c for c in ["今值", "现值"] if c in cols), None)
    if not date_col or not val_col:
        return [], []
    labels, values = [], []
    for _, r in df.iterrows():
        v = r[val_col]
        try:
            v = float(v)
        except (TypeError, ValueError):
            continue
        if v != v:
            continue
        labels.append(str(r[date_col]))
        values.append(v)
    return _sorted_series(labels, values)


def update_intl():
    print("抓取国际宏观数据 (akshare) ...")
    sections = []
    for cat, items in INTL_GROUPS.items():
        out = []
        for title, fn in items:
            try:
                labels, values = fetch_ak_macro(fn)
            except Exception as e:
                print("  ✗", title, str(e)[:60])
                continue
            if len(labels) < 2:
                print("  - 跳过", title)
                continue
            out.append({"title": title, "unit": "%", "type": "line",
                        "labels": labels, "series": [{"name": title, "values": values}]})
            print("  ✓", title, len(labels), "期")
        sections.append({"name": cat, "items": out})
    maxd = datetime.now().strftime("%Y-%m-%d")
    obj = {"updated": maxd, "sections": sections}
    write_js_var("intl-macro.js", "INTL_MACRO", obj, "国际宏观数据（akshare 自动更新）")
    total = sum(len(s["items"]) for s in sections)
    print("国际宏观数据更新完成：%d 项" % total)


def main():
    args = set(sys.argv[1:])
    no_push = "--no-push" in args
    any_specific = any(a in args for a in ("--finance", "--macro", "--intl"))
    do_fin = "--finance" in args or not any_specific
    do_macro = "--macro" in args or not any_specific
    do_intl = "--intl" in args or not any_specific

    if do_fin:
        update_finance()
    if do_macro:
        update_macro()
    if do_intl:
        update_intl()
    if not no_push:
        git_push()


if __name__ == "__main__":
    main()
