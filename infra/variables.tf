variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "speech-arena"
}

variable "github_repo" {
  description = "GitHub repository URL for Amplify"
  type        = string
  default     = "https://github.com/kobas-lab/speech-arena"
}

variable "gpu_instance_type" {
  description = "EC2 GPU instance type"
  type        = string
  default     = "g5.xlarge"
}

variable "gpu_ami_id" {
  description = "AMI ID for GPU instances (Deep Learning AMI)"
  type        = string
  default     = "" # set via terraform.tfvars
}

variable "moshi_docker_image" {
  description = "ECR image URI for moshi.server"
  type        = string
  default     = "" # set after ECR push
}

variable "hf_token" {
  description = "HuggingFace API token"
  type        = string
  sensitive   = true
}
