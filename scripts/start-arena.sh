#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# Speech Arena - Moshi サーバー & Cloudflare Tunnel 起動スクリプト
# 使い方: ./scripts/start-arena.sh
# 停止:   ./scripts/stop-arena.sh
# ============================================================

# --- 設定 ---------------------------------------------------
MODEL_A_NAME="llm-jp-moshi-v1"
MODEL_A_REPO="abePclWaseda/llm-jp-moshi-v1"
MODEL_A_GPU=0
MODEL_A_PORT=8998

MODEL_B_NAME="llm-jp-moshi-v1.1-vb-pseudo"
MODEL_B_REPO="abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo"
MODEL_B_GPU=1
MODEL_B_PORT=8999

MOSHI_STATIC="$SCRIPT_DIR/../client/dist"
TUNNEL_LOG_DIR="/tmp/speech-arena-tunnels"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
WEB_DIR="$SCRIPT_DIR/../apps/web"
# ------------------------------------------------------------

mkdir -p "$TUNNEL_LOG_DIR"

echo "=== Speech Arena 起動 ==="

# --- Moshi サーバー起動 ---
echo "[1/4] Moshi サーバー A ($MODEL_A_NAME) を GPU $MODEL_A_GPU で起動中..."
tmux new-session -d -s moshi-a \
  "CUDA_VISIBLE_DEVICES=$MODEL_A_GPU uv run -m moshi.server \
    --hf-repo $MODEL_A_REPO \
    --port $MODEL_A_PORT \
    --static $MOSHI_STATIC 2>&1 | tee /tmp/speech-arena-moshi-a.log"

echo "[2/4] Moshi サーバー B ($MODEL_B_NAME) を GPU $MODEL_B_GPU で起動中..."
tmux new-session -d -s moshi-b \
  "CUDA_VISIBLE_DEVICES=$MODEL_B_GPU uv run -m moshi.server \
    --hf-repo $MODEL_B_REPO \
    --port $MODEL_B_PORT \
    --static $MOSHI_STATIC 2>&1 | tee /tmp/speech-arena-moshi-b.log"

# Moshi サーバーの起動を待つ
echo "    Moshi サーバーの起動を待っています..."
sleep 10

# --- Cloudflare Tunnel 起動 ---
echo "[3/4] Cloudflare Tunnel A (port $MODEL_A_PORT) を起動中..."
tmux new-session -d -s tunnel-a \
  "cloudflared tunnel --url http://localhost:$MODEL_A_PORT 2>&1 | tee $TUNNEL_LOG_DIR/tunnel-a.log"

echo "[4/4] Cloudflare Tunnel B (port $MODEL_B_PORT) を起動中..."
tmux new-session -d -s tunnel-b \
  "cloudflared tunnel --url http://localhost:$MODEL_B_PORT 2>&1 | tee $TUNNEL_LOG_DIR/tunnel-b.log"

# Tunnel URL の取得を待つ
echo "    Tunnel URL の取得を待っています..."
TUNNEL_A_URL=""
TUNNEL_B_URL=""
for i in $(seq 1 30); do
  if [ -z "$TUNNEL_A_URL" ]; then
    TUNNEL_A_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG_DIR/tunnel-a.log" 2>/dev/null | head -1 || true)
  fi
  if [ -z "$TUNNEL_B_URL" ]; then
    TUNNEL_B_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG_DIR/tunnel-b.log" 2>/dev/null | head -1 || true)
  fi
  if [ -n "$TUNNEL_A_URL" ] && [ -n "$TUNNEL_B_URL" ]; then
    break
  fi
  sleep 1
done

echo ""
echo "=== 起動結果 ==="

if [ -z "$TUNNEL_A_URL" ] || [ -z "$TUNNEL_B_URL" ]; then
  echo "WARNING: Tunnel URL の取得に失敗しました。手動で確認してください:"
  echo "  tmux attach -t tunnel-a"
  echo "  tmux attach -t tunnel-b"
  exit 1
fi

echo "Model A ($MODEL_A_NAME): $TUNNEL_A_URL"
echo "Model B ($MODEL_B_NAME): $TUNNEL_B_URL"
echo ""

# --- DB seed 更新 ---
echo "=== DB にモデル情報を登録中 ==="
cd "$WEB_DIR"
MODEL_A_URL="$TUNNEL_A_URL" MODEL_B_URL="$TUNNEL_B_URL" npx tsx prisma/seed.ts
echo ""

# tmux セッション一覧
echo "=== tmux セッション ==="
tmux ls
echo ""
echo "セッションに接続: tmux attach -t <セッション名>"
echo "停止: ./scripts/stop-arena.sh"
