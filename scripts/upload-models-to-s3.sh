#!/usr/bin/env bash
set -euo pipefail

# HuggingFace のモデルを S3 にキャッシュするスクリプト
# 使い方: ./scripts/upload-models-to-s3.sh

S3_BUCKET="speech-arena-audio"
S3_PREFIX="models"
HF_TOKEN="${HF_TOKEN:-$(grep HF_TOKEN scripts/.env 2>/dev/null | cut -d= -f2)}"

MODELS=(
  "abePclWaseda/llm-jp-moshi-v1"
  "abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo"
  "abePclWaseda/llm-jp-moshi-v1.1-all-mixed"
  "abePclWaseda/llm-jp-moshi-v1.1-all-staged"
  "abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo-staged"
  "abePclWaseda/llm-jp-moshi-v1.2"
)

echo "=== Uploading models to s3://$S3_BUCKET/$S3_PREFIX/ ==="

for MODEL in "${MODELS[@]}"; do
  MODEL_NAME=$(basename "$MODEL")
  LOCAL_CACHE="$HOME/.cache/huggingface/hub/models--${MODEL//\//-}"
  S3_PATH="s3://$S3_BUCKET/$S3_PREFIX/$MODEL_NAME/"

  # S3 に既にあるかチェック
  COUNT=$(aws s3 ls "$S3_PATH" 2>/dev/null | wc -l)
  if [ "$COUNT" -gt "3" ]; then
    echo "  [skip] $MODEL_NAME (already in S3)"
    continue
  fi

  echo "  [download] $MODEL_NAME from HuggingFace..."
  # huggingface-cli でダウンロード
  HF_TOKEN=$HF_TOKEN huggingface-cli download "$MODEL" --local-dir "/tmp/hf-models/$MODEL_NAME"

  echo "  [upload] $MODEL_NAME to S3..."
  aws s3 sync "/tmp/hf-models/$MODEL_NAME" "$S3_PATH" --quiet

  echo "  [done] $MODEL_NAME"
  rm -rf "/tmp/hf-models/$MODEL_NAME"
done

echo "=== Complete ==="
