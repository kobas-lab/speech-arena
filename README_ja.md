# SpeechArena

SpeechArena は、リアルタイム音声対話モデルのための人間中心 A/B 評価プラットフォームです。

全二重（full-duplex）音声対話システムを、人間が実際に会話してペアワイズ比較できます。

評価項目：

- 会話成功率
- 人間による主観評価
- ペアワイズのモデル選好
- リアルタイム性の頑健さ

---

## モチベーション

リアルタイム音声対話システム（例：Moshi ベースのモデル）には以下の課題があります：

- セッション開始の失敗
- 会話の崩壊
- ターンテイキングの不安定性
- 遅延による品質劣化

SpeechArena は、オフラインやテキストベースのベンチマークではなく、実際のインタラクション環境でモデルを評価します。

---

## モノレポ構成

```
speech-arena/
├── README.md
├── README_ja.md
├── apps/
│   └── web/              # Next.js (App Router) + Prisma
├── services/
│   └── moshi/            # (任意) ゲートウェイ / プロキシ / ユーティリティ
└── scripts/              # (任意) 運用、データエクスポート、分析
```

> MVP: `apps/web` だけでも動きます。

---

## システムアーキテクチャ (MVP)

```
ワーカーのブラウザ
↓
SpeechArena Web (Next.js)
↓ (接続)
Moshi サーバー (GPU)  -- Cloudflare Tunnel で HTTPS 公開
```

- モデルは `uv run -m moshi.server` で起動
- GPU 推論の実行環境：
  - 研究室 GPU サーバー
  - ABCI（学習用）
- SpeechArena の役割：
  - モデルの割り当て
  - 試行の追跡
  - 評価の収集
  - ペアワイズランキング

---

## 評価プロトコル (MVP)

各ワーカーが行うこと：

- モデルごとに5回の会話
- 各会話：約2分間
- 各会話後の評価：
  - 会話の成功/失敗
  - 自然さ (1〜5)
  - 音声品質 (1〜5)

全会話終了後：

- A/B 直接比較投票

会話の失敗もスコアリングに含まれます。

---

## スコアリング (現在の MVP)

各モデルについて：

```
SuccessRate  = 成功した会話数 / 総会話数
AverageScore = mean(自然さ, 音声品質)   # 必要に応じて 0〜1 に正規化
TotalScore   = 0.5 * SuccessRate + 0.5 * AverageScore
```

ペアワイズの勝率も計算されます。

将来的に導入予定：

- Bradley-Terry ランキング
- Elo レーティング
- 安定性を考慮したスコアリング
- 自動的な会話成功判定

---

## 技術スタック

- Next.js (App Router)
- Prisma + PostgreSQL
- Moshi (`uv run -m moshi.server`)
- Cloudflare Tunnel (HTTPS 公開)
- GPU 推論 (24GB+ VRAM 推奨)

---

# セットアップガイド (MVP)

## 0) 前提条件

- Node.js (推奨: Node 20 LTS)
- PostgreSQL (ローカルまたはホスティング)
- Moshi サーバー用の Python 環境 (GPU 側)
- `cloudflared` (GPU 側)

---

## 1) リポジトリのクローン

```bash
git clone https://github.com/kobas-lab/speech-arena.git
cd speech-arena
```

---

## 2) 依存関係のインストール

```bash
cd apps/web
npm install
```

---

## 3) データベースのセットアップ (Prisma)

`apps/web/.env` を作成：

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:6543/DBNAME?pgbouncer=true"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/DBNAME"
```

マイグレーションの実行：

```bash
npx prisma migrate dev
```

---

## 4) Moshi サーバーの起動 (GPU 側)

例：

```bash
# モデル A
uv run -m moshi.server --model-path /path/to/model_A --port 8998

# モデル B
uv run -m moshi.server --model-path /path/to/model_B --port 8999
```

---

## 5) Cloudflare Tunnel で Moshi を公開 (GPU 側)

### cloudflared のインストール (sudo 不要)

```bash
mkdir -p $HOME/bin
cd $HOME/bin
curl -L -o cloudflared https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared
export PATH="$HOME/bin:$PATH"
```

### トンネルの起動

```bash
cloudflared tunnel --url http://localhost:8998
cloudflared tunnel --url http://localhost:8999
```

以下のような HTTPS URL が発行されます：

```
https://xxxxx.trycloudflare.com
https://yyyyy.trycloudflare.com
```

`apps/web/.env`（または Vercel の環境変数）に設定してください。

---

## 6) Web アプリのローカル起動

```bash
cd apps/web
npm run dev
```

ブラウザで開く：

```
http://localhost:3000
```

---

## 7) Vercel へのデプロイ

`apps/web` を Vercel プロジェクトのルートとしてデプロイ（モノレポ設定）。

Vercel ダッシュボードで環境変数を設定：

- `DATABASE_URL`
- `DIRECT_URL`

---

# 制限事項 (MVP)

- 会話の成功/失敗は手動判定
- 自動的なレイテンシ測定なし
- ターンテイキングのログなし
- 同時セッション数が限定的（GPU 制約）
- Cloudflare URL は一時的（設定しない限り）

---

# ロードマップ

- [ ] Cloudflare 固定ドメイン
- [ ] WebRTC 統合
- [ ] 自動会話成功判定
- [ ] ターンテイキングメトリクス
- [ ] Bradley-Terry ランキング
- [ ] 公開リーダーボード
- [ ] マルチモデルトーナメント

---

# 研究目標

SpeechArena は以下の標準ベンチマークとなることを目指しています：

- リアルタイム音声対話システム
- 全二重会話 AI
- 安定性を考慮した評価
- 人間中心のモデルランキング

---

# ライセンス

MIT (TBD)

---

# 著者

- Your Name
- Your Lab / Institution
