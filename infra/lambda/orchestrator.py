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

TABLE_NAME = os.environ["DYNAMODB_TABLE"]
LAUNCH_TEMPLATE_ID = os.environ["LAUNCH_TEMPLATE_ID"]
SUBNET_IDS = os.environ["SUBNET_IDS"].split(",")
SESSION_TIMEOUT_MINUTES = int(os.environ.get("SESSION_TIMEOUT_MINUTES", "15"))

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

    return response(200, {
        "sessionId": item["sessionId"],
        "status": item.get("status", "unknown"),
        "publicIp": item.get("publicIp"),
        "port": item.get("port", 8998),
        "wsEndpoint": f"wss://{item['publicIp']}:{item.get('port', 8998)}"
        if item.get("publicIp") else None,
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
                    ec2.terminate_instances(InstanceIds=[instance_id])
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


def _build_userdata_override(session_id, model_repo, port):
    """ローンチテンプレートの user_data に環境変数を追加"""
    import base64

    script = f"""#!/bin/bash
export SESSION_ID="{session_id}"
export MODEL_REPO="{model_repo}"
export MOSHI_PORT="{port}"
"""
    return base64.b64encode(script.encode()).decode()


def response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps(body, cls=DecimalEncoder),
    }
