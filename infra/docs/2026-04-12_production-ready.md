# SpeechArena 本番運用ドキュメント

作成日: 2026-04-12

---

## 現在の構成（本番稼働中）

```
ワーカー
  ↓ HTTPS
Vercel (Next.js)
  ├── フロントエンド: https://web-fawn-five-91.vercel.app
  ├── API: /api/matchups, /api/trials/*, /api/leaderboard
  └── DB: Supabase PostgreSQL (ap-southeast-2)
  ↓ matchup 作成時に endpointUrl を返す
別タブで Moshi Web UI にアクセス
  ↓ HTTPS (Cloudflare Tunnel)
AWS EC2 g6e.xlarge (us-east-1)
  ├── moshi-server-a (ポート 8998) ← Model A
  ├── moshi-server-b (ポート 8999) ← Model B
  ├── Cloudflare Tunnel A → https://xxx.trycloudflare.com
  └── Cloudflare Tunnel B → https://yyy.trycloudflare.com
```

### 稼働中のリソース

| リソース | 値 |
|---|---|
| Vercel URL | https://web-fawn-five-91.vercel.app |
| AWS インスタンス | g6e.xlarge (us-east-1) |
| VRAM | 46GB（2モデル × 17GB = 34GB 使用） |
| EBS | 200GB |
| 現在の Model A | llm-jp-moshi-v1 |
| 現在の Model B | llm-jp-moshi-v1.1-all-mixed |
| HF キャッシュ | /opt/hf_cache（ホストマウント、モデル入れ替え高速化） |

---

## 日常の運用手順

### 評価セッションの開始

```bash
cd /home/yuabe/dev/speech-arena

# GPU インスタンスを起動（ウォームスタートなら3-5分、コールドスタートなら15-20分）
source scripts/.env && ./scripts/start-gpu.sh

# 特定のモデルペアを指定する場合
source scripts/.env && ./scripts/start-gpu.sh abePclWaseda/llm-jp-moshi-v1 abePclWaseda/llm-jp-moshi-v1.2
```

起動後、DB の `endpointUrl` を更新する必要がある場合：

```bash
cd apps/web && npx tsx -e "
import 'dotenv/config';
import { PrismaClient } from './app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
async function main() {
  await prisma.model.update({
    where: { name: 'llm-jp-moshi-v1' },
    data: { endpointUrl: '<TUNNEL_A_URL>', isActive: true },
  });
  await prisma.model.update({
    where: { name: 'llm-jp-moshi-v1.1-all-mixed' },
    data: { endpointUrl: '<TUNNEL_B_URL>', isActive: true },
  });
}
main().finally(() => prisma.\$disconnect());
"
```

### 評価セッションの終了

```bash
# GPU を停止（EBS 代 ~$16/月のみ課金）
./scripts/stop-gpu.sh
```

### モデルペアの入れ替え

```bash
# SSH でインスタンスに接続
IP=$(aws ec2 describe-instances --region us-east-1 --filters Name=instance-state-name,Values=running --query 'Reservations[0].Instances[0].PublicIpAddress' --output text)
ssh -i ~/.ssh/speech-arena-gpu.pem ubuntu@$IP

# コンテナを入れ替え
docker rm -f moshi-server-a moshi-server-b
ECR_REPO="518024472814.dkr.ecr.us-east-1.amazonaws.com/speech-arena/moshi-server"
HF_TOKEN="<your_token>"

# Model A
docker run -d --gpus all --name moshi-server-a --restart always \
  -p 8998:8998 \
  -e HF_TOKEN=$HF_TOKEN -e HUGGING_FACE_HUB_TOKEN=$HF_TOKEN \
  -e HF_HOME=/hf_cache -v /opt/hf_cache:/hf_cache \
  -e HF_HUB_ENABLE_HF_TRANSFER=0 \
  $ECR_REPO:latest \
  uv run -m moshi.server --hf-repo <NEW_MODEL_A> --port 8998 --host 0.0.0.0 --static /app/static

# Model A の起動を待つ
for i in $(seq 1 180); do curl -s -o /dev/null http://localhost:8998 && echo "A Ready" && break; sleep 5; done

# Model B
docker run -d --gpus all --name moshi-server-b --restart always \
  -p 8999:8999 \
  -e HF_TOKEN=$HF_TOKEN -e HUGGING_FACE_HUB_TOKEN=$HF_TOKEN \
  -e HF_HOME=/hf_cache -v /opt/hf_cache:/hf_cache \
  -e HF_HUB_ENABLE_HF_TRANSFER=0 \
  $ECR_REPO:latest \
  uv run -m moshi.server --hf-repo <NEW_MODEL_B> --port 8999 --host 0.0.0.0 --static /app/static

# Tunnel URL 更新（変わっている場合）
# DB の endpointUrl も更新すること
```

HF キャッシュ（/opt/hf_cache）に過去にロードしたモデルが残っているので、2回目以降のロードは高速（10秒程度）。

### GPU インスタンスの状態確認

```bash
# 実行中のインスタンス
aws ec2 describe-instances --region us-east-1 --filters Name=instance-state-name,Values=running \
  --query 'Reservations[*].Instances[*].{IP:PublicIpAddress,Type:InstanceType,Id:InstanceId}' --output table

# moshi.server の状態（SSH）
ssh -i ~/.ssh/speech-arena-gpu.pem ubuntu@<IP> "docker ps; nvidia-smi | grep MiB"

# Tunnel URL の確認
ssh -i ~/.ssh/speech-arena-gpu.pem ubuntu@<IP> \
  "grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/tunnel-a.log | head -1; \
   grep -oP 'https://[a-z0-9-]+\.trycloudflare\.com' /tmp/tunnel-b.log | head -1"
```

### 評価データの確認

```bash
cd apps/web && npx tsx -e "
import 'dotenv/config';
import { PrismaClient } from './app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });
async function main() {
  const matchups = await prisma.matchup.groupBy({ by: ['status'], _count: true });
  console.log('Matchups:', matchups);
  const trials = await prisma.trial.count({ where: { outcome: { not: null } } });
  console.log('Completed trials:', trials);
  const votes = await prisma.matchupVote.count();
  console.log('Votes:', votes);
}
main().finally(() => prisma.\$disconnect());
"
```

---

## コスト

### 稼働中

| リソース | 単価 | 備考 |
|---|---|---|
| EC2 g6e.xlarge | ~$1.00/h | 起動中のみ |
| EBS 200GB | ~$16/月 | 停止中も課金 |
| Vercel | 無料（Hobby） | |
| Supabase | 無料 | |
| Cloudflare Tunnel | 無料 | |

### 月額の目安

| 運用パターン | GPU 時間 | 月額 |
|---|---|---|
| 1日2時間 × 週5日 | 44h | ~$60 |
| 1日8時間 × 週5日 | 176h | ~$192 |
| 常時起動 | 720h | ~$736 |

---

## 比較対象モデル

| ID | HuggingFace | 状態 |
|---|---|---|
| v1 | llm-jp-moshi-v1 | **active** |
| v1.1b | llm-jp-moshi-v1.1-vb-pseudo | inactive |
| v1.1c | llm-jp-moshi-v1.1-all-staged | inactive |
| v1.1d | llm-jp-moshi-v1.1-all-mixed | **active** |
| v1.1e | llm-jp-moshi-v1.1-vb-pseudo-staged | inactive |
| v1.2 | llm-jp-moshi-v1.2 | inactive |

現在は v1 と v1.1d の2モデルが active。他のモデルに切り替えるには、モデルペアの入れ替え手順を実施。

---

## 評価フロー（ワーカー視点）

1. https://web-fawn-five-91.vercel.app にアクセス
2. 「評価を開始する」を押す
3. System A と2回会話（各約2分）
   - 各会話後に FD-DMOS 4指標 + 成功/失敗 + パケットロスを評価
4. System B と2回会話（同上）
5. 最終投票: A / B / 引き分け + 理由（任意）
6. 完了画面 → リーダーボードを確認可能

所要時間: 約10分

---

## 残っている課題

### 高優先

| 課題 | 詳細 | Issue |
|---|---|---|
| 認証 | 誰でもアクセス可能。不正データのリスク | #3 |
| Tunnel URL 変動 | EC2 Stop/Start や Tunnel 再起動で URL が変わる。DB の手動更新が必要 | — |
| 同時アクセス | 1台で1ワーカーずつ。2人目は待ちが発生 | — |

### 中優先

| 課題 | 詳細 | Issue |
|---|---|---|
| 6モデル全比較 | 現在は2モデルのみ active。全ペア比較には順次切り替えが必要 | — |
| 起動時間 | コールドスタート 15-20分。ウォームスタートでも 3-5分 | — |
| Lambda 統合 | start-gpu.sh は手動。Lambda で自動起動/モデル割り当てが理想 | #11 |
| Bradley-Terry | 現在は単純平均スコア。統計的ランキングが未実装 | #8 |

### 低優先

| 課題 | 詳細 | Issue |
|---|---|---|
| 音声録音 | moshi.server → S3 保存 | #10 |
| データセット公開 | llm-jp/llm-jp-speech-arena-conversations | #12 |
| フロント統合 | 別タブ方式から1画面方式 | #11 |
| Auto Scaling | 同時複数ワーカー対応 | — |

---

## トラブルシューティング

### Tunnel URL が無効になった

```bash
# SSH で Tunnel を再起動
ssh -i ~/.ssh/speech-arena-gpu.pem ubuntu@<IP>
pkill cloudflared
nohup cloudflared tunnel --url http://localhost:8998 > /tmp/tunnel-a.log 2>&1 &
nohup cloudflared tunnel --url http://localhost:8999 > /tmp/tunnel-b.log 2>&1 &
# 新しい URL を取得して DB を更新
```

### moshi.server がクラッシュした

```bash
# Docker ログを確認
ssh -i ~/.ssh/speech-arena-gpu.pem ubuntu@<IP> "docker logs moshi-server-a"

# --restart always なので自動再起動するが、連続クラッシュの場合はコンテナを作り直す
docker rm -f moshi-server-a
docker run -d --gpus all --name moshi-server-a --restart always ...
```

### ディスク容量不足

```bash
# 確認
ssh -i ~/.ssh/speech-arena-gpu.pem ubuntu@<IP> "df -h /"

# Docker の不要なイメージを削除
ssh -i ~/.ssh/speech-arena-gpu.pem ubuntu@<IP> "docker system prune -af"
```

### GPU インスタンスが起動できない

```bash
# vCPU 上限を確認
aws service-quotas get-service-quota --service-code ec2 --quota-code L-3819A6DF --region us-east-1 --query 'Quota.Value'

# 実行中/停止中のインスタンスを確認（vCPU を消費している）
aws ec2 describe-instances --region us-east-1 --filters "Name=instance-state-name,Values=running,stopped,stopping,shutting-down" \
  --query 'Reservations[*].Instances[*].{Id:InstanceId,State:State.Name,Type:InstanceType}' --output table
```
