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