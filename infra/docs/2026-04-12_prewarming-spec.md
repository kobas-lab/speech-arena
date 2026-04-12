# SpeechArena プリウォーミング方式 仕様書

作成日: 2026-04-12
ステータス: 提案

---

## 概要

常時 1 台の GPU インスタンスで 2 モデルを起動しておき、ワーカーが入室したら待ち時間なしで対話を開始できるようにする。対話中にバックグラウンドで次のモデルペアを準備し、次のワーカーも待ち時間なしで開始できるようにする。

---

## 現状の問題

| 方式 | 待ち時間 | 問題 |
|---|---|---|
| コールドスタート | 10-15分 | HuggingFace DL + モデルロード |
| ウォームスタート | 3-5分 | Docker 再起動 + モデルロード |

ワーカーに 3-15 分待たせるのは UX として許容できない。

---

## 提案: プリウォーミング方式

### アーキテクチャ

```
常時 running:
  g6e.xlarge (us-east-1)
  ├── moshi-server-a (ポート 8998, Model X)  ← ワーカー用に待機中
  ├── moshi-server-b (ポート 8999, Model Y)  ← ワーカー用に待機中
  └── Cloudflare Tunnel (HTTPS)

ワーカー入室:
  → 即座に対話開始（待ち時間 0）
  → 同時にバックグラウンドで次のペアを準備

対話完了:
  → 次のペアのコンテナ入れ替え完了
  → 次のワーカーも即座に開始
```

### フロー

```
1. [事前準備] Lambda or 手動で g6e.xlarge を起動、2 モデルをロード
2. [ワーカー入室] matchup 作成 → 起動済みインスタンスの Tunnel URL を即座に返す
3. [対話中] バックグラウンドで次の 2 モデルを選択
4. [対話完了] 現在のコンテナを停止、次の 2 モデルのコンテナを起動
5. [次のワーカー入室] 即座に対話開始
6. [評価終了] 手動で EC2 を stop
```

### モデル入れ替え

ワーカーが対話を完了した後、次のランダムペアに入れ替える：

```bash
# 現在のコンテナを停止
docker stop moshi-server-a moshi-server-b
docker rm moshi-server-a moshi-server-b

# 次のモデルペアで起動
docker run -d --gpus all --name moshi-server-a \
  -p 8998:8998 --restart always \
  -e HF_TOKEN=$HF_TOKEN \
  $ECR_IMAGE uv run -m moshi.server --hf-repo $NEXT_MODEL_A --port 8998 --host 0.0.0.0 --static /app/static

docker run -d --gpus all --name moshi-server-b \
  -p 8999:8999 --restart always \
  -e HF_TOKEN=$HF_TOKEN \
  $ECR_IMAGE uv run -m moshi.server --hf-repo $NEXT_MODEL_B --port 8999 --host 0.0.0.0 --static /app/static
```

HF キャッシュが Docker コンテナ内に残るため、過去にロードしたモデルは再ダウンロード不要。ただしコンテナを `rm` するとキャッシュが消えるので、**ホストにキャッシュをマウント**する方が良い：

```bash
docker run -d --gpus all --name moshi-server-a \
  -p 8998:8998 --restart always \
  -e HF_TOKEN=$HF_TOKEN \
  -e HF_HOME=/hf_cache \
  -v /opt/hf_cache:/hf_cache \
  $ECR_IMAGE uv run -m moshi.server --hf-repo $NEXT_MODEL_A --port 8998 --host 0.0.0.0 --static /app/static
```

これで全モデルの HF キャッシュがホストの `/opt/hf_cache` に蓄積され、モデル入れ替え時はロードのみ（2-3分）で済む。

---

## コスト

### 評価集中期間（1日8時間、週5日）

| リソース | 計算 | 月額 |
|---|---|---|
| EC2 g6e.xlarge | $1.00/h × 8h × 22日 | **~$176** |
| EBS 100GB | $0.08/GB × 100GB | ~$8 |
| Lambda, API Gateway, DynamoDB | | ~$0 |
| **合計** | | **~$184/月** |

### 常時起動（24時間）

| リソース | 計算 | 月額 |
|---|---|---|
| EC2 g6e.xlarge | $1.00/h × 24h × 30日 | **~$720** |
| EBS 100GB | | ~$8 |
| **合計** | | **~$728/月** |

### 比較

| 方式 | 待ち時間 | 月額コスト |
|---|---|---|
| 現在（ウォームプール） | 3-5分 | ~$8（待機中） + 使用時のみ |
| プリウォーミング（8h/日） | **0** | **~$184** |
| プリウォーミング（常時） | **0** | **~$728** |

---

## 運用

### 評価セッションの開始

```bash
# GPU を起動して 2 モデルをロード
./scripts/start-gpu.sh
```

### 評価セッションの終了

```bash
# GPU を停止（コスト削減）
./scripts/stop-gpu.sh
```

### 自動化（オプション）

CloudWatch Events で評価時間帯（例: 平日 9:00-17:00 JST）に自動起動/停止：

```
cron(0 0 ? * MON-FRI *)  → start-gpu（9:00 JST = 0:00 UTC）
cron(0 8 ? * MON-FRI *)  → stop-gpu（17:00 JST = 8:00 UTC）
```

---

## 実装タスク

- [ ] Lambda を修正: 起動済みインスタンスの Tunnel URL を即座に返す
- [ ] モデル入れ替え API: 対話完了後に次のペアを準備
- [ ] HF キャッシュのホストマウント: `/opt/hf_cache` に全モデルキャッシュ
- [ ] start-gpu.sh / stop-gpu.sh スクリプト
- [ ] CloudWatch Events で自動起動/停止（オプション）
- [ ] フロントの GPU 待機画面を「即座に開始」に変更

---

## リスク

| リスク | 影響 | 対策 |
|---|---|---|
| GPU インスタンスの Spot 中断 | なし | オンデマンドを使用 |
| Cloudflare Tunnel の切断 | 対話中断 | Tunnel の自動再起動 |
| 同時に複数ワーカーが入室 | 2人目は待ち | 2台目のインスタンスを起動 or キュー |
| コスト超過 | 予算オーバー | 自動停止スケジュール |
