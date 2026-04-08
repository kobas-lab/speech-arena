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
