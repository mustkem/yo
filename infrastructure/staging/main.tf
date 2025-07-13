terraform {
  backend "s3" {
    bucket         = "yo-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "yo-terraform-locks"
    encrypt        = true
  }
}

provider "aws" {
  region = var.aws_region
}

# -------------------------
# SECURITY GROUP
# -------------------------
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
    Name        = "staging-sg"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

# -------------------------
# ECR REPOSITORY
# -------------------------
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

# -------------------------
# IAM ROLE for EC2 + ECR Access
# -------------------------
resource "aws_iam_role" "ec2_ecr_role" {
  name = "ec2-ecr-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = {
        Service = "ec2.amazonaws.com"
      },
      Action = "sts:AssumeRole"
    }]
  })

  tags = {
    Name        = "ec2-ecr-access-role"
    Environment = "staging"
  }
}

resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

resource "aws_iam_instance_profile" "ec2_ecr_profile" {
  name = "ec2-ecr-profile"
  role = aws_iam_role.ec2_ecr_role.name
}

# -------------------------
# NETWORK ACL (NACL)
# -------------------------
resource "aws_network_acl" "staging_acl" {
  vpc_id = var.vpc_id
  subnet_ids = [var.subnet_id]

  tags = {
    Name        = "staging-acl"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

# Allow All Inbound
resource "aws_network_acl_rule" "inbound_allow_all" {
  network_acl_id = aws_network_acl.staging_acl.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# Allow All Outbound (different rule_number to avoid conflicts)
resource "aws_network_acl_rule" "outbound_allow_all" {
  network_acl_id = aws_network_acl.staging_acl.id
  rule_number    = 101
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# -------------------------
# EC2 INSTANCE
# -------------------------
resource "aws_instance" "staging_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.staging_sg.id]
  subnet_id              = var.subnet_id
  user_data              = file("${path.module}/user_data.sh")
  iam_instance_profile   = aws_iam_instance_profile.ec2_ecr_profile.name

  tags = {
    Name        = "staging-ec2"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}
