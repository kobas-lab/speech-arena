#!/bin/bash
set -euxo pipefail

# Terraform から注入される変数
ECR_REPO_URL="${ecr_repo_url}"
AWS_REGION="${aws_region}"
DYNAMODB_TABLE="${dynamodb_table}"
HF_TOKEN="${hf_token}"

# インスタンスメタデータ取得 (IMDSv2)
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)

# nvidia-container-toolkit のインストール（未インストールの場合）
if ! command -v nvidia-container-runtime &> /dev/null; then
  curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
  curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \
    tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
  apt-get update && apt-get install -y nvidia-container-toolkit
  nvidia-ctk runtime configure --runtime=docker
  systemctl restart docker
fi

# ECR ログイン
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REPO_URL

# Docker イメージの pull
docker pull $ECR_REPO_URL:latest

# SESSION_ID は Lambda が run_instances 時に環境変数で上書きする
# デフォルトはインスタンス ID を使用
SESSION_ID=$${SESSION_ID:-$INSTANCE_ID}
MODEL_REPO=$${MODEL_REPO:-"abePclWaseda/llm-jp-moshi-v1"}
MOSHI_PORT=$${MOSHI_PORT:-8998}

# moshi.server コンテナを起動（HuggingFace からモデルダウンロード）
docker run -d --gpus all \
  --name moshi-server \
  -p $MOSHI_PORT:$MOSHI_PORT \
  -e HF_TOKEN=$HF_TOKEN \
  -e HUGGING_FACE_HUB_TOKEN=$HF_TOKEN \
  $ECR_REPO_URL:latest \
  uv run -m moshi.server --hf-repo $MODEL_REPO --port $MOSHI_PORT --host 0.0.0.0

# moshi.server が実際に listen するまで待つ（最大15分）
echo "Waiting for moshi.server to be ready..."
for i in $(seq 1 180); do
  if curl -s -o /dev/null -w '' http://localhost:$MOSHI_PORT 2>/dev/null; then
    echo "moshi.server is ready after $${i}0 seconds"
    break
  fi
  sleep 5
done

# Cloudflare Tunnel をインストール＆起動（HTTPS 化）
echo "Starting Cloudflare Tunnel..."
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
TUNNEL_LOG="/tmp/cloudflared.log"
cloudflared tunnel --url http://localhost:$MOSHI_PORT > $TUNNEL_LOG 2>&1 &

# Tunnel URL を取得（最大30秒待機）
TUNNEL_URL=""
for i in $(seq 1 30); do
  TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' $TUNNEL_LOG 2>/dev/null | head -1 || true)
  if [ -n "$TUNNEL_URL" ]; then
    echo "Tunnel URL: $TUNNEL_URL"
    break
  fi
  sleep 1
done
if [ -z "$TUNNEL_URL" ]; then
  echo "WARNING: Failed to get tunnel URL, using IP"
  TUNNEL_URL="http://$PUBLIC_IP:$MOSHI_PORT"
fi

# DynamoDB を "running" に更新（Tunnel URL を publicIp フィールドに保存）
aws dynamodb update-item \
  --region ap-northeast-1 \
  --table-name $DYNAMODB_TABLE \
  --key "{\"sessionId\": {\"S\": \"$SESSION_ID\"}}" \
  --update-expression "SET #s = :s, publicIp = :ip, instanceId = :iid, startedAt = :t" \
  --expression-attribute-names '{"#s": "status"}' \
  --expression-attribute-values "{\":s\": {\"S\": \"running\"}, \":ip\": {\"S\": \"$TUNNEL_URL\"}, \":iid\": {\"S\": \"$INSTANCE_ID\"}, \":t\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"}}"

# 安全装置: 30分後に自動シャットダウン
# 安全装置: 30分後に自動終了（terminate）
(sleep 3600 && aws ec2 terminate-instances --region $(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region) --instance-ids $INSTANCE_ID) &
