# -------------------------
# DYNAMODB TABLES
# -------------------------

# Notifications Table
resource "aws_dynamodb_table" "notifications" {
  name           = var.notifications_table_name
  billing_mode   = var.billing_mode
  hash_key       = "PK"
  range_key      = "SK"
  stream_enabled = var.stream_enabled
  stream_view_type = var.stream_enabled ? var.stream_view_type : null

  # On-Demand capacity (auto-scaling)
  dynamic "read_capacity" {
    for_each = var.billing_mode == "PROVISIONED" ? [1] : []
    content {
      read_capacity  = var.read_capacity
    }
  }

  dynamic "write_capacity" {
    for_each = var.billing_mode == "PROVISIONED" ? [1] : []
    content {
      write_capacity = var.write_capacity
    }
  }

  # Primary Keys
  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }

  # Global Secondary Index for querying by notification type (optional)
  dynamic "global_secondary_index" {
    for_each = var.enable_type_index ? [1] : []
    content {
      name            = "TypeIndex"
      hash_key        = "type"
      range_key       = "createdAt"
      projection_type = "ALL"

      read_capacity  = var.billing_mode == "PROVISIONED" ? var.gsi_read_capacity : null
      write_capacity = var.billing_mode == "PROVISIONED" ? var.gsi_write_capacity : null
    }
  }

  # TTL Configuration (auto-delete old notifications)
  ttl {
    enabled        = var.ttl_enabled
    attribute_name = var.ttl_attribute_name
  }

  # Point-in-time recovery (PITR) for backups
  point_in_time_recovery {
    enabled = var.point_in_time_recovery_enabled
  }

  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = var.kms_key_arn
  }

  # Tags
  tags = merge(
    var.common_tags,
    {
      Name        = var.notifications_table_name
      Service     = "notifications"
      ManagedBy   = "Terraform"
      Environment = var.environment
    }
  )

  # Prevent accidental deletion in production
  # Note: prevent_destroy must be a literal value, not a variable
  # Set to false for staging, true for production
  lifecycle {
    prevent_destroy = false
  }
}

# -------------------------
# AUTO-SCALING (for PROVISIONED mode)
# -------------------------

# Auto-scaling for read capacity
resource "aws_appautoscaling_target" "dynamodb_table_read_target" {
  count              = var.billing_mode == "PROVISIONED" && var.enable_autoscaling ? 1 : 0
  max_capacity       = var.autoscaling_read_max_capacity
  min_capacity       = var.read_capacity
  resource_id        = "table/${aws_dynamodb_table.notifications.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_read_policy" {
  count              = var.billing_mode == "PROVISIONED" && var.enable_autoscaling ? 1 : 0
  name               = "${var.notifications_table_name}-read-scaling-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_read_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_read_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_read_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }
    target_value = var.autoscaling_read_target_value
  }
}

# Auto-scaling for write capacity
resource "aws_appautoscaling_target" "dynamodb_table_write_target" {
  count              = var.billing_mode == "PROVISIONED" && var.enable_autoscaling ? 1 : 0
  max_capacity       = var.autoscaling_write_max_capacity
  min_capacity       = var.write_capacity
  resource_id        = "table/${aws_dynamodb_table.notifications.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_write_policy" {
  count              = var.billing_mode == "PROVISIONED" && var.enable_autoscaling ? 1 : 0
  name               = "${var.notifications_table_name}-write-scaling-policy"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_write_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_write_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_write_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }
    target_value = var.autoscaling_write_target_value
  }
}

# -------------------------
# CLOUDWATCH ALARMS
# -------------------------

# Alarm for high read throttle events
resource "aws_cloudwatch_metric_alarm" "read_throttle_events" {
  count               = var.enable_cloudwatch_alarms ? 1 : 0
  alarm_name          = "${var.notifications_table_name}-read-throttle-events"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ReadThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.read_throttle_alarm_threshold
  alarm_description   = "This metric monitors DynamoDB read throttle events"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.notifications.name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = var.common_tags
}

# Alarm for high write throttle events
resource "aws_cloudwatch_metric_alarm" "write_throttle_events" {
  count               = var.enable_cloudwatch_alarms ? 1 : 0
  alarm_name          = "${var.notifications_table_name}-write-throttle-events"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "WriteThrottleEvents"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.write_throttle_alarm_threshold
  alarm_description   = "This metric monitors DynamoDB write throttle events"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.notifications.name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = var.common_tags
}

# Alarm for user errors (client-side errors)
resource "aws_cloudwatch_metric_alarm" "user_errors" {
  count               = var.enable_cloudwatch_alarms ? 1 : 0
  alarm_name          = "${var.notifications_table_name}-user-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.user_errors_alarm_threshold
  alarm_description   = "This metric monitors DynamoDB user errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.notifications.name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = var.common_tags
}

# Alarm for system errors (server-side errors)
resource "aws_cloudwatch_metric_alarm" "system_errors" {
  count               = var.enable_cloudwatch_alarms ? 1 : 0
  alarm_name          = "${var.notifications_table_name}-system-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = var.system_errors_alarm_threshold
  alarm_description   = "This metric monitors DynamoDB system errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.notifications.name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = var.common_tags
}

# Alarm for high consumed read capacity
resource "aws_cloudwatch_metric_alarm" "consumed_read_capacity" {
  count               = var.enable_cloudwatch_alarms && var.billing_mode == "PROVISIONED" ? 1 : 0
  alarm_name          = "${var.notifications_table_name}-high-consumed-read-capacity"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Average"
  threshold           = var.read_capacity * 0.8  # 80% of provisioned capacity
  alarm_description   = "This metric monitors DynamoDB consumed read capacity"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.notifications.name
  }

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = var.common_tags
}

# -------------------------
# CONTRIBUTOR INSIGHTS (optional)
# -------------------------

resource "aws_dynamodb_contributor_insights" "notifications" {
  count      = var.enable_contributor_insights ? 1 : 0
  table_name = aws_dynamodb_table.notifications.name
}
