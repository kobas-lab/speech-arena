#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# モデル入り EBS スナップショット v2
# HF キャッシュごと保存して、起動時に DL をスキップする
# ============================================================

REGION="us-east-1"
AZ="us-east-1d"
VOLUME_SIZE=200  # GB（6モデル + mimi + キャッシュ）
source scripts/.env 2>/dev/null || true
HF_TOKEN="${HF_TOKEN:-}"

MODELS=(
  "abePclWaseda/llm-jp-moshi-v1"
  "abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo"
  "abePclWaseda/llm-jp-moshi-v1.1-all-mixed"
  "abePclWaseda/llm-jp-moshi-v1.1-all-staged"
  "abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo-staged"
  "abePclWaseda/llm-jp-moshi-v1.2"
)

echo "=== Step 1: EBS ボリューム作成 (${VOLUME_SIZE}GB) ==="
VOLUME_ID=$(aws ec2 create-volume \
  --region $REGION --availability-zone $AZ \
  --size $VOLUME_SIZE --volume-type gp3 \
  --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=speech-arena-models-v2},{Key=Project,Value=speech-arena}]" \
  --query 'VolumeId' --output text)
echo "Volume: $VOLUME_ID"

echo "=== Step 2: GPU インスタンスを起動（moshi.server でキャッシュ生成）==="
# GPU が必要（moshi.server の起動にGPUが必要なため）
SG_ID=$(aws ec2 describe-security-groups --region $REGION \
  --filters "Name=group-name,Values=speech-arena-gpu-us-east-1" \
  --query 'SecurityGroups[0].GroupId' --output text 2>/dev/null || echo "")

if [ -z "$SG_ID" ] || [ "$SG_ID" = "None" ]; then
  VPC_ID=$(aws ec2 describe-vpcs --region $REGION --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
  SG_ID=$(aws ec2 create-security-group --region $REGION --group-name speech-arena-gpu-snapshot \
    --description "For snapshot creation" --vpc-id $VPC_ID --query 'GroupId' --output text)
  aws ec2 authorize-security-group-ingress --region $REGION --group-id $SG_ID --protocol tcp --port 22 --cidr 0.0.0.0/0
fi

AMI_ID=$(aws ec2 describe-images --region $REGION --owners amazon \
  --filters "Name=name,Values=Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 22.04) *" "Name=architecture,Values=x86_64" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text)

# g5.xlarge を試行、なければ g6e.xlarge
INSTANCE_ID=""
for ITYPE in g5.xlarge g6e.xlarge g5.2xlarge; do
  SUBNET_ID=$(aws ec2 describe-subnets --region $REGION \
    --filters Name=availability-zone,Values=$AZ \
    --query 'Subnets[0].SubnetId' --output text)
  INSTANCE_ID=$(aws ec2 run-instances --region $REGION \
    --image-id $AMI_ID --instance-type $ITYPE --count 1 \
    --subnet-id $SUBNET_ID --security-group-ids $SG_ID \
    --key-name speech-arena-gpu \
    --iam-instance-profile Name=speech-arena-gpu-instance \
    --block-device-mappings "[{\"DeviceName\":\"/dev/sda1\",\"Ebs\":{\"VolumeSize\":100,\"VolumeType\":\"gp3\"}}]" \
    --instance-market-options '{"MarketType":"spot","SpotOptions":{"SpotInstanceType":"one-time","MaxPrice":"1.50"}}' \
    --query 'Instances[0].InstanceId' --output text 2>/dev/null) && break || true
  echo "  $ITYPE failed, trying next..."
done

if [ -z "$INSTANCE_ID" ]; then
  echo "ERROR: Could not start GPU instance"
  exit 1
fi
echo "Instance: $INSTANCE_ID ($ITYPE)"

echo "  起動を待っています..."
aws ec2 wait instance-running --region $REGION --instance-ids $INSTANCE_ID
PUBLIC_IP=$(aws ec2 describe-instances --region $REGION --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "  IP: $PUBLIC_IP"

echo "=== Step 3: EBS をアタッチ ==="
aws ec2 attach-volume --region $REGION --volume-id $VOLUME_ID --instance-id $INSTANCE_ID --device /dev/xvdf
sleep 15

ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP bash -s <<'MOUNT_SCRIPT'
DEVICE=""
for d in /dev/nvme1n1 /dev/xvdf; do [ -b "$d" ] && DEVICE=$d && break; done
if [ -z "$DEVICE" ]; then echo "ERROR: No EBS device"; lsblk; exit 1; fi
echo "Device: $DEVICE"
sudo mkfs.ext4 $DEVICE
sudo mkdir -p /mnt/models
sudo mount $DEVICE /mnt/models
sudo chown ubuntu:ubuntu /mnt/models
mkdir -p /mnt/models/hf_cache
MOUNT_SCRIPT
echo "  マウント完了"

echo "=== Step 4: ECR ログイン + Docker pull ==="
ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP bash -s <<DOCKER_SCRIPT
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin 518024472814.dkr.ecr.$REGION.amazonaws.com
docker pull 518024472814.dkr.ecr.$REGION.amazonaws.com/speech-arena/moshi-server:latest
DOCKER_SCRIPT
echo "  Docker pull 完了"

echo "=== Step 5: 各モデルの HF キャッシュを生成 ==="
for MODEL in "${MODELS[@]}"; do
  MODEL_NAME=$(basename "$MODEL")
  echo "  Caching $MODEL_NAME..."

  # moshi.server を起動してHFキャッシュを生成、起動確認したら停止
  ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP bash -s <<CACHE_SCRIPT
docker rm -f moshi-server 2>/dev/null || true
docker run -d --gpus all --name moshi-server \
  -e HF_TOKEN=$HF_TOKEN \
  -e HUGGING_FACE_HUB_TOKEN=$HF_TOKEN \
  -e HF_HOME=/hf_cache \
  -v /mnt/models/hf_cache:/hf_cache \
  518024472814.dkr.ecr.$REGION.amazonaws.com/speech-arena/moshi-server:latest \
  uv run -m moshi.server --hf-repo $MODEL --half --port 8998 --host 0.0.0.0

# moshi.server が起動するまで待つ
echo "  Waiting for model to load..."
for i in \$(seq 1 300); do
  if curl -s -o /dev/null http://localhost:8998 2>/dev/null; then
    echo "  Ready after \${i} seconds"
    break
  fi
  if [ \$((i % 30)) -eq 0 ]; then
    echo "  Still loading... (\${i}s)"
  fi
  sleep 1
done

docker stop moshi-server
echo "  Cache size: \$(du -sh /mnt/models/hf_cache/)"
CACHE_SCRIPT
  echo "  Done: $MODEL_NAME"
done

echo "=== Step 6: クリーンアップ & スナップショット ==="
ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP \
  "docker rm -f moshi-server 2>/dev/null; sudo umount /mnt/models" 2>/dev/null || true

aws ec2 detach-volume --region $REGION --volume-id $VOLUME_ID 2>/dev/null || true
sleep 15
aws ec2 terminate-instances --region $REGION --instance-ids $INSTANCE_ID > /dev/null

echo "=== Step 7: スナップショット作成 ==="
SNAPSHOT_ID=$(aws ec2 create-snapshot --region $REGION \
  --volume-id $VOLUME_ID \
  --description "SpeechArena HF cache (6 models + mimi, bf16)" \
  --tag-specifications "ResourceType=snapshot,Tags=[{Key=Name,Value=speech-arena-models-v2},{Key=Project,Value=speech-arena}]" \
  --query 'SnapshotId' --output text)
echo "Snapshot: $SNAPSHOT_ID"
echo "  完了を待っています..."

while true; do
  STATE=$(aws ec2 describe-snapshots --region $REGION --snapshot-ids $SNAPSHOT_ID --query 'Snapshots[0].State' --output text)
  PROGRESS=$(aws ec2 describe-snapshots --region $REGION --snapshot-ids $SNAPSHOT_ID --query 'Snapshots[0].Progress' --output text)
  echo "  $STATE ($PROGRESS)"
  [ "$STATE" = "completed" ] && break
  sleep 60
done

aws ec2 delete-volume --region $REGION --volume-id $VOLUME_ID 2>/dev/null || true

echo ""
echo "=== 完了 ==="
echo "Snapshot ID: $SNAPSHOT_ID"
echo "infra/terraform.tfvars の model_snapshot_id を更新してください"
