#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# SpeechArena GPU インスタンスを停止（ウォームプール保持）
# 使い方: ./scripts/stop-gpu.sh
# ============================================================

REGION="us-east-1"

echo "=== SpeechArena GPU 停止 ==="

INSTANCES=$(aws ec2 describe-instances --region $REGION \
  --filters "Name=tag:Project,Values=speech-arena" "Name=instance-state-name,Values=running" \
  --query 'Reservations[*].Instances[*].InstanceId' --output text)

if [ -z "$INSTANCES" ]; then
  echo "実行中のインスタンスはありません"
  exit 0
fi

for id in $INSTANCES; do
  echo "  Stopping: $id"
  aws ec2 stop-instances --region $REGION --instance-ids $id > /dev/null
done

echo "完了（インスタンスは stopped 状態で保持されます）"
echo "EBS 代のみ課金（~\$16/月）"
