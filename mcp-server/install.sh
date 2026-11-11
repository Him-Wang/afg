#!/usr/bin/env bash
# ADV MCP 一键安装：把 MCP 服务装到 ~/.adv，并打印可直接粘贴的客户端配置
# 用法：
#   bash install.sh            # 安装 + 打印配置
#   bash install.sh --json     # 只打印 JSON 配置（给 agent 解析）
set -euo pipefail

REPO="${ADV_REPO:-https://github.com/saviorbill/adv.git}"
DEST="${ADV_HOME:-$HOME/.adv}"
MODE="${1:-}"

log() { [ "$MODE" = "--json" ] || echo "$@"; }

log "▶ 安装 ADV 图表 MCP 服务"
log "  目标目录：$DEST"

if ! command -v node >/dev/null 2>&1; then
  echo "✗ 未检测到 Node.js。请先安装 LTS 版：https://nodejs.org/" >&2
  exit 1
fi
NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo "✗ Node.js 版本过低（当前 $(node -v)），需要 18 或更高。" >&2
  exit 1
fi

if command -v git >/dev/null 2>&1; then
  if [ -d "$DEST/.git" ]; then
    log "  · 已存在，拉取最新代码…"
    git -C "$DEST" pull --ff-only --quiet || true
  else
    log "  · 克隆仓库…"
    ok=0
    for i in 1 2 3; do
      if git clone --depth 1 --quiet "$REPO" "$DEST" 2>/dev/null; then ok=1; break; fi
      log "    网络不稳定，重试 $i/3…"
      rm -rf "$DEST"; sleep 2
    done
    if [ "$ok" != "1" ]; then
      log "  · git 克隆失败，改用 zip 下载…"
      TMP=$(mktemp -d)
      curl -fsSL --retry 3 "https://github.com/saviorbill/adv/archive/refs/heads/main.zip" -o "$TMP/adv.zip" || {
        echo "✗ 下载失败：请检查网络，或手动下载 $REPO 后运行 npm install" >&2; exit 1; }
      (cd "$TMP" && unzip -q adv.zip)
      rm -rf "$DEST"; mv "$TMP"/adv-main "$DEST"; rm -rf "$TMP"
    fi
  fi
else
  log "  · 未安装 git，改用 zip 下载…"
  TMP=$(mktemp -d)
  curl -fsSL "https://github.com/saviorbill/adv/archive/refs/heads/main.zip" -o "$TMP/adv.zip"
  (cd "$TMP" && unzip -q adv.zip)
  rm -rf "$DEST"
  mv "$TMP"/adv-main "$DEST"
  rm -rf "$TMP"
fi

log "  · 安装依赖（首次约 10 秒）…"
(cd "$DEST/mcp-server" && npm install --silent --no-fund --no-audit >/dev/null 2>&1) || {
  echo "✗ npm install 失败，请手动执行：cd \"$DEST/mcp-server\" && npm install" >&2
  exit 1
}

SERVER="$DEST/mcp-server/server.js"
if [ ! -f "$SERVER" ]; then echo "✗ 找不到 $SERVER" >&2; exit 1; fi

log "  · 自检（启动 server，1 秒后关闭）…"
( node "$SERVER" & PID=$!; sleep 1; kill $PID 2>/dev/null || true ) >/dev/null 2>&1 || true

cat <<JSON
{
  "mcpServers": {
    "adv-charts": {
      "command": "node",
      "args": ["$SERVER"]
    }
  }
}
JSON

if [ "$MODE" != "--json" ]; then
  cat <<EOF

▶ 安装完成。使用方法：
  1. 把上面这段 JSON 合并进你的 MCP 客户端配置
     · Cursor：项目根目录 .cursor/mcp.json 或 设置 → MCP
     · Claude Code：claude mcp add-json adv-charts '<上面的 JSON>'
     · 其他客户端：找 mcpServers 配置项粘贴进去
  2. 重启客户端（或重新连接 MCP）
  3. 对话里说「用 ADV 画一张近 5 年沪深300和中证500对比折线图」即可

  更新：bash "$DEST/mcp-server/install.sh"
  卸载：rm -rf "$DEST"
EOF
fi
