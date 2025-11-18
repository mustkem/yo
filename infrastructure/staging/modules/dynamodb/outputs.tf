# -------------------------
# DYNAMODB TABLE OUTPUTS
# -------------------------

output "notifications_table_name" {
  description = "Name of the DynamoDB notifications table"
  value       = aws_dynamodb_table.notifications.name
}

output "notifications_table_arn" {
  description = "ARN of the DynamoDB notifications table"
  value       = aws_dynamodb_table.notifications.arn
}

output "notifications_table_id" {
  description = "ID of the DynamoDB notifications table"
  value       = aws_dynamodb_table.notifications.id
}

output "notifications_table_stream_arn" {
  description = "ARN of the DynamoDB stream for the notifications table"
  value       = aws_dynamodb_table.notifications.stream_arn
}

output "notifications_table_stream_label" {
  description = "Stream label of the DynamoDB notifications table"
  value       = aws_dynamodb_table.notifications.stream_label
}

output "notifications_table_hash_key" {
  description = "Hash key (partition key) of the notifications table"
  value       = aws_dynamodb_table.notifications.hash_key
}

output "notifications_table_range_key" {
  description = "Range key (sort key) of the notifications table"
  value       = aws_dynamodb_table.notifications.range_key
}

# -------------------------
# CLOUDWATCH ALARMS OUTPUTS
# -------------------------

output "read_throttle_alarm_arn" {
  description = "ARN of the read throttle CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.read_throttle_events[0].arn : null
}

output "write_throttle_alarm_arn" {
  description = "ARN of the write throttle CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.write_throttle_events[0].arn : null
}

output "user_errors_alarm_arn" {
  description = "ARN of the user errors CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.user_errors[0].arn : null
}

output "system_errors_alarm_arn" {
  description = "ARN of the system errors CloudWatch alarm"
  value       = var.enable_cloudwatch_alarms ? aws_cloudwatch_metric_alarm.system_errors[0].arn : null
}
