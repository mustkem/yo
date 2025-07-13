output "instance_id" {
  value = aws_instance.staging_server.id
}

output "public_ip" {
  value = aws_instance.staging_server.public_ip
}

output "ecr_repository_url" {
  description = "The URL of the ECR repository"
  value       = aws_ecr_repository.nestjs_app.repository_url
}
