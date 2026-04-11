#!/usr/bin/env bash
set -euo pipefail

# ============================================================
# モデル入り EBS スナップショットを作成するスクリプト
# 使い方: ./scripts/create-model-snapshot.sh
# ============================================================

REGION="us-east-1"
AZ="us-east-1d"
VOLUME_SIZE=100  # GB
HF_TOKEN="${HF_TOKEN:-$(grep HF_TOKEN scripts/.env 2>/dev/null | cut -d= -f2)}"

MODELS=(
  "abePclWaseda/llm-jp-moshi-v1"
  "abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo"
  "abePclWaseda/llm-jp-moshi-v1.1-all-mixed"
  "abePclWaseda/llm-jp-moshi-v1.1-all-staged"
  "abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo-staged"
  "abePclWaseda/llm-jp-moshi-v1.2"
)

echo "=== Step 1: EBS ボリュームを作成 ==="
VOLUME_ID=$(aws ec2 create-volume \
  --region $REGION \
  --availability-zone $AZ \
  --size $VOLUME_SIZE \
  --volume-type gp3 \
  --tag-specifications "ResourceType=volume,Tags=[{Key=Name,Value=speech-arena-models},{Key=Project,Value=speech-arena}]" \
  --query 'VolumeId' --output text)
echo "Volume ID: $VOLUME_ID"

echo "=== Step 2: 一時 EC2 インスタンスを起動 ==="
AMI_ID=$(aws ec2 describe-images --region $REGION --owners amazon \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" "Name=architecture,Values=x86_64" \
  --query 'sort_by(Images, &CreationDate)[-1].ImageId' --output text)

INSTANCE_ID=$(aws ec2 run-instances \
  --region $REGION \
  --image-id $AMI_ID \
  --instance-type t3.xlarge \
  --count 1 \
  --placement AvailabilityZone=$AZ \
  --key-name speech-arena-gpu \
  --security-group-ids sg-07b6186850e4d9211 \
  --iam-instance-profile Name=speech-arena-gpu-instance \
  --query 'Instances[0].InstanceId' --output text 2>/dev/null || \
  # SG がなければデフォルトで起動
  aws ec2 run-instances \
    --region $REGION \
    --image-id $AMI_ID \
    --instance-type t3.xlarge \
    --count 1 \
    --placement AvailabilityZone=$AZ \
    --key-name speech-arena-gpu \
    --query 'Instances[0].InstanceId' --output text)
echo "Instance ID: $INSTANCE_ID"

echo "  インスタンスの起動を待っています..."
aws ec2 wait instance-running --region $REGION --instance-ids $INSTANCE_ID

PUBLIC_IP=$(aws ec2 describe-instances --region $REGION --instance-ids $INSTANCE_ID \
  --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
echo "  Public IP: $PUBLIC_IP"

echo "=== Step 3: EBS をアタッチしてフォーマット ==="
aws ec2 attach-volume --region $REGION --volume-id $VOLUME_ID --instance-id $INSTANCE_ID --device /dev/xvdf
echo "  アタッチを待っています..."
sleep 15

ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP bash -s <<'REMOTE_SCRIPT'
# NVMe インスタンスでは /dev/nvme1n1、従来型では /dev/xvdf
DEVICE=""
for d in /dev/nvme1n1 /dev/xvdf; do
  if [ -b "$d" ]; then
    DEVICE=$d
    break
  fi
done
if [ -z "$DEVICE" ]; then
  echo "ERROR: No additional EBS device found"
  lsblk
  exit 1
fi
echo "Using device: $DEVICE"
sudo mkfs.ext4 $DEVICE
sudo mkdir -p /mnt/models
sudo mount $DEVICE /mnt/models
sudo chown ubuntu:ubuntu /mnt/models
REMOTE_SCRIPT
echo "  マウント完了"

echo "=== Step 4: モデルをダウンロード ==="
# 必要なファイルだけ curl で直接ダウンロード
for MODEL in "${MODELS[@]}"; do
  MODEL_NAME=$(basename "$MODEL")
  echo "  Downloading $MODEL_NAME..."
  ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP bash -s <<DLSCRIPT
mkdir -p /mnt/models/$MODEL_NAME
cd /mnt/models/$MODEL_NAME
for f in model.safetensors tokenizer-e351c8d8-checkpoint125.safetensors tokenizer_spm_32k_3.model moshi_lm_kwargs.json; do
  if [ ! -f "\$f" ]; then
    echo "    Downloading \$f..."
    curl -fsSL -H "Authorization: Bearer $HF_TOKEN" \
      "https://huggingface.co/$MODEL/resolve/main/\$f" -o "\$f" 2>/dev/null || echo "    Skip: \$f (not found)"
  fi
done
du -sh /mnt/models/$MODEL_NAME/
DLSCRIPT
  echo "  Done: $MODEL_NAME"
done

echo "=== Step 5: 不要ファイルを削除 ==="
ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP \
  "find /mnt/models -name '.cache' -type d -exec rm -rf {} + 2>/dev/null; du -sh /mnt/models/*/"

echo "=== Step 6: アンマウント ==="
ssh -o StrictHostKeyChecking=no -i ~/.ssh/speech-arena-gpu.pem ubuntu@$PUBLIC_IP \
  "sudo umount /mnt/models" 2>/dev/null || true

echo "=== Step 7: EBS をデタッチ ==="
aws ec2 detach-volume --region $REGION --volume-id $VOLUME_ID
sleep 10

echo "=== Step 8: スナップショットを作成 ==="
SNAPSHOT_ID=$(aws ec2 create-snapshot \
  --region $REGION \
  --volume-id $VOLUME_ID \
  --description "SpeechArena models (6 models, fp32)" \
  --tag-specifications "ResourceType=snapshot,Tags=[{Key=Name,Value=speech-arena-models},{Key=Project,Value=speech-arena}]" \
  --query 'SnapshotId' --output text)
echo "Snapshot ID: $SNAPSHOT_ID"
echo "  スナップショットの作成を待っています..."
aws ec2 wait snapshot-completed --region $REGION --snapshot-ids $SNAPSHOT_ID

echo "=== Step 9: クリーンアップ ==="
aws ec2 terminate-instances --region $REGION --instance-ids $INSTANCE_ID > /dev/null
aws ec2 delete-volume --region $REGION --volume-id $VOLUME_ID 2>/dev/null || true

echo ""
echo "=== 完了 ==="
echo "Snapshot ID: $SNAPSHOT_ID"
echo ""
echo "この ID を infra/variables.tf の model_snapshot_id に設定してください"
