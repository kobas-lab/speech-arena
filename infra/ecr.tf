# moshi.server Docker イメージ用 ECR リポジトリ
resource "aws_ecr_repository" "moshi_server" {
  name                 = "${var.project_name}/moshi-server"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }
}

# 古いイメージを自動削除
resource "aws_ecr_lifecycle_policy" "moshi_server" {
  repository = aws_ecr_repository.moshi_server.name

  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 10 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 10
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
