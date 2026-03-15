#!/usr/bin/env bash

# ============================================================
# Speech Arena - 全セッション停止スクリプト
# ============================================================

echo "=== Speech Arena 停止 ==="

for session in tunnel-b tunnel-a moshi-b moshi-a; do
  if tmux has-session -t "$session" 2>/dev/null; then
    tmux kill-session -t "$session"
    echo "  停止: $session"
  fi
done

echo "完了"
