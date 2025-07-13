# -------------------------
# OUTPUTS
# -------------------------

# Public IP of EC2 instance (useful for SSH or HTTP)
output "public_ip" {
  description = "Public IP address of the EC2 instance"
  value       = aws_instance.staging_server.public_ip
}

# EC2 Instance ID (useful for tagging, scripting, etc.)
output "instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.staging_server.id
}

# ECR Repository URL (used for pushing docker images)
output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.nestjs_app.repository_url
}
