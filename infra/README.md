# SpeechArena AWS Infrastructure

## 概要

SpeechArena の AWS インフラを Terraform で管理しています。

---

## リソース一覧

### Phase 1: データ基盤

| リソース | 名前 | 用途 | コンソール確認場所 |
|---|---|---|---|
| S3 バケット | `speech-arena-audio` | 対話音声データの保存 | S3 → バケット |
| S3 バケット | `speech-arena-tfstate` | Terraform state の保存（手動作成） | S3 → バケット |
| ECR リポジトリ | `speech-arena/moshi-server` | moshi.server Docker イメージ | ECR → リポジトリ |
| DynamoDB テーブル | `speech-arena-sessions` | セッション管理 | DynamoDB → テーブル |
| IAM ロール | `speech-arena-lambda-orchestrator` | Lambda オーケストレーター用 | IAM → ロール |
| IAM ロール | `speech-arena-gpu-instance` | GPU EC2 インスタンス用 | IAM → ロール |
| IAM インスタンスプロファイル | `speech-arena-gpu-instance` | EC2 にロールを付与 | IAM → ロール |

### Phase 2: コンピュート & フロントエンド

| リソース | 名前 / 値 | 用途 | コンソール確認場所 |
|---|---|---|---|
| Amplify | `d3375p3p2zjl90.amplifyapp.com` | Next.js フロントエンドホスティング | Amplify → アプリケーション |
| API Gateway | `https://k26y8y9e18.execute-api.ap-northeast-1.amazonaws.com` | Lambda へのHTTPエンドポイント | API Gateway → API |
| Lambda | `speech-arena-orchestrator` | セッション開始・GPU 起動 | Lambda → 関数 |
| Lambda | `speech-arena-cleanup` | アイドル GPU の自動停止（5分ごと） | Lambda → 関数 |
| EC2 Launch Template | `speech-arena-gpu` | g5.xlarge Spot GPU インスタンス | EC2 → 起動テンプレート |
| Security Group | `sg-04ee8ae84063f7c3d` | Moshi WebSocket (8998, 8999) + SSH (22) | EC2 → セキュリティグループ |
| CloudWatch Log Group | `/aws/lambda/speech-arena-orchestrator` | Lambda ログ（14日保持） | CloudWatch → ロググループ |
| CloudWatch Log Group | `/aws/lambda/speech-arena-cleanup` | Lambda ログ（14日保持） | CloudWatch → ロググループ |
| CloudWatch Event Rule | `speech-arena-cleanup-schedule` | 5分ごとに cleanup Lambda を実行 | CloudWatch → ルール |

> **注意**: 全てリージョン **ap-northeast-1（東京）** で作成されています。コンソールで別のリージョンが選択されていると表示されません。

---

## リソース詳細

### S3: speech-arena-audio

```
speech-arena-audio/
├── raw/{trialId}/        # セッション単位の音声ファイル (wav + metadata.json)
└── webdataset/           # 学習パイプライン用 (train-{000..N}.tar)
```

- サーバーサイド暗号化 (AES256)
- バージョニング有効
- パブリックアクセス完全ブロック
- `raw/` は90日後に Glacier に自動移行

### ECR: speech-arena/moshi-server

- moshi.server の Docker イメージを保存
- push 時に自動スキャン
- 古いイメージは10個を超えると自動削除
- イメージ URI: `518024472814.dkr.ecr.ap-northeast-1.amazonaws.com/speech-arena/moshi-server`

### DynamoDB: speech-arena-sessions

- オンデマンド課金（PAY_PER_REQUEST）
- パーティションキー: `sessionId` (String)
- GSI: `status-index`（ステータス別クエリ用）
- TTL: `expiresAt`（期限切れセッションの自動削除）

### Lambda: speech-arena-orchestrator

セッション開始時に GPU インスタンスを起動するオーケストレーター。

**API エンドポイント:**
- `POST /sessions` — GPU インスタンスを起動、セッション作成
- `GET /sessions/{sessionId}` — セッション状態を取得（フロントがポーリング）

**フロー:**
1. ワーカーが入室 → フロントが `POST /sessions` を呼ぶ
2. Lambda が EC2 Spot GPU を起動、DynamoDB に `status: "starting"` を記録
3. EC2 の user data が moshi.server を起動、DynamoDB を `status: "running"` に更新
4. フロントが `GET /sessions/{sessionId}` をポーリング → `running` になったら WebSocket 接続

### Lambda: speech-arena-cleanup

5分ごとに CloudWatch Event Rule で実行。DynamoDB の `status=running` セッションをチェックし、最終アクティビティから15分以上経過したものの GPU を自動停止。

### EC2 Launch Template: speech-arena-gpu

- インスタンスタイプ: `g5.xlarge`（A10G 24GB VRAM）
- 課金方式: Spot（最大 $0.50/h）
- AMI: Deep Learning Base AMI (Ubuntu 22.04, NVIDIA ドライバ入り)
- User data で自動セットアップ:
  1. nvidia-container-toolkit インストール
  2. ECR ログイン → Docker イメージ pull
  3. moshi.server コンテナ起動
  4. DynamoDB を `running` に更新
  5. 安全装置: 30分後に自動シャットダウン

### Security Group: speech-arena-gpu

| ポート | プロトコル | 用途 |
|---|---|---|
| 8998 | TCP | Moshi Model A WebSocket |
| 8999 | TCP | Moshi Model B WebSocket |
| 22 | TCP | SSH アクセス |
| 全ポート | 全プロトコル | アウトバウンド（全許可） |

### Amplify: speech-arena-web

- GitHub リポジトリ: `kobas-lab/speech-arena`
- ブランチ: `main`（自動デプロイ）
- アプリルート: `apps/web`
- フレームワーク: Next.js SSR
- 環境変数: `API_ENDPOINT` に API Gateway の URL を自動設定
- URL: `https://d3375p3p2zjl90.amplifyapp.com`

---

## IAM ロール

**Lambda オーケストレーター** (`speech-arena-lambda-orchestrator`):
- EC2 起動/停止/タグ付け/Spot リクエスト
- DynamoDB 読み書き
- CloudWatch Logs 書き込み
- GPU インスタンスロールの PassRole

**GPU インスタンス** (`speech-arena-gpu-instance`):
- ECR からイメージ pull
- S3 (`speech-arena-audio/*`) への読み書き
- DynamoDB 更新

---

## AWS アカウント情報

| 項目 | 値 |
|---|---|
| アカウント ID | 518024472814 |
| リージョン | ap-northeast-1 (東京) |
| コンソール URL | https://518024472814.signin.aws.amazon.com/console |

---

## ディレクトリ構成

```
infra/
├── main.tf              # プロバイダ、バックエンド (S3)
├── variables.tf         # 変数定義
├── s3.tf                # S3 バケット (音声データ)
├── ecr.tf               # ECR リポジトリ
├── dynamodb.tf          # DynamoDB テーブル
├── iam.tf               # IAM ロール・ポリシー
├── lambda.tf            # Lambda 関数 + CloudWatch スケジュール
├── lambda/
│   └── orchestrator.py  # Lambda 関数コード
├── api_gateway.tf       # HTTP API Gateway
├── ec2_gpu.tf           # Spot GPU ローンチテンプレート + セキュリティグループ
├── templates/
│   └── gpu_userdata.sh.tpl  # EC2 user data テンプレート
├── amplify.tf           # Amplify Hosting
├── outputs.tf           # 出力値
├── .gitignore           # tfstate, tfvars, zip 等を除外
├── .terraform.lock.hcl  # プロバイダのバージョンロック
└── README.md            # このファイル
```

---

## 使い方

### 前提条件

- AWS CLI 設定済み (`aws configure`)
- Terraform インストール済み

### コマンド

```bash
cd infra

# 初期化
terraform init

# 変更内容の確認
terraform plan

# デプロイ
terraform apply

# リソースの確認
terraform output

# Lambda コードの更新
cd lambda && zip orchestrator.zip orchestrator.py && cd ..
terraform apply

# リソースの削除（注意: GPU が動いていないことを確認）
terraform destroy
```

### terraform.tfvars（要作成、Git 管理外）

```hcl
hf_token           = "hf_xxxxx"
github_oauth_token = "ghp_xxxxx"
# ssh_key_name     = "my-key"        # オプション: GPU インスタンスに SSH する場合
# spot_max_price   = "0.50"          # オプション: Spot 最大価格
```

---

## コスト

| リソース | 課金 | 備考 |
|---|---|---|
| S3 | データ量に応じて | 空なら $0 |
| ECR | イメージサイズに応じて | 未 push なら $0 |
| DynamoDB | リクエスト量に応じて | 少量なら $0 |
| Lambda | ほぼ無料 | 月100万リクエスト無料枠 |
| API Gateway | ほぼ無料 | 月100万リクエスト無料枠 |
| Amplify | 配信量に応じて | 少量なら $0 |
| CloudWatch | ほぼ無料 | ログ保持14日 |
| **EC2 Spot GPU** | **~$0.36/h** | **起動している間だけ。最大の課金要因** |

**1評価セッション（30分）**: ~$0.18
**月100セッション**: ~$18 + 固定費 ~$1 = **~$19/月**

---

## 今後の計画

- [ ] Docker イメージを ECR に push
- [ ] E2E テスト（API Gateway → Lambda → EC2 GPU 起動）
- [ ] フロント統合（Next.js から API Gateway を呼び出し、1画面で対話→評価）
- [ ] 音声録音（moshi.server → S3 保存）

詳細: https://github.com/kobas-lab/speech-arena/issues/11
