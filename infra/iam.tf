# Lambda 実行ロール
resource "aws_iam_role" "lambda_orchestrator" {
  name = "${var.project_name}-lambda-orchestrator"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_orchestrator" {
  name = "${var.project_name}-lambda-orchestrator-policy"
  role = aws_iam_role.lambda_orchestrator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ec2:RunInstances",
          "ec2:TerminateInstances",
          "ec2:DescribeInstances",
          "ec2:DescribeSubnets",
          "ec2:DescribeVpcs",
          "ec2:DescribeSecurityGroups",
          "ec2:AuthorizeSecurityGroupIngress",
          "ec2:CreateSecurityGroup",
          "ec2:DescribeImages",
          "ec2:CreateTags",
          "ec2:RequestSpotInstances",
          "ec2:CreateFleet",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
        ]
        Resource = aws_dynamodb_table.sessions.arn
      },
      {
        Effect   = "Allow"
        Action   = "iam:PassRole"
        Resource = aws_iam_role.gpu_instance.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect   = "Allow"
        Action   = "lambda:InvokeFunction"
        Resource = "arn:aws:lambda:*:*:function:${var.project_name}-*"
      },
    ]
  })
}

# GPU インスタンス用ロール
resource "aws_iam_role" "gpu_instance" {
  name = "${var.project_name}-gpu-instance"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "gpu_instance" {
  name = "${var.project_name}-gpu-instance-policy"
  role = aws_iam_role.gpu_instance.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject",
        ]
        Resource = "${aws_s3_bucket.audio.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:UpdateItem",
        ]
        Resource = aws_dynamodb_table.sessions.arn
      },
    ]
  })
}

resource "aws_iam_instance_profile" "gpu_instance" {
  name = "${var.project_name}-gpu-instance"
  role = aws_iam_role.gpu_instance.name
}
