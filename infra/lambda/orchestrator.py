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

FALLBACK_REGIONS = ["us-east-1", "ap-northeast-2"]

TABLE_NAME = os.environ["DYNAMODB_TABLE"]
LAUNCH_TEMPLATE_ID = os.environ["LAUNCH_TEMPLATE_ID"]
SUBNET_IDS = os.environ["SUBNET_IDS"].split(",")
SESSION_TIMEOUT_MINUTES = int(os.environ.get("SESSION_TIMEOUT_MINUTES", "45"))
SECURITY_GROUP_GPU_ID = os.environ.get("SECURITY_GROUP_GPU_ID", "")

table = dynamodb.Table(TABLE_NAME)


def handler(event, context):
    """API Gateway から呼ばれるメインハンドラ（非同期起動もここで処理）"""
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
    """非同期で呼ばれる GPU 起動処理"""
    session_id = event["sessionId"]
    model_repo = event["modelRepo"]
    moshi_port = event["port"]

    # Step 1: 停止中のウォームプールインスタンスを探す
    for region in FALLBACK_REGIONS:
        result = _try_warm_start(region, session_id, model_repo, moshi_port)
        if result:
            return result

    # Step 2: ウォームプールがなければ新規作成（コールドスタート）
    for region in FALLBACK_REGIONS:
        run_response, launched_region = _try_cold_start(region, session_id, model_repo, moshi_port)
        if run_response:
            instance_id = run_response["Instances"][0]["InstanceId"]
            table.update_item(
                Key={"sessionId": session_id},
                UpdateExpression="SET instanceId = :iid, #r = :r",
                ExpressionAttributeNames={"#r": "region"},
                ExpressionAttributeValues={":iid": instance_id, ":r": launched_region},
            )
            return {"instanceId": instance_id, "region": launched_region}

    # 全て失敗
    table.update_item(
        Key={"sessionId": session_id},
        UpdateExpression="SET #s = :s, errorMessage = :e",
        ExpressionAttributeNames={"#s": "status"},
        ExpressionAttributeValues={":s": "failed", ":e": "No GPU capacity available"},
    )
    return {"error": "No GPU capacity available"}


def _try_warm_start(region, session_id, model_repo, moshi_port):
    """停止中の SpeechArena GPU インスタンスを再起動（ウォームスタート）
    Docker --restart always で自動的にコンテナが再起動するので、Start するだけ"""
    remote_ec2 = boto3.client("ec2", region_name=region)

    try:
        # 既に使用中のインスタンス ID を取得（同時起動で同じインスタンスを選ばないように）
        used_instances = set()
        try:
            sessions = table.query(
                IndexName="status-index",
                KeyConditionExpression=boto3.dynamodb.conditions.Key("status").eq("starting"),
            )
            for s in sessions.get("Items", []):
                iid = s.get("instanceId")
                if iid:
                    used_instances.add(iid)
            # running のインスタンスも除外
            running_sessions = table.query(
                IndexName="status-index",
                KeyConditionExpression=boto3.dynamodb.conditions.Key("status").eq("running"),
            )
            for s in running_sessions.get("Items", []):
                iid = s.get("instanceId")
                if iid:
                    used_instances.add(iid)
        except Exception:
            pass

        result = remote_ec2.describe_instances(
            Filters=[
                {"Name": "tag:Project", "Values": ["speech-arena"]},
                {"Name": "instance-state-name", "Values": ["stopped"]},
            ]
        )
        stopped = []
        for r in result.get("Reservations", []):
            for inst in r.get("Instances", []):
                if inst["InstanceId"] not in used_instances:
                    stopped.append(inst)

        if not stopped:
            return None

        instance = stopped[0]
        instance_id = instance["InstanceId"]
        print(f"Warm start: {instance_id} in {region}")

        # インスタンスを起動
        remote_ec2.start_instances(InstanceIds=[instance_id])

        # 起動完了を待つ
        remote_ec2.get_waiter("instance_running").wait(InstanceIds=[instance_id])

        # パブリック IP を取得
        desc = remote_ec2.describe_instances(InstanceIds=[instance_id])
        public_ip = desc["Reservations"][0]["Instances"][0].get("PublicIpAddress", "")

        # systemd が自動で moshi.server + cloudflared を起動するので、
        # ヘルスチェックして DynamoDB を更新するだけ
        print(f"Waiting for moshi.server on {public_ip}:{moshi_port}...")
        import urllib.request
        tunnel_url = None
        for i in range(180):
            try:
                urllib.request.urlopen(f"http://{public_ip}:{moshi_port}", timeout=3)
                print(f"moshi.server ready after {i*5}s")
                # Tunnel URL を取得（DynamoDB から前回の値を使うか、IP を使う）
                tunnel_url = f"http://{public_ip}:{moshi_port}"
                break
            except Exception:
                time.sleep(5)

        if not tunnel_url:
            print("Warm start: moshi.server did not become ready")
            return None

        table.update_item(
            Key={"sessionId": session_id},
            UpdateExpression="SET instanceId = :iid, #r = :r, #s = :s, publicIp = :ip, startedAt = :t",
            ExpressionAttributeNames={"#r": "region", "#s": "status"},
            ExpressionAttributeValues={
                ":iid": instance_id,
                ":r": region,
                ":s": "running",
                ":ip": tunnel_url,
                ":t": datetime.now(timezone.utc).isoformat(),
            },
        )
        return {"instanceId": instance_id, "region": region, "warmStart": True}

    except Exception as e:
        print(f"Warm start in {region} failed: {e}")
        return None


def _try_cold_start(region, session_id, model_repo, moshi_port):
    """リモートリージョンで新規 GPU インスタンスを起動（コールドスタート）"""
    print(f"Cold start in {region}...")
    remote_ec2 = boto3.client("ec2", region_name=region)

    try:
        vpcs = remote_ec2.describe_vpcs(Filters=[{"Name": "isDefault", "Values": ["true"]}])
        if not vpcs["Vpcs"]:
            return None, None
        vpc_id = vpcs["Vpcs"][0]["VpcId"]
        subnets = remote_ec2.describe_subnets(Filters=[{"Name": "vpc-id", "Values": [vpc_id]}])
        subnet_ids = [s["SubnetId"] for s in subnets["Subnets"]]
    except Exception as e:
        print(f"Failed to get {region} subnets: {e}")
        return None, None

    sg_name = f"speech-arena-gpu-{region}"
    try:
        sg_result = remote_ec2.describe_security_groups(Filters=[{"Name": "group-name", "Values": [sg_name]}])
        if sg_result["SecurityGroups"]:
            sg_id = sg_result["SecurityGroups"][0]["GroupId"]
        else:
            sg = remote_ec2.create_security_group(GroupName=sg_name, Description=f"SpeechArena GPU ({region})", VpcId=vpc_id)
            sg_id = sg["GroupId"]
            remote_ec2.authorize_security_group_ingress(GroupId=sg_id, IpPermissions=[
                {"IpProtocol": "tcp", "FromPort": 8998, "ToPort": 8999, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]},
                {"IpProtocol": "tcp", "FromPort": 22, "ToPort": 22, "IpRanges": [{"CidrIp": "0.0.0.0/0"}]},
            ])
    except Exception as e:
        print(f"Failed to setup {region} SG: {e}")
        return None, None

    try:
        ami_result = remote_ec2.describe_images(Owners=["amazon"], Filters=[
            {"Name": "name", "Values": ["Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 22.04) *"]},
            {"Name": "architecture", "Values": ["x86_64"]},
        ])
        if not ami_result["Images"]:
            return None, None
        ami_id = sorted(ami_result["Images"], key=lambda x: x["CreationDate"], reverse=True)[0]["ImageId"]
    except Exception as e:
        print(f"Failed to get {region} AMI: {e}")
        return None, None

    ecr_repo_url = f"518024472814.dkr.ecr.{region}.amazonaws.com/speech-arena/moshi-server"
    snapshot_id = os.environ.get("MODEL_SNAPSHOT_ID", "")
    # スナップショットは us-east-1 にのみ存在
    use_snapshot = snapshot_id and region == "us-east-1"

    remote_instance_types = ["g5.xlarge", "g6e.xlarge", "g5.2xlarge"]
    for inst_type in remote_instance_types:
        for subnet_id in subnet_ids:
            try:
                block_devices = [{"DeviceName": "/dev/sda1", "Ebs": {"VolumeSize": 100, "VolumeType": "gp3"}}]
                if use_snapshot:
                    block_devices.append({
                        "DeviceName": "/dev/xvdf",
                        "Ebs": {"SnapshotId": snapshot_id, "VolumeSize": 200, "VolumeType": "gp3", "DeleteOnTermination": False},
                    })

                run_response = remote_ec2.run_instances(
                    ImageId=ami_id,
                    InstanceType=inst_type,
                    MinCount=1, MaxCount=1,
                    SubnetId=subnet_id,
                    SecurityGroupIds=[sg_id],
                    IamInstanceProfile={"Name": "speech-arena-gpu-instance"},
                    KeyName="speech-arena-gpu",
                    BlockDeviceMappings=block_devices,
                    # オンデマンド（Stop/Start のウォームプールに対応）
                    UserData=_build_userdata(session_id, model_repo, moshi_port, region, ecr_repo_url),
                    TagSpecifications=[{
                        "ResourceType": "instance",
                        "Tags": [
                            {"Key": "Name", "Value": f"speech-arena-gpu"},
                            {"Key": "SessionId", "Value": session_id},
                            {"Key": "Project", "Value": "speech-arena"},
                            {"Key": "Region", "Value": region},
                        ],
                    }],
                )
                print(f"{region} success: {inst_type} in {subnet_id}")
                return run_response, region
            except Exception as e:
                print(f"{region} {inst_type} in {subnet_id} failed: {e}")
                continue

    return None, None


def start_session(event, context):
    """GPU インスタンスを起動してセッションを作成"""
    body = json.loads(event.get("body", "{}"))
    model_repo = body.get("modelRepo", "abePclWaseda/llm-jp-moshi-v1")
    moshi_port = body.get("port", 8998)

    session_id = f"sess-{int(time.time() * 1000)}"
    expires_at = int((datetime.now(timezone.utc) + timedelta(hours=2)).timestamp())

    table.put_item(Item={
        "sessionId": session_id,
        "status": "starting",
        "modelRepo": model_repo,
        "port": moshi_port,
        "createdAt": datetime.now(timezone.utc).isoformat(),
        "expiresAt": expires_at,
    })

    lambda_client = boto3.client("lambda")
    lambda_client.invoke(
        FunctionName=context.function_name,
        InvocationType="Event",
        Payload=json.dumps({
            "_async_launch": True,
            "sessionId": session_id,
            "modelRepo": model_repo,
            "port": moshi_port,
        }),
    )

    return response(201, {"sessionId": session_id, "status": "starting"})


def get_session(session_id):
    """セッションの状態を返す"""
    result = table.get_item(Key={"sessionId": session_id})
    item = result.get("Item")
    if not item:
        return response(404, {"error": "Session not found"})

    public_ip = item.get("publicIp", "")
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
    """定期実行: アイドルセッションの GPU を停止（terminate ではなく stop）"""
    threshold = datetime.now(timezone.utc) - timedelta(minutes=SESSION_TIMEOUT_MINUTES)

    result = table.query(
        IndexName="status-index",
        KeyConditionExpression=boto3.dynamodb.conditions.Key("status").eq("running"),
    )

    stopped = 0
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
                    region = item.get("region", "us-east-1")
                    ec2_client = boto3.client("ec2", region_name=region)
                    # terminate ではなく stop（ウォームプール）
                    ec2_client.stop_instances(InstanceIds=[instance_id])
                    table.update_item(
                        Key={"sessionId": item["sessionId"]},
                        UpdateExpression="SET #s = :s, stoppedAt = :t",
                        ExpressionAttributeNames={"#s": "status"},
                        ExpressionAttributeValues={
                            ":s": "stopped",
                            ":t": datetime.now(timezone.utc).isoformat(),
                        },
                    )
                    stopped += 1
                    print(f"Stopped {instance_id} (session {item['sessionId']})")
                except Exception as e:
                    print(f"Failed to stop {instance_id}: {e}")

    return {"stopped": stopped}


def _build_userdata(session_id, model_repo, port, region, ecr_repo_url):
    """user data スクリプトを生成"""
    hf_token = os.environ.get("HF_TOKEN", "")
    dynamodb_table = TABLE_NAME

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

# HF キャッシュのマウント
HF_CACHE_DIR=""
mkdir -p /mnt/models
for d in /dev/nvme1n1 /dev/nvme2n1 /dev/nvme3n1 /dev/nvme4n1 /dev/xvdf; do
  if [ -b "$d" ]; then
    FS=$(sudo file -s "$d" 2>/dev/null | grep -c ext4 || true)
    if [ "$FS" -gt 0 ]; then
      echo "Mounting model volume: $d"
      mount $d /mnt/models 2>/dev/null || true
      if [ -d "/mnt/models/hf_cache" ]; then
        HF_CACHE_DIR="/mnt/models/hf_cache"
        echo "HF cache found"
        break
      else
        umount /mnt/models 2>/dev/null || true
      fi
    fi
  fi
done

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

# Docker pull & run
docker pull $ECR_REPO_URL:latest
if [ -n "$HF_CACHE_DIR" ]; then
  docker run -d --gpus all --name moshi-server --restart always \\
    -p $MOSHI_PORT:$MOSHI_PORT \\
    -e HF_TOKEN=$HF_TOKEN -e HUGGING_FACE_HUB_TOKEN=$HF_TOKEN \\
    -e HF_HOME=/hf_cache -v $HF_CACHE_DIR:/hf_cache \\
    $ECR_REPO_URL:latest \\
    uv run -m moshi.server --hf-repo $MODEL_REPO --port $MOSHI_PORT --host 0.0.0.0 --static /app/static
else
  docker run -d --gpus all --name moshi-server --restart always \\
    -p $MOSHI_PORT:$MOSHI_PORT \\
    -e HF_TOKEN=$HF_TOKEN -e HUGGING_FACE_HUB_TOKEN=$HF_TOKEN \\
    $ECR_REPO_URL:latest \\
    uv run -m moshi.server --hf-repo $MODEL_REPO --port $MOSHI_PORT --host 0.0.0.0 --static /app/static
fi

# ヘルスチェック
for i in $(seq 1 180); do
  if curl -s -o /dev/null http://localhost:$MOSHI_PORT 2>/dev/null; then
    echo "moshi.server ready after ${{i}}0 seconds"
    break
  fi
  sleep 5
done

# Cloudflare Tunnel
curl -fsSL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
TUNNEL_LOG="/tmp/cloudflared.log"
cloudflared tunnel --url http://localhost:$MOSHI_PORT > $TUNNEL_LOG 2>&1 &
TUNNEL_URL=""
for i in $(seq 1 30); do
  TUNNEL_URL=$(grep -oP 'https://[a-z0-9-]+\\.trycloudflare\\.com' $TUNNEL_LOG 2>/dev/null | head -1 || true)
  [ -n "$TUNNEL_URL" ] && break
  sleep 1
done
[ -z "$TUNNEL_URL" ] && TUNNEL_URL="http://$PUBLIC_IP:$MOSHI_PORT"

# DynamoDB 更新
aws dynamodb update-item \\
  --region ap-northeast-1 \\
  --table-name {dynamodb_table} \\
  --key '{{"sessionId": {{"S": "'$SESSION_ID'"}}}}'  \\
  --update-expression "SET #s = :s, publicIp = :ip, instanceId = :iid, startedAt = :t" \\
  --expression-attribute-names '{{"#s": "status"}}' \\
  --expression-attribute-values '{{":s": {{"S": "running"}}, ":ip": {{"S": "'$TUNNEL_URL'"}}, ":iid": {{"S": "'$INSTANCE_ID'"}}, ":t": {{"S": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}}}}'

# Docker の --restart always により、EC2 Stop/Start 後に
# Docker デーモンが自動でコンテナを再起動する（HF キャッシュも保持）
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
