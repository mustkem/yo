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

# -------------------------
# DYNAMODB VARIABLES
# -------------------------

variable "dynamodb_notifications_table_name" {
  description = "Name of the DynamoDB notifications table"
  type        = string
  default     = "user-notifications"
}

variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode: PAY_PER_REQUEST (on-demand) or PROVISIONED"
  type        = string
  default     = "PAY_PER_REQUEST"
}

variable "dynamodb_stream_enabled" {
  description = "Enable DynamoDB Streams for change data capture"
  type        = bool
  default     = true
}

variable "dynamodb_stream_view_type" {
  description = "Stream view type: KEYS_ONLY, NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES"
  type        = string
  default     = "NEW_AND_OLD_IMAGES"
}

variable "dynamodb_ttl_enabled" {
  description = "Enable Time To Live (TTL) for automatic item deletion"
  type        = bool
  default     = true
}

variable "dynamodb_ttl_attribute_name" {
  description = "TTL attribute name (must be a Number type representing Unix timestamp)"
  type        = string
  default     = "ttl"
}

variable "dynamodb_pitr_enabled" {
  description = "Enable Point-in-Time Recovery (PITR) for backups"
  type        = bool
  default     = false
}

# Note: dynamodb_prevent_destroy variable removed - prevent_destroy must be set
# as a literal value in the module's main.tf lifecycle block, not as a variable

variable "dynamodb_enable_alarms" {
  description = "Enable CloudWatch alarms for DynamoDB monitoring"
  type        = bool
  default     = false
}
