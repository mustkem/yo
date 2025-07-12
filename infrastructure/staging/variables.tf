variable "aws_region" {
  default = "us-east-1"
}

variable "ami_id" {
  description = "AMI ID for EC2"
  default     = "ami-0c101f26f147fa7fd" # Amazon Linux 2023 (us-east-1)
}

variable "instance_type" {
  default = "t3.medium"
}

variable "key_name" {
  description = "EC2 key pair name"
  default     = "yo-staging-key"
}

variable "vpc_id" {
  description = "VPC where EC2 will be launched"
  type        = string
}

variable "security_group_name" {
  default = "staging-sg"
}
