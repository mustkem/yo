provider "aws" {
  region = var.aws_region
}

resource "aws_security_group" "staging_sg" {
  name        = var.security_group_name
  description = "Security group for staging EC2 instance"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "staging-sg"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

resource "aws_instance" "staging_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.staging_sg.id]
  subnet_id              = var.subnet_id
  user_data              = file("${path.module}/user_data.sh")

  tags = {
    Name        = "staging-ec2"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

resource "aws_ecr_repository" "nestjs_app" {
  name                 = "nestjs-app"
  image_tag_mutability = "MUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name        = "nestjs-app"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}
