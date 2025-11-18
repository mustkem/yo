# -------------------------
# OUTPUTS
# -------------------------

output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.staging_server.public_ip
}

output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.staging_server.id
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.nestjs_app.repository_url
}

# -------------------------
# DYNAMODB OUTPUTS
# -------------------------

output "dynamodb_notifications_table_name" {
  description = "Name of the DynamoDB notifications table"
  value       = module.dynamodb.notifications_table_name
}

output "dynamodb_notifications_table_arn" {
  description = "ARN of the DynamoDB notifications table"
  value       = module.dynamodb.notifications_table_arn
}

output "dynamodb_notifications_stream_arn" {
  description = "ARN of the DynamoDB stream for notifications table"
  value       = module.dynamodb.notifications_table_stream_arn
}

output "dynamodb_access_policy_arn" {
  description = "ARN of the DynamoDB full access IAM policy"
  value       = module.dynamodb.dynamodb_access_policy_arn
}

output "dynamodb_read_only_policy_arn" {
  description = "ARN of the DynamoDB read-only IAM policy"
  value       = module.dynamodb.dynamodb_read_only_policy_arn
}