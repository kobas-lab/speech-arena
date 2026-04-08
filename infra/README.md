# SpeechArena AWS Infrastructure

## 概要

SpeechArena の AWS インフラを Terraform で管理しています。

## 現在のリソース（Phase 1）

| リソース | 名前 | 用途 |
|---|---|---|
| S3 バケット | `speech-arena-audio` | 対話音声データの保存 |
| S3 バケット | `speech-arena-tfstate` | Terraform state の保存（手動作成） |
| ECR リポジトリ | `speech-arena/moshi-server` | moshi.server Docker イメージ |
| DynamoDB テーブル | `speech-arena-sessions` | セッション管理 |
| IAM ロール | `speech-arena-lambda-orchestrator` | Lambda オーケストレーター用 |
| IAM ロール | `speech-arena-gpu-instance` | GPU EC2 インスタンス用 |
| IAM インスタンスプロファイル | `speech-arena-gpu-instance` | EC2 にロールを付与 |

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

### DynamoDB: speech-arena-sessions

- オンデマンド課金（PAY_PER_REQUEST）
- パーティションキー: `sessionId` (String)
- GSI: `status-index`（ステータス別クエリ用）
- TTL: `expiresAt`（期限切れセッションの自動削除）

### IAM ロール

**Lambda オーケストレーター** (`speech-arena-lambda-orchestrator`):
- EC2 起動/停止/タグ付け
- DynamoDB 読み書き
- CloudWatch Logs 書き込み
- GPU インスタンスロールの PassRole

**GPU インスタンス** (`speech-arena-gpu-instance`):
- ECR からイメージ pull
- S3 (`speech-arena-audio/*`) への読み書き
- DynamoDB 更新

## AWS アカウント情報

| 項目 | 値 |
|---|---|
| アカウント ID | 518024472814 |
| リージョン | ap-northeast-1 (東京) |
| コンソール URL | https://518024472814.signin.aws.amazon.com/console |

## ディレクトリ構成

```
infra/
├── main.tf              # プロバイダ、バックエンド (S3)
├── variables.tf         # 変数定義
├── s3.tf                # S3 バケット (音声データ)
├── ecr.tf               # ECR リポジトリ
├── dynamodb.tf          # DynamoDB テーブル
├── iam.tf               # IAM ロール・ポリシー
├── outputs.tf           # 出力値
├── .gitignore           # tfstate, tfvars 等を除外
├── .terraform.lock.hcl  # プロバイダのバージョンロック
└── README.md            # このファイル
```

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

# リソースの削除（注意）
terraform destroy
```

### terraform.tfvars（要作成、Git 管理外）

```hcl
hf_token = "hf_xxxxx"
```

## 今後の計画（Phase 2）

- [ ] `lambda.tf` — オーケストレーター Lambda
- [ ] `api_gateway.tf` — API Gateway
- [ ] `ec2_gpu.tf` — Spot GPU 起動テンプレート
- [ ] `amplify.tf` — Amplify Hosting

詳細: https://github.com/kobas-lab/speech-arena/issues/11
