# デフォルト VPC
data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

# Deep Learning AMI (NVIDIA ドライバ + Docker 入り)
data "aws_ami" "deep_learning" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["Deep Learning Base OSS Nvidia Driver GPU AMI (Ubuntu 22.04) *"]
  }

  filter {
    name   = "architecture"
    values = ["x86_64"]
  }
}

# GPU インスタンス用セキュリティグループ
resource "aws_security_group" "gpu" {
  name        = "${var.project_name}-gpu"
  description = "Security group for Moshi GPU instances"
  vpc_id      = data.aws_vpc.default.id

  # WebSocket (Model A)
  ingress {
    from_port   = 8998
    to_port     = 8998
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Moshi Model A WebSocket"
  }

  # WebSocket (Model B)
  ingress {
    from_port   = 8999
    to_port     = 8999
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Moshi Model B WebSocket"
  }

  # SSH
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "SSH access"
  }

  # All outbound
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# GPU Spot インスタンスのローンチテンプレート
resource "aws_launch_template" "gpu" {
  name = "${var.project_name}-gpu"

  image_id      = var.gpu_ami_id != "" ? var.gpu_ami_id : data.aws_ami.deep_learning.id
  instance_type = var.gpu_instance_type

  iam_instance_profile {
    arn = aws_iam_instance_profile.gpu_instance.arn
  }

  vpc_security_group_ids = [aws_security_group.gpu.id]

  key_name = var.ssh_key_name != "" ? var.ssh_key_name : null

  instance_market_options {
    market_type = "spot"
    spot_options {
      max_price          = var.spot_max_price
      spot_instance_type = "one-time"
    }
  }

  user_data = base64encode(templatefile("${path.module}/templates/gpu_userdata.sh.tpl", {
    ecr_repo_url   = aws_ecr_repository.moshi_server.repository_url
    aws_region     = var.aws_region
    dynamodb_table = aws_dynamodb_table.sessions.name
    hf_token       = var.hf_token
  }))

  metadata_options {
    http_tokens = "required" # IMDSv2
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name = "${var.project_name}-gpu"
    }
  }
}
