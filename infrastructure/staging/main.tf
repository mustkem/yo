provider "aws" {
  region = var.aws_region
}

resource "aws_security_group" "staging_sg" {
  name        = var.security_group_name
  description = "Security group for staging EC2 instance"
  vpc_id      = var.vpc_id

  ingress {
    description = "Allow all inbound traffic (for dev only)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = var.security_group_name
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

resource "aws_instance" "staging_server" {
  ami                         = var.ami_id
  instance_type               = var.instance_type
  key_name                    = var.key_name
  vpc_security_group_ids      = [aws_security_group.staging_sg.id]

  tags = {
    Name        = "staging-ec2"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}
