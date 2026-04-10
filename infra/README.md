# SpeechArena AWS Infrastructure

## 概要

SpeechArena の AWS インフラを Terraform で管理しています。

---

## 現在のアーキテクチャ

```
ワーカー → Vercel (Next.js) → API Gateway (ap-northeast-1)
                                    ↓
                               Lambda (orchestrator)
                                    ↓ 非同期で GPU 起動
                               EC2 Spot GPU (us-east-1)
                                    ↓ docker run moshi.server
                               HuggingFace からモデル DL
                                    ↓
                               DynamoDB "running" + パブリック IP
                                    ↓
ワーカー ← Vercel がポーリング ← GET /sessions/{id}
    ↓
別タブで http://{IP}:8998 (Moshi Web UI) にアクセス
```

### フロントエンド
- **Vercel** で Next.js をホスティング（Amplify は DB 接続問題で未使用）
- GPU_API_ENDPOINT 環境変数で API Gateway に接続

### GPU 起動フロー
1. ワーカーが「評価を開始する」→ `POST /api/matchups` → `POST /sessions`（API Gateway）
2. Lambda が非同期で EC2 Spot GPU を起動（東京 → us-east-1 → ソウルの順にフォールバック）
3. EC2 user data で Docker pull → HuggingFace からモデル DL → moshi.server 起動
4. moshi.server が HTTP 200 を返すまでヘルスチェック → DynamoDB を `running` に更新
5. フロント側が `GET /sessions/{id}` をポーリング → `running` になったら別タブで Moshi UI を開く

### GPU 自動停止
- **cleanup Lambda**: 5分ごと実行。`startedAt` から45分経過したセッションを terminate
- **user data 安全装置**: 起動から60分後に自動 terminate

---

## リソース一覧

> 全て **ap-northeast-1（東京）** にデプロイ。GPU インスタンスのみ **us-east-1（バージニア）** で起動。

| リソース | 名前 / 値 | 用途 | コンソール確認場所 |
|---|---|---|---|
| S3 | `speech-arena-audio` | 対話音声データ / モデルキャッシュ（将来） | S3 → バケット |
| S3 | `speech-arena-tfstate` | Terraform state（手動作成） | S3 → バケット |
| ECR (東京) | `speech-arena/moshi-server` | Docker イメージ | ECR → リポジトリ |
| ECR (us-east-1) | `speech-arena/moshi-server` | Docker イメージ（手動作成） | ECR → リポジトリ (us-east-1) |
| DynamoDB | `speech-arena-sessions` | GPU セッション管理 | DynamoDB → テーブル |
| API Gateway | `https://k26y8y9e18.execute-api.ap-northeast-1.amazonaws.com` | HTTP API | API Gateway → API |
| Lambda | `speech-arena-orchestrator` | GPU 起動・セッション管理 | Lambda → 関数 |
| Lambda | `speech-arena-cleanup` | アイドル GPU 自動停止（5分ごと） | Lambda → 関数 |
| EC2 Launch Template | `speech-arena-gpu` | GPU Spot インスタンスのテンプレート | EC2 → 起動テンプレート |
| Security Group | `sg-04ee8ae84063f7c3d` | GPU インスタンス用（8998, 8999, 22） | EC2 → セキュリティグループ |
| IAM ロール | `speech-arena-lambda-orchestrator` | Lambda 用 | IAM → ロール |
| IAM ロール | `speech-arena-gpu-instance` | GPU EC2 用 | IAM → ロール |
| Amplify | `d3375p3p2zjl90.amplifyapp.com` | 未使用（DB 接続問題） | Amplify → アプリケーション |
| SSH Key | `speech-arena-gpu` | GPU インスタンスのデバッグ用 | EC2 → キーペア (us-east-1) |

---

## GPU インスタンスの制約と選択

| インスタンス | GPU | VRAM | RAM | vCPU | Moshi 動作 | 備考 |
|---|---|---|---|---|---|---|
| **g5.xlarge** | A10G | 24GB | 32GB | 4 | **OK** | 最適。2台で vCPU 8 |
| g5.2xlarge | A10G | 24GB | 32GB | 8 | OK | 1台で vCPU 上限いっぱい |
| g6.xlarge | L4 | 24GB | **16GB** | 4 | **NG** | RAM 不足で mmap 失敗 |
| g6e.xlarge | L4 | 24GB | 32GB | 4 | OK | Spot 価格が高い（$0.8-1.1） |

### vCPU 上限
- 現在の上限: **8 vCPU**（"All G and VT Spot Instance Requests"）
- g5.xlarge × 2台 = 8 vCPU → 上限引き上げ申請中（32 vCPU へ）

### フォールバック順序
1. 東京 Spot: g5.xlarge → g5.2xlarge → g6.xlarge（各3 AZ）
2. 東京 OnDemand: g5.xlarge（各3 AZ）
3. **us-east-1 Spot**: g5.xlarge → g6e.xlarge → g5.2xlarge（各6 AZ）
4. ソウル Spot: g5.xlarge（各4 AZ）

---

## 既知の問題

| 問題 | 原因 | 状態 |
|---|---|---|
| moshi.server 起動に10-15分 | HuggingFace からの毎回 15GB DL | S3 キャッシュは fp32 問題で一旦取り消し |
| g6.xlarge でメモリ不足 | RAM 16GB で fp32 30GB モデルを mmap 不可 | g5 系を優先するよう修正済み |
| 2台同時起動できない場合がある | vCPU 上限 8 + g5 在庫不足 | 上限引き上げ申請中 |
| Amplify で DB 接続エラー | PrismaPg アダプターが Amplify SSR で動かない | Vercel にフォールバック |
| GPU Spot 在庫不足 | 東京リージョンは慢性的に不足 | us-east-1 フォールバックで対応 |

### 起動時間の改善案（未実装）
- モデルを Docker イメージに含める（イメージサイズ増大）
- S3 キャッシュ + `--half` オプション（fp16 でロード）
- EBS スナップショットにモデルをプリロード

---

## AWS アカウント情報

| 項目 | 値 |
|---|---|
| アカウント ID | 518024472814 |
| リージョン | ap-northeast-1 (東京) / us-east-1 (バージニア) |
| コンソール URL | https://518024472814.signin.aws.amazon.com/console |

---

## ディレクトリ構成

```
infra/
├── main.tf              # プロバイダ、バックエンド (S3)
├── variables.tf         # 変数定義
├── s3.tf                # S3 バケット
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
├── amplify.tf           # Amplify Hosting（未使用）
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

# Lambda コードの更新
cd lambda && zip orchestrator.zip orchestrator.py && cd ..
terraform apply

# リソースの確認
terraform output

# 実行中の GPU インスタンスを確認
aws ec2 describe-instances --region us-east-1 --filters Name=instance-state-name,Values=running --query 'Reservations[*].Instances[*].{Id:InstanceId,IP:PublicIpAddress,Type:InstanceType}' --output table

# GPU インスタンスを手動停止
aws ec2 terminate-instances --region us-east-1 --instance-ids <instance-id>

# DynamoDB セッションを全削除
aws dynamodb scan --table-name speech-arena-sessions --query 'Items[*].sessionId.S' --output text | tr '\t' '\n' | while read id; do aws dynamodb delete-item --table-name speech-arena-sessions --key "{\"sessionId\":{\"S\":\"$id\"}}"; done
```

### terraform.tfvars（要作成、Git 管理外）

```hcl
hf_token           = "hf_xxxxx"
github_oauth_token = "ghp_xxxxx"
database_url       = "postgresql://..."
direct_url         = "postgresql://..."
```

---

## コスト

| リソース | 課金 | 備考 |
|---|---|---|
| S3 | データ量に応じて | モデルキャッシュ 90GB で ~$2/月 |
| ECR | イメージサイズに応じて | ~$0.10/月 |
| DynamoDB | リクエスト量に応じて | ほぼ $0 |
| Lambda | ほぼ無料 | 月100万リクエスト無料枠 |
| API Gateway | ほぼ無料 | 月100万リクエスト無料枠 |
| CloudWatch | ほぼ無料 | ログ保持14日 |
| **EC2 Spot GPU** | **$0.36-1.06/h** | **起動中のみ。g5.xlarge ~$0.50、g6e ~$1.0** |

**GPU が動いていなければ月数ドル程度。GPU が最大のコスト要因。**

---

## 今後の計画

- [ ] vCPU 上限引き上げ承認待ち（8 → 32）
- [ ] 起動時間の短縮（S3 キャッシュ or Docker イメージにモデル含める）
- [ ] HTTPS 対応（Cloudflare Tunnel or ALB）
- [ ] フロント統合（別タブ方式から1画面方式へ）
- [ ] 音声録音（moshi.server → S3 保存）

詳細: https://github.com/kobas-lab/speech-arena/issues/11
