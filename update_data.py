#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AFG 数据自动更新脚本
从「萝卜投研 Pro」(Datayes) 抓取监控数据 → 生成 JS 数据文件 → 提交推送

用法：
    python3 update_data.py              # 抓取金融+宏观，生成 JS 并推送
    python3 update_data.py --no-push    # 只生成 JS，不推送
    python3 update_data.py --finance    # 只更新金融数据
    python3 update_data.py --macro      # 只更新宏观数据

前置（一次性）：
    1. 浏览器登录 r.datayes.com
    2. 打开 DevTools → Network → 任意 gw.datayes.com 请求 → Request Headers → Cookie
       把整个 Cookie 值复制到 ~/.afg/datayes_cookie.txt（一行）

定时（周更新金融 / 月更新宏观，示例）：
    # 每周一 08:30 更新金融
    30 8 * * 1  cd /path/to/financial-charts && python3 update_data.py --finance >> /tmp/afg-update.log 2>&1
    # 每月 1 号 08:30 更新宏观
    30 8 1 * *  cd /path/to/financial-charts && python3 update_data.py --macro >> /tmp/afg-update.log 2>&1

说明：
    Cookie 有有效期（通常数小时~数天），过期后需重新复制到 ~/.afg/datayes_cookie.txt。
    脚本运行后若生成过程中下载了临时文件，会自动清理（不残留 Excel/JSON 中间文件）。
"""
import json
import os
import subprocess
import sys
import urllib.request
from datetime import datetime

SLOT_FINANCE = "468498"   # 金融数据（周更新）
SLOT_MACRO = "468495"     # 宏观数据（月更新）

API_META = "https://gw.datayes.com/aladdin_monitor/web/monitor/data/slot/{slot}"
API_DATA = "https://gw.datayes.com/aladdin_adventure/web/supervisorCenter/slot/indics?isDefaultTimeSlot=false"

COOKIE_FILE = os.path.expanduser("~/.afg/datayes_cookie.txt")
ROOT = os.path.dirname(os.path.abspath(__file__))


def load_cookie():
    if os.path.exists(COOKIE_FILE):
        return open(COOKIE_FILE, encoding="utf-8").read().strip()
    return ""


def http_json(url, method="GET", body=None, cookie=""):
    req = urllib.request.Request(url, method=method)
    req.add_header("Content-Type", "application/json")
    req.add_header("Accept", "application/json")
    req.add_header("Referer", "https://r.datayes.com/")
    if cookie:
        req.add_header("Cookie", cookie)
    data = json.dumps(body).encode("utf-8") if body is not None else None
    with urllib.request.urlopen(req, data=data) as r:
        return json.loads(r.read().decode("utf-8"))


def fetch_series(slot, cookie):
    """返回 {指标原名: {labels:[...], values:[...]}}"""
    meta = http_json(API_META.format(slot=slot), cookie=cookie)
    indicators = meta["data"]["indicators"]  # [{indicatorId, alias, ...}]
    ids = [i["indicatorId"] for i in indicators]
    resp = http_json(API_DATA, method="POST", body=ids, cookie=cookie)
    result = {}
    for ind in indicators:
        iid = ind["indicatorId"]
        name = ind.get("alias") or ""
        node = (resp.get("data") or {}).get(iid)
        if not node or not isinstance(node.get("data"), list):
            continue
        labels, values = [], []
        for p in node["data"]:
            v = p.get("dataValue")
            if v is None:
                continue
            try:
                v = float(v)
            except (TypeError, ValueError):
                continue
            labels.append(str(p.get("periodDate", "")))
            values.append(v)
        if labels:
            result[name] = {"labels": labels, "values": values}
    return result


# ---- 金融数据分组（指标原名 -> 短名/单位/类型） ----
FINANCE_GROUPS = {
    "股票": [
        ("收盘价:沪深300指数", "沪深300", "点", "perf"),
        ("收盘价:中证小盘500指数", "中证500", "点", "perf"),
        ("收盘价:中证1000", "中证1000", "点", "perf"),
        ("收盘价:创业板指数P", "创业板指", "点", "perf"),
        ("收盘价:科创50", "科创50", "点", "perf"),
        ("收盘价:日经225指数", "日经225", "点", "perf"),
        ("收盘价:韩国KOSPI指数", "韩国KOSPI", "点", "perf"),
        ("收盘价:德国法兰克福DAX指数", "德国DAX", "点", "perf"),
        ("法国CAC40:今收盘指数", "法国CAC40", "点", "perf"),
        ("富时100:昨收盘指数", "英国富时100", "点", "perf"),
        ("收盘价:美国纳斯达克综合指数", "纳斯达克", "点", "perf"),
        ("收盘价:标准普尔500指数", "标普500", "点", "perf"),
    ],
    "债券": [
        ("国债到期收益率:10年", "中国10年期国债", "%", "line"),
        ("美国:长期国债收益率:10年", "美国10年期国债", "%", "line"),
        ("日本:国债收益率:10年", "日本10年期国债", "%", "line"),
        ("韩国:国债收益率:10年", "韩国10年期国债", "%", "line"),
        ("德国:国债收益率:10年", "德国10年期国债", "%", "line"),
        ("法国:国债收益率:10年", "法国10年期国债", "%", "line"),
        ("英国:国债收益率:10年", "英国10年期国债", "%", "line"),
    ],
    "商品": [
        ("COMEX:期货结算价(活跃):黄金", "COMEX黄金", "美元/盎司", "perf"),
        ("COMEX:期货结算价(活跃):白银", "COMEX白银", "美元/盎司", "perf"),
        ("期货结算价:WTI原油", "WTI原油", "美元/桶", "perf"),
        ("期货结算价:布伦特原油", "布伦特原油", "美元/桶", "perf"),
        ("LME:现货官方报价:铜", "LME铜", "美元/吨", "perf"),
        ("LME:现货官方报价:铝", "LME铝", "美元/吨", "perf"),
        ("LME:现货官方报价:锌", "LME锌", "美元/吨", "perf"),
    ],
    "外汇": [
        ("美元指数", "美元指数", "点", "perf"),
        ("人民币即期汇率(16:00):在岸价", "美元兑人民币(在岸)", "", "perf"),
    ],
    "VIX": [
        ("美国:纳斯达克100波动率指数", "纳斯达克100波动率", "%", "line"),
        ("美国:标准普尔500波动率指数", "标普500波动率(VIX)", "%", "line"),
        ("CBOE:认沽/认购比率:波动率指数(VIX)", "CBOE VIX", "", "line"),
    ],
}


def gen_finance(series):
    sections = []
    for cat, items in FINANCE_GROUPS.items():
        out = []
        for name, short, unit, typ in items:
            if name not in series:
                continue
            s = series[name]
            out.append({"title": short, "unit": unit, "type": typ,
                        "labels": s["labels"], "series": [{"name": short, "values": s["values"]}]})
        sections.append({"name": cat, "items": out})
    max_date = ""
    for sec in sections:
        for it in sec["items"]:
            for d in it["labels"]:
                if d > max_date:
                    max_date = d
    return {"updated": max_date, "sections": sections}


def write_js(filename, var, obj, note):
    js = "/* %s */\nwindow.%s = %s;\n" % (note, var, json.dumps(obj, ensure_ascii=False))
    path = os.path.join(ROOT, "js", filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(js)
    print("生成", path, "%.1f KB" % (len(js) / 1024))


def git_push():
    try:
        subprocess.run(["git", "-C", ROOT, "add", "-A"], check=True)
        subprocess.run(["git", "-C", ROOT, "commit", "-m",
                        "chore: 自动更新数据 " + datetime.now().strftime("%Y-%m-%d")], check=True)
        subprocess.run(["git", "-C", ROOT, "push", "origin", "main"], check=True)
        print("已推送到 GitHub")
    except subprocess.CalledProcessError as e:
        print("git 推送失败：", e)


def main():
    args = set(sys.argv[1:])
    no_push = "--no-push" in args
    do_fin = "--finance" in args or ("--macro" not in args)
    do_macro = "--macro" in args or ("--finance" not in args)

    cookie = load_cookie()
    if not cookie:
        print("未找到 Cookie：请把 gw.datayes.com 的 Cookie 存到", COOKIE_FILE)
        sys.exit(1)

    if do_fin:
        print("抓取金融数据 (slot %s) ..." % SLOT_FINANCE)
        series = fetch_series(SLOT_FINANCE, cookie)
        fin = gen_finance(series)
        write_js("finance-data.js", "FINANCE_DATA", fin,
                 "金融数据一览（自动更新于 %s）" % datetime.now().strftime("%Y-%m-%d %H:%M"))

    if do_macro:
        print("抓取宏观数据 (slot %s) ..." % SLOT_MACRO)
        # 宏观分组（含两个计算指标：PPI剪刀差、M1-M2剪刀差）
        series = fetch_series(SLOT_MACRO, cookie)
        macro = gen_macro(series)
        write_js("china-macro.js", "CHINA_MACRO", macro,
                 "中国宏观数据一览（自动更新于 %s）" % datetime.now().strftime("%Y-%m-%d %H:%M"))

    if not no_push:
        git_push()


def gen_macro(series):
    def single(name, title, unit, typ="line"):
        s = series.get(name)
        if not s:
            return None
        return {"title": title, "unit": unit, "type": typ,
                "labels": s["labels"], "series": [{"name": title, "values": s["values"]}]}

    def diff(a, b, title, unit):
        sa, sb = series.get(a), series.get(b)
        if not sa or not sb:
            return None
        m = dict(zip(sb["labels"], sb["values"]))
        labels, values = [], []
        for i, d in enumerate(sa["labels"]):
            if d in m:
                labels.append(d)
                values.append(sa["values"][i] - m[d])
        return {"title": title, "unit": unit, "type": "line",
                "labels": labels, "series": [{"name": title, "values": values}]}

    def multi(pairs, title, unit, typ="line"):
        # pairs: [(原名, 短名), ...] 对齐到并集日期
        all_dates = set()
        maps = {}
        for name, short in pairs:
            s = series.get(name)
            if not s:
                continue
            maps[short] = dict(zip(s["labels"], s["values"]))
            all_dates.update(s["labels"])
        dates = sorted(all_dates)
        out = []
        for short in maps:
            out.append({"name": short, "values": [maps[short].get(d) for d in dates]})
        return {"title": title, "unit": unit, "type": typ, "labels": dates, "series": out}

    sections = [
        {"name": "经济活动", "items": [
            single("GDP:不变价:当季同比", "GDP 当季同比", "%"),
            single("制造业PMI", "制造业 PMI", "%"),
            single("非制造业PMI:服务业", "服务业 PMI", "%"),
            single("工业增加值:当月同比", "规模以上工业增加值", "%"),
            single("固定资产投资完成额:当月同比", "固定资产投资", "%"),
            single("社会消费品零售总额:当月同比", "社会消费品零售总额", "%"),
            single("出口金额(美元):当月同比", "出口（美元计）", "%"),
            single("进口金额(美元):当月同比", "进口（美元计）", "%"),
            single("贸易差额(美元):当月值", "贸易差额（美元计）", "百万美元", "area"),
        ]},
        {"name": "通胀", "items": [
            single("PPI:全部工业品:当月同比", "PPI（出厂）", "%"),
            single("PPIRM:当月同比", "PPIRM（购进）", "%"),
            diff("PPI:全部工业品:当月同比", "PPIRM:当月同比", "PPI 剪刀差（出厂-购进）", "%"),
            single("CPI:当月同比", "CPI 整体", "%"),
            single("CPI:不包括食品和能源(核心CPI):当月同比", "核心 CPI", "%"),
        ]},
        {"name": "货币", "items": [
            single("金融机构:新增人民币贷款:当月值", "新增人民币贷款", "亿元", "bar"),
            single("金融机构:人民币:各项贷款余额:同比", "人民币贷款余额同比", "%"),
            multi([("社会融资规模增量:人民币贷款:当月值", "人民币贷款"),
                   ("社会融资规模增量:企业债券融资:当月值", "企业债券"),
                   ("社会融资规模增量:政府债券:当月值", "政府债券")],
                  "社融结构（人民币贷款/企业债/政府债）", "亿元", "stacked"),
            single("货币供应量:M1:同比", "M1 同比", "%"),
            single("货币供应量:M2:同比", "M2 同比", "%"),
            diff("货币供应量:M1:同比", "货币供应量:M2:同比", "M1-M2 剪刀差", "%"),
        ]},
        {"name": "利率", "items": [
            single("SHIBOR:隔夜", "SHIBOR 隔夜", "%"),
            single("贷款市场报价利率(LPR):1年", "LPR 1年", "%"),
            single("贷款市场报价利率(LPR):5年", "LPR 5年", "%"),
            multi([("存款准备金率:大型金融机构", "准备金率·大型"),
                   ("存款准备金率:中小型金融机构", "准备金率·中小型")],
                  "存款准备金率（大型 & 中小型）", "%"),
        ]},
    ]
    for sec in sections:
        sec["items"] = [it for it in sec["items"] if it]
    max_date = ""
    for sec in sections:
        for it in sec["items"]:
            for d in it["labels"]:
                if d > max_date:
                    max_date = d
    return {"updated": max_date, "sections": sections}


if __name__ == "__main__":
    main()
