variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "ami_id" {
  description = "AMI ID"
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
}

variable "key_name" {
  description = "EC2 key pair name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnet_id" {
  description = "Subnet ID"
  type        = string
}

variable "security_group_name" {
  description = "Name of the security group"
  type        = string
}


variable "ssh_cidr_block" {
  description = "Optional CIDR block for SSH access (overrides dynamic IP if set)"
  type        = string
  default     = ""
}

variable "associate_public_ip" {
  description = "Whether to associate a public IP address with the EC2 instance"
  type        = bool
  default     = false
}
