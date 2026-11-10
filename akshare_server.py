# -*- coding: utf-8 -*-
"""
ADV 本地数据服务示例（akshare）

这是一个把 akshare 数据暴露成 JSON 接口、供 ADV 网页「真实数据 → 自定义 API」调用的示例。

安装与启动：
    1) pip install akshare
    2) python akshare_server.py
    3) 服务监听 http://127.0.0.1:8765

在 ADV 里使用：
    打开「🌐 真实数据」→ 在「自定义 API」里填：
        http://127.0.0.1:8765/ak?func=stock_zh_a_hist&symbol=000001&period=daily
    点「加载」即可出图。

⚠️ 关于「其他用户用网页版能否使用」：
    这个服务跑在你自己的电脑上（127.0.0.1），只有你自己能访问。
    其他用户打开你部署的 ADV 网页（如 https://saviorbill.github.io/adv/）时，
    浏览器无法访问你本机的 127.0.0.1，所以他们也用不了这个本地服务。
    要让所有人能用，需要把这个服务部署到一台公网服务器（并加 CORS），
    或者干脆直接用 FRED 这类公网 API（ADV 已内置 FRED 支持）。
"""
import json
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

import akshare as ak

HOST, PORT = "127.0.0.1", 8765


def df_to_table(df, x_col, y_cols):
    """把 DataFrame 转成 ADV 可识别的 {columns, rows}，空值转 None"""
    columns = [x_col] + y_cols
    rows = []
    for _, r in df.iterrows():
        row = {x_col: str(r[x_col])}
        for c in y_cols:
            v = r[c]
            # 空值/NaN -> None（ADV 会跳过，不显示为 0）
            if v is None or (isinstance(v, float) and v != v):
                row[c] = None
            else:
                row[c] = float(v)
        rows.append(row)
    return {"columns": columns, "rows": rows}


# 常用 akshare 数据源映射（可按需扩展）
def fetch_data(func, params):
    if func == "stock_zh_a_hist":
        # A股历史行情：func=stock_zh_a_hist&symbol=000001&period=daily
        df = ak.stock_zh_a_hist(
            symbol=params.get("symbol", ["000001"])[0],
            period=params.get("period", ["daily"])[0],
            adjust="qfq",
        )
        # 用日期做 X，收盘价做 Y
        return df_to_table(df, "日期", ["收盘"])

    if func == "macro_china_gdp":
        # 中国 GDP：func=macro_china_gdp
        df = ak.macro_china_gdp()
        return df_to_table(df, "季度", ["国内生产总值-绝对值", "国内生产总值-同比增长"])

    if func == "macro_china_cpi":
        # 中国 CPI：func=macro_china_cpi
        df = ak.macro_china_cpi()
        return df_to_table(df, "日期", ["今值"])

    if func == "index_global":
        # 全球指数实时行情（示例，非时间序列，ADV 会按柱状图渲染）
        df = ak.stock_zh_index_spot_em()
        return df_to_table(df, "名称", ["最新价", "涨跌幅"])

    raise ValueError("未知 func: %s" % func)


class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed = urlparse(self.path)
        qs = parse_qs(parsed.query)
        try:
            if parsed.path == "/health":
                data = {"ok": True, "service": "akshare-bridge"}
            elif parsed.path == "/ak":
                func = qs.get("func", [""])[0]
                data = fetch_data(func, qs)
            else:
                data = {"error": "未知路径 %s，可用 /health 或 /ak?func=..." % parsed.path}
            body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        except Exception as e:  # noqa
            body = json.dumps({"error": str(e)}, ensure_ascii=False).encode("utf-8")

        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")  # CORS，供网页跨域调用
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass  # 关闭日志噪音


if __name__ == "__main__":
    print("akshare-bridge 已启动：http://%s:%s" % (HOST, PORT))
    print("示例：http://%s:%s/ak?func=stock_zh_a_hist&symbol=000001&period=daily" % (HOST, PORT))
    HTTPServer((HOST, PORT), Handler).serve_forever()
