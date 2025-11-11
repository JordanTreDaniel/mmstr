variable "region" {
  default = "us-east-2"
}

variable "instance_type" {
  default = "t3.small"
}

variable "key_name" {
  description = "Name of your AWS EC2 key pair"
}

variable "ami_id" {
  description = "AMI ID for Amazon Linux 2023 in your region"
  default     = "ami-06971c49acd687c30"
}

variable "aws_ssh_private_key_path" {
  description = "Local path to your private SSH key for EC2 access"
}

variable "app_repo" {
  description = "GitHub repository URL for the app"
}

variable "github_ssh_private_key_path" {
  description = "Path to your SSH private key for GitHub access"
}

variable "ssl_email" {
  description = "Email address for SSL certificate notifications"
  type        = string
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
}

variable "elastic_ip_allocation_id" {
  description = "The allocation ID of the Elastic IP"
  type        = string
} 