# Lambda オーケストレーター（セッション開始）
resource "aws_lambda_function" "orchestrator" {
  function_name    = "${var.project_name}-orchestrator"
  role             = aws_iam_role.lambda_orchestrator.arn
  handler          = "orchestrator.handler"
  runtime          = "python3.12"
  timeout          = 900
  memory_size      = 256
  filename         = "${path.module}/lambda/orchestrator.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/orchestrator.zip")

  environment {
    variables = {
      DYNAMODB_TABLE            = aws_dynamodb_table.sessions.name
      LAUNCH_TEMPLATE_ID        = aws_launch_template.gpu.id
      SUBNET_IDS                = join(",", data.aws_subnets.default.ids)
      SESSION_TIMEOUT_MINUTES   = tostring(var.session_timeout_minutes)
      SECURITY_GROUP_GPU_ID     = aws_security_group.gpu.id
      GPU_INSTANCE_PROFILE_ARN  = aws_iam_instance_profile.gpu_instance.arn
      HF_TOKEN                  = var.hf_token
      MODEL_SNAPSHOT_ID         = var.model_snapshot_id
    }
  }
}

# Lambda クリーンアップ（アイドル GPU 自動停止）
resource "aws_lambda_function" "cleanup" {
  function_name    = "${var.project_name}-cleanup"
  role             = aws_iam_role.lambda_orchestrator.arn
  handler          = "orchestrator.cleanup_handler"
  runtime          = "python3.12"
  timeout          = 60
  memory_size      = 256
  filename         = "${path.module}/lambda/orchestrator.zip"
  source_code_hash = filebase64sha256("${path.module}/lambda/orchestrator.zip")

  environment {
    variables = {
      DYNAMODB_TABLE            = aws_dynamodb_table.sessions.name
      LAUNCH_TEMPLATE_ID        = aws_launch_template.gpu.id
      SUBNET_IDS                = join(",", data.aws_subnets.default.ids)
      SESSION_TIMEOUT_MINUTES   = tostring(var.session_timeout_minutes)
      SECURITY_GROUP_GPU_ID     = aws_security_group.gpu.id
      GPU_INSTANCE_PROFILE_ARN  = aws_iam_instance_profile.gpu_instance.arn
    }
  }
}

# 5分ごとにクリーンアップ Lambda を実行
resource "aws_cloudwatch_event_rule" "cleanup_schedule" {
  name                = "${var.project_name}-cleanup-schedule"
  schedule_expression = "rate(5 minutes)"
}

resource "aws_cloudwatch_event_target" "cleanup_lambda" {
  rule      = aws_cloudwatch_event_rule.cleanup_schedule.name
  target_id = "cleanup"
  arn       = aws_lambda_function.cleanup.arn
}

resource "aws_lambda_permission" "cleanup_cloudwatch" {
  statement_id  = "AllowCloudWatchInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.cleanup.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.cleanup_schedule.arn
}

# ログ保持
resource "aws_cloudwatch_log_group" "orchestrator" {
  name              = "/aws/lambda/${var.project_name}-orchestrator"
  retention_in_days = 14
}

resource "aws_cloudwatch_log_group" "cleanup" {
  name              = "/aws/lambda/${var.project_name}-cleanup"
  retention_in_days = 14
}
