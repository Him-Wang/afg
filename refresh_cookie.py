#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AFG Cookie 自动刷新：用浏览器（Kimi WebBridge）从 r.datayes.com 提取最新登录 Cookie

原理：
    你的浏览器（Chrome）保持登录 r.datayes.com，会话 Cookie 会一直有效。
    本脚本调用 WebBridge 打开该页面、抓取 gw.datayes.com 请求头里的 Cookie，
    存到 ~/.afg/datayes_cookie.txt，供 update_data.py 使用。

前置：
    1. Chrome 安装 Kimi WebBridge 扩展并已连接（127.0.0.1:10086）
    2. 浏览器已登录 r.datayes.com

用法：
    python3 refresh_cookie.py
    # 可与 update_data.py 串联：
    #   python3 refresh_cookie.py && python3 update_data.py --finance
"""
import json
import os
import sys
import time
import urllib.request

DAEMON = "http://127.0.0.1:10086"
COOKIE_FILE = os.path.expanduser("~/.afg/datayes_cookie.txt")
PAGE = "https://r.datayes.com/data/monitor_detail/myself?slotId=468498"


def call(action, args=None, session="datayes-cookie"):
    body = {"action": action, "args": args or {}, "session": session}
    req = urllib.request.Request(
        DAEMON + "/command",
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def main():
    print("1/4 打开 r.datayes.com（复用已登录标签）...")
    call("navigate", {"url": PAGE, "newTab": True})

    print("2/4 开始抓取网络请求...")
    call("network", {"cmd": "start"})
    # 重新导航触发 API 请求
    call("navigate", {"url": PAGE, "newTab": False})
    time.sleep(8)

    print("3/4 查找 gw.datayes.com 请求头中的 Cookie...")
    lst = call("network", {"cmd": "list"})
    reqs = (lst.get("data") or {}).get("requests", [])
    cookie = None
    for r in reqs:
        if "gw.datayes.com" in r.get("url", ""):
            rid = r.get("requestId")
            detail = call("network", {"cmd": "detail", "requestId": rid})
            hdrs = (detail.get("data") or {}).get("requestHeaders", {})
            c = hdrs.get("cookie", "")
            if "cloud-sso-token" in c:
                cookie = c
                break
    if not cookie:
        print("未抓到 Cookie：请确认浏览器已登录 r.datayes.com，且 WebBridge 扩展已连接")
        sys.exit(1)

    print("4/4 保存 Cookie 到", COOKIE_FILE)
    os.makedirs(os.path.dirname(COOKIE_FILE), exist_ok=True)
    with open(COOKIE_FILE, "w", encoding="utf-8") as f:
        f.write(cookie)
    print("✅ Cookie 已刷新（长度 %d）" % len(cookie))


if __name__ == "__main__":
    main()
