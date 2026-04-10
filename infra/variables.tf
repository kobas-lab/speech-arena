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

variable "ssh_key_name" {
  description = "EC2 key pair name for GPU instance SSH access"
  type        = string
  default     = ""
}

variable "spot_max_price" {
  description = "Max hourly price for Spot GPU instances"
  type        = string
  default     = "0.50"
}

variable "github_oauth_token" {
  description = "GitHub personal access token for Amplify"
  type        = string
  sensitive   = true
  default     = ""
}

variable "session_timeout_minutes" {
  description = "Minutes before auto-terminating idle GPU instances"
  type        = number
  default     = 45
}

variable "model_repo_a" {
  description = "HuggingFace repo for model A"
  type        = string
  default     = "abePclWaseda/llm-jp-moshi-v1"
}

variable "model_repo_b" {
  description = "HuggingFace repo for model B"
  type        = string
  default     = "abePclWaseda/llm-jp-moshi-v1.1-vb-pseudo"
}

variable "database_url" {
  description = "Supabase PgBouncer connection URL"
  type        = string
  sensitive   = true
}

variable "direct_url" {
  description = "Supabase direct connection URL"
  type        = string
  sensitive   = true
}
