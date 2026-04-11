# SpeechArena インフラ構成の設計判断

## 前提

SpeechArena は 6 つの Moshi モデルのうち、ランダムに選ばれた 2 モデルをワーカーに順番に試してもらい、A/B 比較評価を行うアプリケーション。

### 要件
- 1 セッション = 2 モデル同時起動（ポート 8998, 8999）
- 各モデルは moshi.server として Docker コンテナで動作
- 1 モデルあたり約 17GB VRAM（fp16）
- HTTPS 必須（AudioWorklet のブラウザ制限）
- ワーカーの待ち時間は 5 分以内が望ましい

---

## 実験で判明した制約

### GPU インスタンスの制約

| インスタンス | GPU | VRAM | RAM | 2モデル同時 | 備考 |
|---|---|---|---|---|---|
| g5.xlarge | A10G | 24GB | 32GB | NG | VRAM 不足 |
| g5.2xlarge | A10G | 24GB | 32GB | NG | VRAM は g5.xlarge と同じ |
| g6.xlarge | L4 | 24GB | 16GB | NG | RAM 不足で mmap 失敗 |
| **g6e.xlarge** | L4 | **46GB** | 32GB | **OK** (17GB×2=34GB) | 最適 |
| g6e.2xlarge | L4 | 46GB | 64GB | OK | g6e.xlarge と同じ GPU |

**結論**: g6e.xlarge が唯一 1 台で 2 モデル同時起動可能。

### リージョンの制約

| リージョン | GPU 在庫 | Spot GPU vCPU 上限 | オンデマンド GPU vCPU 上限 |
|---|---|---|---|
| ap-northeast-1 (東京) | 慢性的に不足 | **0** | 8 |
| **us-east-1 (バージニア)** | **比較的豊富** | 32 | 8 |
| ap-northeast-2 (ソウル) | 不安定 | — | — |

**結論**: us-east-1 を使用。東京は Spot GPU vCPU 上限 0 で使用不可。

### 起動時間の内訳

| 段階 | コールドスタート | ウォームスタート |
|---|---|---|
| EC2 起動 | ~1分 | ~1分 |
| Docker pull | ~2分 | 不要（コンテナ保持） |
| HuggingFace モデル DL | **~5-8分** | **不要（キャッシュ保持）** |
| モデルロード（GPU） | ~2-3分 | ~2-3分 |
| Cloudflare Tunnel | ~30秒 | — |
| **合計** | **~10-15分** | **~3-5分** |

### Spot vs オンデマンド

| | Spot | オンデマンド |
|---|---|---|
| コスト | ~$0.50/h | ~$1.00/h |
| Stop/Start | **非対応** | **対応** |
| ウォームプール | 不可 | 可能 |

**結論**: ウォームプールには オンデマンドが必須。Spot は Stop/Start で `IncorrectSpotRequestState` エラーになる。

### `--half` フラグ

HuggingFace のモデルは元々 fp16（15GB）なので `--half` は不要。`--half` を付けると逆に fp32→fp16 の変換が走り、g5.xlarge（RAM 32GB）でページングが発生して極端に遅くなる。

### Docker restart policy

| ポリシー | EC2 Stop/Start 後 |
|---|---|
| none | コンテナ再起動されない |
| unless-stopped | **再起動されない**（exit code 0 で正常終了扱い） |
| **always** | **再起動される** |

**結論**: `--restart always` が必須。

### EBS スナップショット

スナップショットから EBS を作成してモデルをプリロードする方式は、NVMe デバイス名の不一致やスナップショットの lazy loading 問題で不安定。HF キャッシュを Docker コンテナ内に保持する方式（`--restart always`）の方がシンプルで確実。

---

## 推奨構成

### 方式: g6e.xlarge 1 台 + ウォームプール

```
ワーカー → Vercel (Next.js)
              ↓ POST /api/matchups
         API Gateway → Lambda (orchestrator)
              ↓
         [ウォームプール] stopped の g6e.xlarge があれば Start
              ↓ なければコールドスタート
         EC2 g6e.xlarge (us-east-1, オンデマンド)
              ├── Docker: moshi-server-a (ポート 8998, Model A)
              ├── Docker: moshi-server-b (ポート 8999, Model B)
              └── Cloudflare Tunnel (HTTPS)
              ↓
         DynamoDB "running" + Tunnel URL
              ↓
ワーカー ← Vercel がポーリング
    ↓
別タブで https://xxx.trycloudflare.com (Moshi Web UI)
```

### フロー

1. ワーカーが「評価を開始する」→ matchup 作成（2 モデルランダム選択）
2. Lambda が **1 台の g6e.xlarge** を起動（ウォームスタート or コールドスタート）
3. EC2 上で **2 つの Docker コンテナ** を起動（ポート 8998, 8999）
4. Cloudflare Tunnel で HTTPS 化
5. フロントがポーリング → 準備完了 → 別タブで対話

### ウォームプールの動作

```
初回: コールドスタート（10-15分）
  ↓ 評価完了
EC2 Stop（Docker コンテナ + HF キャッシュ保持）
  ↓ 次のリクエスト
ウォームスタート: EC2 Start → Docker 自動再起動 → 3-5分
  ↓ 評価完了
EC2 Stop ...
```

### コスト

| リソース | 月額 |
|---|---|
| EC2 g6e.xlarge 待機中（stopped） | EBS 100GB × $0.08 = **~$8** |
| EC2 g6e.xlarge 使用中 | ~$1.00/h × 使用時間 |
| Lambda, API Gateway, DynamoDB | ほぼ $0 |
| Cloudflare Tunnel | $0 |
| ECR | ~$0.10 |
| **固定費（待機中）** | **~$8/月** |
| **1 セッション（30分）** | **~$0.50** |
| **月 100 セッション** | **~$58** |

### フォールバック

g6e.xlarge が取れない場合:
1. g6e.2xlarge を試行
2. g5.xlarge × 2 台方式にフォールバック（現在の実装）

---

## 未実装・今後の改善

### 1. 1 台 2 モデル方式の実装

現在は 2 台方式のまま。Lambda の `_launch_gpu` と user data を修正して、1 台の EC2 上で 2 つの Docker コンテナを起動する方式に変更する。

### 2. HTTPS (Cloudflare Tunnel) の改善

ウォームスタート時に Cloudflare Tunnel の URL が変わる問題がある。Lambda のヘルスチェックで HTTP IP を使っているが、フロントには HTTPS が必要。ウォームスタート時にも Tunnel を再起動する仕組みが必要。

### 3. cleanup Lambda の改善

- stopped インスタンスが増えすぎないように、古いものを terminate する
- ウォームプールの台数を制限する（最大 1 台）

### 4. 起動時間のさらなる短縮

- Docker イメージにモデルを含める（ECR サイズ増大だが DL 不要）
- EBS スナップショットの再挑戦（NVMe デバイス名の問題を解決）
- EC2 の AMI にモデルを焼き込む（カスタム AMI）

### 5. モニタリング

- CloudWatch ダッシュボードで GPU 使用状況を監視
- 起動失敗時のアラート
- コスト監視

---

## 実験ログ

### 試行した方式と結果

| 方式 | 結果 | 問題 |
|---|---|---|
| HuggingFace 毎回 DL | 動作 | 起動に 10-15 分 |
| S3 モデルキャッシュ | 失敗 | fp32 で mmap メモリ不足 |
| EBS スナップショット v1 (モデルファイル直接) | 失敗 | --moshi-weight で fp32 mmap 不足 |
| EBS スナップショット v2 (HF キャッシュ) | 失敗 | NVMe デバイス名不一致で mount 不可 |
| Spot + Stop/Start | 失敗 | IncorrectSpotRequestState |
| オンデマンド + Stop/Start | **成功** | |
| systemd 自動起動 | 失敗 | Stop 時にコンテナが消える |
| Docker --restart unless-stopped | 失敗 | exit code 0 で再起動されない |
| Docker --restart always | **成功** | HF キャッシュ保持 + 自動再起動 |
| --half フラグ | 不要 | モデルは元々 fp16、変換で遅くなる |
| g6.xlarge (RAM 16GB) | 失敗 | mmap メモリ不足 |
| g5.xlarge (RAM 32GB) | 動作 | fp32 変換時にページング発生で遅い |
| **g6e.xlarge (VRAM 46GB)** | **最適** | 2 モデル同時起動可能 |
