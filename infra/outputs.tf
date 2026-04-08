output "s3_audio_bucket" {
  description = "S3 bucket for audio data"
  value       = aws_s3_bucket.audio.bucket
}

output "ecr_repository_url" {
  description = "ECR repository URL for moshi.server"
  value       = aws_ecr_repository.moshi_server.repository_url
}

output "dynamodb_table_name" {
  description = "DynamoDB sessions table name"
  value       = aws_dynamodb_table.sessions.name
}

output "lambda_role_arn" {
  description = "Lambda orchestrator role ARN"
  value       = aws_iam_role.lambda_orchestrator.arn
}

output "gpu_instance_profile_name" {
  description = "GPU instance profile name"
  value       = aws_iam_instance_profile.gpu_instance.name
}

output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL"
  value       = aws_apigatewayv2_api.main.api_endpoint
}

output "amplify_app_url" {
  description = "Amplify app default domain"
  value       = aws_amplify_app.web.default_domain
}

output "lambda_orchestrator_name" {
  description = "Lambda orchestrator function name"
  value       = aws_lambda_function.orchestrator.function_name
}

output "security_group_gpu_id" {
  description = "GPU security group ID"
  value       = aws_security_group.gpu.id
}
