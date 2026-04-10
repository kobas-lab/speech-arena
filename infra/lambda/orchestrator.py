import json
import os
import time
import decimal
import boto3
from datetime import datetime, timezone, timedelta


class DecimalEncoder(json.JSONEncoder):
    def default(self, o):
        if isinstance(o, decimal.Decimal):
            return int(o) if o == int(o) else float(o)
        return super().default(o)

ec2 = boto3.client("ec2")
dynamodb = boto3.resource("dynamodb")

# フォールバックリージョン（優先順）
FALLBACK_REGIONS = ["us-east-1", "ap-northeast-2"]

TABLE_NAME = os.environ["DYNAMODB_TABLE"]
LAUNCH_TEMPLATE_ID = os.environ["LAUNCH_TEMPLATE_ID"]
SUBNET_IDS = os.environ["SUBNET_IDS"].split(",")
SESSION_TIMEOUT_MINUTES = int(os.environ.get("SESSION_TIMEOUT_MINUTES", "15"))
SECURITY_GROUP_GPU_ID = os.environ.get("SECURITY_GROUP_GPU_ID", "")

table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """API Gateway から呼ばれるメインハンドラ（非同期起動もここで処理）"""

    # 非同期で呼ばれた GPU 起動処理
    if event.get("_async_launch"):
        return _launch_gpu(event)

    method = event.get("requestContext", {}).get("http", {}).get("method", "")
    path = event.get("rawPath", "")

    if method == "POST" and "/sessions" in path:
        return start_session(event, context)
    elif method == "GET" and "/sessions/" in path:
        session_id = path.split("/sessions/")[-1]
        return get_session(session_id)
    else:
        return response(404, {"error": "Not found"})


def _launch_gpu(event):
    """非同期で呼ばれる GPU 起動処理（タイムアウト制限なし）"""
    session_id = event["sessionId"]
    model_repo = event["modelRepo"]
    moshi_port = event["port"]
    instance_types = os.environ.get("INSTANCE_TYPES", "g5.xlarge,g5.2xlarge,g6.xlarge").split(",")

    run_response = None
    last_error = None
    for instance_type in instance_types:
        for subnet_id in SUBNET_IDS:
            try:
                run_response = ec2.run_instances(
                    LaunchTemplate={"LaunchTemplateId": LAUNCH_TEMPLATE_ID},
                    MinCount=1,
                    MaxCount=1,
                    SubnetId=subnet_id,
                    InstanceType=instance_type,
                    TagSpecifications=[
                        {
                            "ResourceType": "instance",
                            "Tags": [
                                {"Key": "Name", "Value": f"speech-arena-gpu-{session_id}"},
                                {"Key": "SessionId", "Value": session_id},
                                {"Key": "Project", "Value": "speech-arena"},
                            ],
                        }
                    ],
                    UserData=_build_userdata_override(session_id, model_repo, moshi_port),
                )
                print(f"Success: {instance_type} in {subnet_id}")
                break
            except Exception as e:
                last_error = e
                print(f"{instance_type} in {subnet_id} failed: {e}")
                continue
        if run_response:
            break

    # Spot が全滅 → オンデマンドフォールバック
    if run_response is None:
        print("All Spot attempts failed. Trying on-demand fallback...")
        for subnet_id in SUBNET_IDS:
            try:
                run_response = ec2.run_instances(
                    LaunchTemplate={"LaunchTemplateId": LAUNCH_TEMPLATE_ID},
                    MinCount=1,
                    MaxCount=1,
                    SubnetId=subnet_id,
                    InstanceType=instance_types[0],  # g5.xlarge
                    InstanceMarketOptions={},  # オンデマンド（Spot 指定を上書き）
                    TagSpecifications=[
                        {
                            "ResourceType": "instance",
                            "Tags": [
                                {"Key": "Name", "Value": f"speech-arena-gpu-{session_id}"},
                                {"Key": "SessionId", "Value": session_id},
                                {"Key": "Project", "Value": "speech-arena"},
                                {"Key": "PricingModel", "Value": "on-demand"},
                            ],
                        }
                    ],
                    UserData=_build_userdata_override(session_id, model_repo, moshi_port),
                )
                print(f"On-demand success: {instance_types[0]} in {subnet_id}")
                break
            except Exception as e:
                last_error = e
                print(f"On-demand {instance_types[0]} in {subnet_id} failed: {e}")
                continue

    # 東京が全滅 → フォールバックリージョンを順に試行
    if run_response is None:
        for fallback_region in FALLBACK_REGIONS:
            run_response, launched_region = _try_remote_region(
                fallback_region, session_id, model_repo, moshi_port
            )
            if run_response:
                instance_id = run_response["Instances"][0]["InstanceId"]
                table.update_item(
                    Key={"sessionId": session_id},
                    UpdateExpression="SET instanceId = :iid, #r = :r",
                    ExpressionAttributeNames={"#r": "region"},
                    ExpressionAttributeValues={":iid": instance_id, ":r": launched_region},
                )
                return {"instanceId": instance_id, "region": launched_region}
            continue

    if run_response is None:
        table.update_item(
            Key={"sessionId": session_id},
            UpdateExpression="SET #s = :s, errorMessage = :e",
            ExpressionAttributeNames={"#s": "status"},
            ExpressionAttributeValues={":s": "failed", ":e": str(last_error)},
        )
        return {"error": str(last_error)}

    instance_id = run_response["Instances"][0]["InstanceId"]
    table.update_item(
        Key={"sessionId": session_id},
        UpdateExpression="SET instanceId = :iid",
        ExpressionAttributeValues={":iid": instance_id},
    )
    return {"instanceId": instance_id}


def start_session(event, context):
    """GPU インスタンスを起動してセッションを作成"""
    body = json.loads(event.get("body", "{}"))
    model_repo = body.get("modelRepo", "abePclWaseda/llm-jp-moshi-v1")
    moshi_port = body.get("port", 8998)

    session_id = f"sess-{int(time.time() * 1000)}"
    expires_at = int((datetime.now(timezone.utc) + timedelta(hours=2)).timestamp())

    # DynamoDB にセッションを作成
    table.put_item(Item={
        "sessionId": session_id,
        "status": "starting",
        "modelRepo": model_repo,
        "port": moshi_port,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "expiresAt": expires_at,
    })

    # Lambda を非同期で呼び出して GPU 起動（API Gateway の30秒制限を回避）
    lambda_client = boto3.client("lambda")
    lambda_client.invoke(
        FunctionName=os.environ.get("LAUNCH_FUNCTION_NAME", context.function_name),
        InvocationType="Event",  # 非同期
        Payload=json.dumps({
            "_async_launch": True,
            "sessionId": session_id,
            "modelRepo": model_repo,
            "port": moshi_port,
        }),
    )

    return response(201, {
        "sessionId": session_id,
        "status": "starting",
    })


def get_session(session_id):
    """セッションの状態を返す（フロントがポーリング）"""
    result = table.get_item(Key={"sessionId": session_id})
    item = result.get("Item")

    if not item:
        return response(404, {"error": "Session not found"})

    public_ip = item.get("publicIp", "")
    # Tunnel URL (https://...) の場合はそのまま返す
    if public_ip and public_ip.startswith("http"):
        endpoint_url = public_ip
    elif public_ip:
        endpoint_url = f"http://{public_ip}:{item.get('port', 8998)}"
    else:
        endpoint_url = None

    return response(200, {
        "sessionId": item["sessionId"],
        "status": item.get("status", "unknown"),
        "publicIp": public_ip,
        "port": item.get("port", 8998),
        "endpointUrl": endpoint_url,
    })


def cleanup_handler(event, context):
    """定期実行: タイムアウトしたセッションの GPU を停止"""
    threshold = datetime.now(timezone.utc) - timedelta(minutes=SESSION_TIMEOUT_MINUTES)

    # status=running のセッションを取得
    result = table.query(
        IndexName="status-index",
        KeyConditionExpression=boto3.dynamodb.conditions.Key("status").eq("running"),
    )

    terminated = 0
    for item in result.get("Items", []):
        last_activity = item.get("lastActivityAt", item.get("startedAt", ""))
        if not last_activity:
            continue

        try:
            last_time = datetime.fromisoformat(last_activity.replace("Z", "+00:00"))
        except (ValueError, TypeError):
            continue

        if last_time < threshold:
            instance_id = item.get("instanceId")
            if instance_id:
                try:
                    region = item.get("region", "ap-northeast-1")
                    ec2_client = ec2 if region == "ap-northeast-1" else boto3.client("ec2", region_name=region)
                    ec2_client.terminate_instances(InstanceIds=[instance_id])
                    table.update_item(
                        Key={"sessionId": item["sessionId"]},
                        UpdateExpression="SET #s = :s, terminatedAt = :t",
                        ExpressionAttributeNames={"#s": "status"},
                        ExpressionAttributeValues={
                            ":s": "terminated",
                            ":t": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                    terminated += 1
                except Exception as e:
                    print(f"Failed to terminate {instance_id}: {e}")

    return {"terminated": terminated}


def _try_remote_region(region, session_id, model_repo, moshi_port):
    """リモートリージョンで GPU 起動を試行"""
    print(f"Trying region {region}...")
    remote_ec2 = boto3.client("ec2", region_name=region)

    # デフォルト VPC のサブネットを取得
    try:
        vpcs = remote_ec2.describe_vpcs(Filters=[{"Name": "isDefault", "Values": ["true"]}])
        if not vpcs["Vpcs"]:
            print(f"No default VPC in {region}")
            return None, None
        vpc_id = vpcs["Vpcs"][0]["VpcId"]

        subnets = remote_ec2.describe_subnets(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])
        subnet_ids = [s["SubnetId"] for s in subnets["Subnets"]]
    except Exception as e:
        print(f"Failed to get {region} subnets: {e}")
        return None, None

    # セキュリティグループを作成（または既存を取得）
    sg_name = f"speech-arena-gpu-{region}"
    try:
        sg_result = remote_ec2.describe_security_groups(
            Filters=[{"Name": "group-name", "Values": [sg_name]}]
        )
        if sg_result["SecurityGroups"]:
            sg_id = sg_result["SecurityGroups"][0]["GroupId"]
        else:
            sg = remote_ec2.create_security_group(
                GroupName=sg_name,
                Description=f"SpeechArena GPU instances ({region})",
                VpcId=vpc_id,
            )
            sg_id = sg["GroupId"]
            remote_ec2.authorize_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=[
                    {"IpProtocol": "tcp", "FromPort": 8998, "ToPort": 8999,
                     "IpRanges": [{"CidrIp": "0.0.0.0/0"}]},
                    {"IpProtocol": "tcp", "FromPort": 22, "ToPort": 22,
                     "IpRanges": [{"CidrIp": "0.0.0.0/0"}]},
                ],
            )
    except Exception as e:
        print(f"Failed to setup {region} SG: {e}")
        return None, None

    # Deep Learning AMI を取得
    try:
        ami_result = remote_ec2.describe_images(
            Owners=["amazon"],
            Filters=[
                {"Name": "name", "Values": ["Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 22.04) *"]},
                {"Name": "architecture", "Values": ["x86_64"]},
            ],
        )
        if not ami_result["Images"]:
            print(f"No Deep Learning AMI found in {region}")
            return None, None
        ami_id = sorted(ami_result["Images"], key=lambda x: x["CreationDate"], reverse=True)[0]["ImageId"]
    except Exception as e:
        print(f"Failed to get {region} AMI: {e}")
        return None, None

    # ECR リポジトリ URL（リージョンに合わせて変更）
    ecr_repo_url = f"518024472814.dkr.ecr.{region}.amazonaws.com/speech-arena/moshi-server"

    # 起動試行
    remote_instance_types = ["g5.xlarge", "g6e.xlarge", "g5.2xlarge"]
    for inst_type in remote_instance_types:
        for subnet_id in subnet_ids:
            try:
                run_response = remote_ec2.run_instances(
                    ImageId=ami_id,
                    InstanceType=inst_type,
                    MinCount=1,
                    MaxCount=1,
                    SubnetId=subnet_id,
                    SecurityGroupIds=[sg_id],
                    IamInstanceProfile={"Name": "speech-arena-gpu-instance"},
                    KeyName="speech-arena-gpu",
                    BlockDeviceMappings=[{
                        "DeviceName": "/dev/sda1",
                        "Ebs": {"VolumeSize": 100, "VolumeType": "gp3"},
                    }],
                    InstanceMarketOptions={
                        "MarketType": "spot",
                        "SpotOptions": {"SpotInstanceType": "one-time", "MaxPrice": "1.50"},
                    },
                    UserData=_build_userdata_override(
                        session_id, model_repo, moshi_port,
                        region=region, ecr_repo_url=ecr_repo_url,
                    ),
                    TagSpecifications=[
                        {
                            "ResourceType": "instance",
                            "Tags": [
                                {"Key": "Name", "Value": f"speech-arena-gpu-{session_id}"},
                                {"Key": "SessionId", "Value": session_id},
                                {"Key": "Project", "Value": "speech-arena"},
                                {"Key": "Region", "Value": region},
                            ],
                        }
                    ],
                )
                print(f"{region} success: {inst_type} in {subnet_id}")
                return run_response, region
            except Exception as e:
                print(f"{region} {inst_type} in {subnet_id} failed: {e}")
                continue

    return None, None


def _build_userdata_override(session_id, model_repo, port, region=None, ecr_repo_url=None):
    """user data スクリプトを生成（boto3 が自動で base64 エンコードするので生テキストを返す）"""
    hf_token = os.environ.get("HF_TOKEN", "")
    dynamodb_table = TABLE_NAME

    if region and ecr_repo_url:
        # リモートリージョン用: 完全な起動スクリプト
        script = f"""#!/bin/bash
set -euxo pipefail

ECR_REPO_URL="{ecr_repo_url}"
HF_TOKEN="{hf_token}"
SESSION_ID="{session_id}"
MODEL_REPO="{model_repo}"
MOSHI_PORT="{port}"

# IMDSv2
TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4)

# nvidia-container-toolkit
if ! command -v nvidia-container-runtime &> /dev/null; then
  curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
  curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \\
    sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | \\
    tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
  apt-get update && apt-get install -y nvidia-container-toolkit
  nvidia-ctk runtime configure --runtime=docker
  systemctl restart docker
fi

# ECR ログイン
aws ecr get-login-password --region {region} | docker login --username AWS --password-stdin $ECR_REPO_URL

# Docker pull
docker pull $ECR_REPO_URL:latest

# moshi.server を起動（HuggingFace からモデルダウンロード）
docker run -d --gpus all --name moshi-server \\
  -p $MOSHI_PORT:$MOSHI_PORT \\
  -e HF_TOKEN=$HF_TOKEN \\
  -e HUGGING_FACE_HUB_TOKEN=$HF_TOKEN \\
  $ECR_REPO_URL:latest \\
  uv run -m moshi.server --hf-repo $MODEL_REPO --port $MOSHI_PORT --host 0.0.0.0

# moshi.server が実際に listen するまで待つ（最大15分）
echo "Waiting for moshi.server to be ready..."
for i in $(seq 1 180); do
  if curl -s -o /dev/null -w '' http://localhost:$MOSHI_PORT 2>/dev/null; then
    echo "moshi.server is ready after ${{i}}0 seconds"
    break
  fi
  sleep 5
done

# Cloudflare Tunnel をインストール＆起動（HTTPS 化）
echo "Starting Cloudflare Tunnel..."
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
TUNNEL_LOG="/tmp/cloudflared.log"
cloudflared tunnel --url http://localhost:$MOSHI_PORT > $TUNNEL_LOG 2>&1 &
TUNNEL_PID=$!

# Tunnel URL を取得（最大30秒待機）
TUNNEL_URL=""
for i in $(seq 1 30); do
  TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\\.trycloudflare\\.com' $TUNNEL_LOG 2>/dev/null | head -1 || true)
  if [ -n "$TUNNEL_URL" ]; then
    echo "Tunnel URL: $TUNNEL_URL"
    break
  fi
  sleep 1
done
if [ -z "$TUNNEL_URL" ]; then
  echo "WARNING: Failed to get tunnel URL, using IP"
  TUNNEL_URL="http://$PUBLIC_IP:$MOSHI_PORT"
fi

# DynamoDB 更新（Tunnel URL を publicIp フィールドに保存）
aws dynamodb update-item \\
  --region ap-northeast-1 \\
  --table-name {dynamodb_table} \\
  --key '{{"sessionId": {{"S": "'$SESSION_ID'"}}}}'  \\
  --update-expression "SET #s = :s, publicIp = :ip, instanceId = :iid, startedAt = :t" \\
  --expression-attribute-names '{{"#s": "status"}}' \\
  --expression-attribute-values '{{":s": {{"S": "running"}}, ":ip": {{"S": "'$TUNNEL_URL'"}}, ":iid": {{"S": "'$INSTANCE_ID'"}}, ":t": {{"S": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}}}}'

# 安全装置: 30分後に自動シャットダウン
# 安全装置: 30分後に自動終了（terminate）
REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
(sleep 3600 && aws ec2 terminate-instances --region $REGION --instance-ids $INSTANCE_ID) &
"""
    else:
        # 東京用: Launch Template の user data を上書きする環境変数のみ
        script = f"""#!/bin/bash
export SESSION_ID="{session_id}"
export MODEL_REPO="{model_repo}"
export MOSHI_PORT="{port}"
"""
    return script


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body, cls=DecimalEncoder),
    }
