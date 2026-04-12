#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# SpeechArena GPU インスタンスを起動し、2モデルをロード
# 使い方: ./scripts/start-gpu.sh [MODEL_A] [MODEL_B]
# ============================================================

REGION="us-east-1"
source scripts/.env 2>/dev/null || true
HF_TOKEN="${HF_TOKEN:-}"
ECR_REPO="518024472814.dkr.ecr.${REGION}.amazonaws.com/speech-arena/moshi-server"

# モデルはランダムまたは引数指定
MODELS=(
  "abePclWaseda/llm-jp-moshi-v1"
  "abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo"
  "abePclWaseda/llm-jp-moshi-v1.1-all-mixed"
  "abePclWaseda/llm-jp-moshi-v1.1-all-staged"
  "abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo-staged"
  "abePclWaseda/llm-jp-moshi-v1.2"
)

MODEL_A="${1:-${MODELS[$RANDOM % ${#MODELS[@]}]}}"
MODEL_B="${2:-${MODELS[$RANDOM % ${#MODELS[@]}]}}"
while [ "$MODEL_A" = "$MODEL_B" ]; do
  MODEL_B="${MODELS[$RANDOM % ${#MODELS[@]}]}"
done

echo "=== SpeechArena GPU 起動 ==="
echo "Model A: $MODEL_A"
echo "Model B: $MODEL_B"

# stopped の g6e.xlarge を探す
INSTANCE_ID=$(aws ec2 describe-instances --region $REGION \
  --filters "Name=tag:Project,Values=speech-arena" "Name=instance-state-name,Values=stopped" \
  --query 'Reservations[*].Instances[?InstanceType==`g6e.xlarge`].InstanceId | [0][0]' --output text 2>/dev/null)

if [ -n "$INSTANCE_ID" ] && [ "$INSTANCE_ID" != "None" ]; then
  echo "ウォームスタート: $INSTANCE_ID"
  aws ec2 start-instances --region $REGION --instance-ids $INSTANCE_ID > /dev/null
  aws ec2 wait instance-running --region $REGION --instance-ids $INSTANCE_ID
else
  echo "コールドスタート: 新規インスタンスを起動"
  # AMI
  AMI_ID=$(aws ec2 describe-images --region $REGION --owners amazon \
    --filters "Name=name,Values=Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 22.04) *" "Name=architecture,Values=x86_64" \
    --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text)
  # SG
  SG_ID=$(aws ec2 describe-security-groups --region $REGION \
    --filters "Name=group-name,Values=speech-arena-gpu-us-east-1" \
    --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")
  if [ -z "$SG_ID" ] || [ "$SG_ID" = "None" ]; then
    echo "ERROR: セキュリティグループが見つかりません"
    exit 1
  fi
  # Subnet
  SUBNET_ID=$(aws ec2 describe-subnets --region $REGION \
    --filters "Name=availability-zone,Values=us-east-1d" \
    --query 'Subnets[0].SubnetId' --output text)

  INSTANCE_ID=$(aws ec2 run-instances --region $REGION \
    --image-id $AMI_ID --instance-type g6e.xlarge --count 1 \
    --subnet-id $SUBNET_ID --security-group-ids $SG_ID \
    --key-name speech-arena-gpu \
    --iam-instance-profile Name=speech-arena-gpu-instance \
    --block-device-mappings '[{"DeviceName":"/dev/sda1","Ebs":{"VolumeSize":200,"VolumeType":"gp3"}}]' \
    --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=speech-arena-gpu},{Key=Project,Value=speech-arena}]" \
    --query 'Instances[0].InstanceId' --output text)

  echo "Instance: $INSTANCE_ID"
  aws ec2 wait instance-running --region $REGION --instance-ids $INSTANCE_ID
fi

PUBLIC_IP=$(aws ec2 describe-instances --region $REGION --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "IP: $PUBLIC_IP"

echo "=== Docker セットアップ ==="
# SSH が使えるまで待つ
for i in $(seq 1 30); do
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP "echo ok" 2>/dev/null && break
  sleep 5
done

ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP bash -s <<SETUP
set -euxo pipefail

# nvidia-container-toolkit
if ! command -v nvidia-container-runtime &> /dev/null; then
  curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
  curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
  apt-get update && apt-get install -y nvidia-container-toolkit
  nvidia-ctk runtime configure --runtime=docker
  systemctl restart docker
fi

# HF キャッシュディレクトリ
sudo mkdir -p /opt/hf_cache
sudo chown ubuntu:ubuntu /opt/hf_cache

# ECR ログイン
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_REPO
docker pull $ECR_REPO:latest

# 既存コンテナを全て停止
docker rm -f moshi-server moshi-server-a moshi-server-b 2>/dev/null || true

# Model A (ポート 8998) — 先に起動して完了を待つ
echo "Starting Model A: $MODEL_A"
docker run -d --gpus all --name moshi-server-a --restart always \
  -p 8998:8998 \
  -e HF_TOKEN=$HF_TOKEN -e HUGGING_FACE_HUB_TOKEN=$HF_TOKEN \
  -e HF_HOME=/hf_cache -v /opt/hf_cache:/hf_cache \
  -e HF_HUB_ENABLE_HF_TRANSFER=0 \
  $ECR_REPO:latest \
  uv run -m moshi.server --hf-repo $MODEL_A --port 8998 --host 0.0.0.0 --static /app/static

echo "  Model A のロード完了を待っています..."
for i in \$(seq 1 180); do
  if curl -s -o /dev/null http://localhost:8998 2>/dev/null; then
    echo "  Model A Ready (\${i}0秒)"
    break
  fi
  sleep 5
done

# Model B (ポート 8999) — Model A の後に起動
echo "Starting Model B: $MODEL_B"
docker run -d --gpus all --name moshi-server-b --restart always \
  -p 8999:8999 \
  -e HF_TOKEN=$HF_TOKEN -e HUGGING_FACE_HUB_TOKEN=$HF_TOKEN \
  -e HF_HOME=/hf_cache -v /opt/hf_cache:/hf_cache \
  -e HF_HUB_ENABLE_HF_TRANSFER=0 \
  $ECR_REPO:latest \
  uv run -m moshi.server --hf-repo $MODEL_B --port 8999 --host 0.0.0.0 --static /app/static

# Cloudflare Tunnel
if ! command -v cloudflared &> /dev/null; then
  sudo curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
  sudo chmod +x /usr/local/bin/cloudflared
fi
pkill cloudflared 2>/dev/null || true
nohup cloudflared tunnel --url http://localhost:8998 > /tmp/tunnel-a.log 2>&1 &
nohup cloudflared tunnel --url http://localhost:8999 > /tmp/tunnel-b.log 2>&1 &
SETUP

echo "=== モデルロードを待っています ==="
for port in 8998 8999; do
  echo -n "  ポート $port: "
  for i in $(seq 1 180); do
    if ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP \
      "curl -s -o /dev/null http://localhost:$port" 2>/dev/null; then
      echo "Ready (${i}0秒)"
      break
    fi
    sleep 5
  done
done

echo "=== Tunnel URL を取得 ==="
TUNNEL_A=$(ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP \
  "grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/tunnel-a.log 2>/dev/null | head -1")
TUNNEL_B=$(ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP \
  "grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/tunnel-b.log 2>/dev/null | head -1")

echo ""
echo "=== 起動完了 ==="
echo "Instance: $INSTANCE_ID"
echo "Model A ($MODEL_A): $TUNNEL_A"
echo "Model B ($MODEL_B): $TUNNEL_B"
echo ""
echo "停止: ./scripts/stop-gpu.sh"
