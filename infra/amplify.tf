# Amplify Hosting (Next.js フロントエンド)
resource "aws_amplify_app" "web" {
  name       = "${var.project_name}-web"
  repository = var.github_repo
  platform   = "WEB_COMPUTE"

  oauth_token = var.github_oauth_token != "" ? var.github_oauth_token : null

  build_spec = <<-EOT
    version: 1
    applications:
      - appRoot: apps/web
        frontend:
          phases:
            preBuild:
              commands:
                - npm ci
            build:
              commands:
                - npm run build
          artifacts:
            baseDirectory: .next
            files:
              - '**/*'
          cache:
            paths:
              - node_modules/**/*
              - .next/cache/**/*
  EOT

  environment_variables = {
    API_ENDPOINT              = aws_apigatewayv2_api.main.api_endpoint
    AMPLIFY_MONOREPO_APP_ROOT = "apps/web"
  }
}

# main ブランチの自動デプロイ
resource "aws_amplify_branch" "main" {
  app_id      = aws_amplify_app.web.id
  branch_name = "main"
  stage       = "PRODUCTION"

  enable_auto_build = true

  framework = "Next.js - SSR"
}
