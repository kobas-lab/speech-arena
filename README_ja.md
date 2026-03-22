# SpeechArena

[![English](https://img.shields.io/badge/lang-English-blue.svg)](README.md)

SpeechArena は、リアルタイム全二重音声対話モデルのための人間中心 A/B 評価プラットフォームです。

**FD-DMOS (Full-Duplex Dialogue MOS)** 評価フレームワークを用いて、音声対話システムをペアワイズ比較できます。

---

## モチベーション

リアルタイム音声対話システム（例：Moshi ベースのモデル）には以下の課題があります：

- セッション開始の失敗
- 会話の崩壊
- ターンテイキングの不安定性
- 遅延による品質劣化

SpeechArena は、オフラインやテキストベースのベンチマークではなく、実際のインタラクション環境でモデルを評価します。

---

## 評価フレームワーク: FD-DMOS

各会話を4次元で評価します（1〜5の5段階）：

|                    | 客観寄り（Objective）                      | 主観寄り（Subjective）                        |
|--------------------|-------------------------------------------|----------------------------------------------|
| **音の質**          | 音声自然性（音響的に自然か）                  | 聴感自然性（人間らしく感じるか）                  |
| **内容**            | 意味理解性（意味が正しく理解できるか）          | 対話有用性（対話として有用か）                    |

さらに：
- **会話の成功/失敗**
- **パケットロスの有無**（信頼性の低い trial のフィルタリング用）
- **A/B 直接比較投票**（全会話終了後）

---

## 評価プロトコル

各ワーカーが行うこと：

- モデルごとに2回の会話（各約2分間）
- 各会話後：FD-DMOS 4次元評価 + 成功/失敗 + パケットロス確認
- 全会話終了後：A/B 直接比較投票

パケットロスありの trial はリーダーボードのスコア計算から除外されます。

---

## スコアリング

```
SuccessRate  = 成功した会話数 / 総会話数
AverageScore = mean(FD-DMOS 4指標) を 0〜1 に正規化
TotalScore   = 0.5 * SuccessRate + 0.5 * AverageScore
```

---

## システムアーキテクチャ

```
ワーカーのブラウザ
↓
SpeechArena Web (Next.js on Vercel)
↓ (会話タブにリダイレクト)
Moshi サーバー (GPU) -- Cloudflare Tunnel で HTTPS 公開
```

---

## 技術スタック

- Next.js 16 (App Router) + React 19
- Prisma 7 + Supabase PostgreSQL
- Moshi (`uv run -m moshi.server`)
- Cloudflare Tunnel (HTTPS 公開)
- Vercel (デプロイ)
- GPU 推論 (RTX 3090 x2、同時2モデル)

---

## モノレポ構成

```
speech-arena/
├── README.md / README_ja.md
├── apps/
│   └── web/              # Next.js (App Router) + Prisma
├── client/
│   └── dist/             # Moshi Web UI 静的ファイル
└── scripts/              # 自動化スクリプト（起動/停止）
```

---

## クイックスタート

```bash
git clone https://github.com/kobas-lab/speech-arena.git
cd speech-arena/apps/web
npm install
cp .env.example .env  # DATABASE_URL, DIRECT_URL を設定
npx prisma migrate dev
npm run dev
```

---

## セットアップガイド

### 1) データベースのセットアップ

`apps/web/.env` を作成：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/DBNAME?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
```

マイグレーションの実行：

```bash
npx prisma migrate dev
```

### 2) Moshi サーバーの起動 (GPU 側)

自動化スクリプトで起動：

```bash
# ラウンド1: v1 vs v1.1b
./scripts/start-arena.sh

# ラウンド2: v1.1c vs v1.1d
./scripts/stop-arena.sh
./scripts/start-arena-round2.sh

# 停止
./scripts/stop-arena.sh
```

手動で起動する場合：

```bash
# GPU 0
CUDA_VISIBLE_DEVICES=0 uv run -m moshi.server \
  --hf-repo abePclWaseda/llm-jp-moshi-v1 \
  --port 8998 --static client/dist

# GPU 1
CUDA_VISIBLE_DEVICES=1 uv run -m moshi.server \
  --hf-repo abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo \
  --port 8999 --static client/dist
```

### 3) Cloudflare Tunnel で公開

```bash
cloudflared tunnel --url http://localhost:8998
cloudflared tunnel --url http://localhost:8999
```

発行された URL を DB に登録（`start-arena.sh` では自動実行）：

```bash
MODEL_A_URL="https://xxx.trycloudflare.com" \
MODEL_B_URL="https://yyy.trycloudflare.com" \
npx tsx prisma/seed.ts
```

### 4) Vercel へのデプロイ

`apps/web` を Vercel プロジェクトのルートとしてデプロイ（モノレポ設定）。

Vercel ダッシュボードで環境変数を設定：

- `DATABASE_URL`
- `DIRECT_URL`

---

## 対象モデル

| ID | HuggingFace | 概要 |
|---|---|---|
| v1 | [llm-jp-moshi-v1](https://huggingface.co/abePclWaseda/llm-jp-moshi-v1) | ベースライン (J-CHAT → Zoom1) |
| v1.1b | [llm-jp-moshi-v1.1-vb-pseudo](https://huggingface.co/abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo) | VB + 合成データ |
| v1.1c | [llm-jp-moshi-v1.1-all-staged](https://huggingface.co/abePclWaseda/llm-jp-moshi-v1.1-all-staged) | 全部盛りステージ学習 |
| v1.1d | [llm-jp-moshi-v1.1-all-mixed](https://huggingface.co/abePclWaseda/llm-jp-moshi-v1.1-all-mixed) | 全データ混合学習 |

---

## ロードマップ

- [ ] Cloudflare 固定ドメイン
- [ ] Bradley-Terry / Elo ランキング
- [ ] 自動会話成功判定
- [ ] 音声録音（サーバーサイド）
- [ ] ターンテイキングメトリクス
- [ ] マルチモデルトーナメント

---

## ライセンス

MIT (TBD)

---

## 著者

- Your Name
- Your Lab / Institution
