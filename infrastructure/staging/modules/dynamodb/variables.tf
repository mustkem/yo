# -------------------------
# DYNAMODB TABLE VARIABLES
# -------------------------

variable "notifications_table_name" {
  description = "Name of the DynamoDB notifications table"
  type        = string
  default     = "user-notifications"
}

variable "environment" {
  description = "Environment name (e.g., staging, production)"
  type        = string
}

variable "billing_mode" {
  description = "DynamoDB billing mode: PAY_PER_REQUEST (on-demand) or PROVISIONED"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.billing_mode)
    error_message = "Billing mode must be either PAY_PER_REQUEST or PROVISIONED"
  }
}

# -------------------------
# CAPACITY SETTINGS (for PROVISIONED mode)
# -------------------------

variable "read_capacity" {
  description = "Read capacity units (only for PROVISIONED billing mode)"
  type        = number
  default     = 5
}

variable "write_capacity" {
  description = "Write capacity units (only for PROVISIONED billing mode)"
  type        = number
  default     = 5
}

variable "gsi_read_capacity" {
  description = "GSI read capacity units (only for PROVISIONED billing mode)"
  type        = number
  default     = 5
}

variable "gsi_write_capacity" {
  description = "GSI write capacity units (only for PROVISIONED billing mode)"
  type        = number
  default     = 5
}

# -------------------------
# AUTO-SCALING SETTINGS
# -------------------------

variable "enable_autoscaling" {
  description = "Enable auto-scaling for PROVISIONED billing mode"
  type        = bool
  default     = false
}

variable "autoscaling_read_max_capacity" {
  description = "Maximum read capacity for auto-scaling"
  type        = number
  default     = 100
}

variable "autoscaling_write_max_capacity" {
  description = "Maximum write capacity for auto-scaling"
  type        = number
  default     = 100
}

variable "autoscaling_read_target_value" {
  description = "Target utilization percentage for read capacity"
  type        = number
  default     = 70
}

variable "autoscaling_write_target_value" {
  description = "Target utilization percentage for write capacity"
  type        = number
  default     = 70
}

# -------------------------
# STREAM SETTINGS
# -------------------------

variable "stream_enabled" {
  description = "Enable DynamoDB Streams for change data capture"
  type        = bool
  default     = true
}

variable "stream_view_type" {
  description = "Stream view type: KEYS_ONLY, NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES"
  type        = string
  default     = "NEW_AND_OLD_IMAGES"
  validation {
    condition     = contains(["KEYS_ONLY", "NEW_IMAGE", "OLD_IMAGE", "NEW_AND_OLD_IMAGES"], var.stream_view_type)
    error_message = "Stream view type must be one of: KEYS_ONLY, NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES"
  }
}

# -------------------------
# TTL SETTINGS
# -------------------------

variable "ttl_enabled" {
  description = "Enable Time To Live (TTL) for automatic item deletion"
  type        = bool
  default     = true
}

variable "ttl_attribute_name" {
  description = "TTL attribute name (must be a Number type representing Unix timestamp)"
  type        = string
  default     = "ttl"
}

# -------------------------
# BACKUP & RECOVERY
# -------------------------

variable "point_in_time_recovery_enabled" {
  description = "Enable Point-in-Time Recovery (PITR) for backups"
  type        = bool
  default     = true
}

# Note: prevent_destroy cannot be a variable in Terraform lifecycle blocks
# It must be set directly in main.tf as a literal boolean value

# -------------------------
# ENCRYPTION
# -------------------------

variable "kms_key_arn" {
  description = "ARN of KMS key for server-side encryption (leave empty for AWS-managed key)"
  type        = string
  default     = null
}

# -------------------------
# GLOBAL SECONDARY INDEX
# -------------------------

variable "enable_type_index" {
  description = "Enable TypeIndex GSI for querying by notification type"
  type        = bool
  default     = false
}

# -------------------------
# CLOUDWATCH ALARMS
# -------------------------

variable "enable_cloudwatch_alarms" {
  description = "Enable CloudWatch alarms for DynamoDB monitoring"
  type        = bool
  default     = true
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "read_throttle_alarm_threshold" {
  description = "Threshold for read throttle events alarm"
  type        = number
  default     = 10
}

variable "write_throttle_alarm_threshold" {
  description = "Threshold for write throttle events alarm"
  type        = number
  default     = 10
}

variable "user_errors_alarm_threshold" {
  description = "Threshold for user errors alarm"
  type        = number
  default     = 50
}

variable "system_errors_alarm_threshold" {
  description = "Threshold for system errors alarm"
  type        = number
  default     = 5
}

# -------------------------
# CONTRIBUTOR INSIGHTS
# -------------------------

variable "enable_contributor_insights" {
  description = "Enable DynamoDB Contributor Insights for detailed access pattern analysis"
  type        = bool
  default     = false
}

# -------------------------
# TAGS
# -------------------------

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default     = {}
}
