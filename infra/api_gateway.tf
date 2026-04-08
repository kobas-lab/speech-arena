# HTTP API Gateway
resource "aws_apigatewayv2_api" "main" {
  name          = "${var.project_name}-api"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["*"]
    allow_methods = ["POST", "GET", "OPTIONS"]
    allow_headers = ["Content-Type"]
    max_age       = 3600
  }
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = "$default"
  auto_deploy = true
}

# Lambda 統合
resource "aws_apigatewayv2_integration" "orchestrator" {
  api_id                 = aws_apigatewayv2_api.main.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.orchestrator.invoke_arn
  payload_format_version = "2.0"
}

# POST /sessions — セッション開始
resource "aws_apigatewayv2_route" "start_session" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "POST /sessions"
  target    = "integrations/${aws_apigatewayv2_integration.orchestrator.id}"
}

# GET /sessions/{sessionId} — セッション状態取得
resource "aws_apigatewayv2_route" "get_session" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "GET /sessions/{sessionId}"
  target    = "integrations/${aws_apigatewayv2_integration.orchestrator.id}"
}

# API Gateway から Lambda を呼び出す権限
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.orchestrator.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}
