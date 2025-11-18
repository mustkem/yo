# -------------------------
# TERRAFORM BACKEND CONFIG
# -------------------------
terraform {
  backend "s3" {
    bucket         = "yo-terraform-state"
    key            = "staging/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "yo-terraform-locks"
    encrypt        = true
  }
}

# -------------------------
# PROVIDER
# -------------------------
provider "aws" {
  region = var.aws_region
}

# -------------------------
# DYNAMIC IP FETCH
# -------------------------
data "http" "my_ip" {
  url = "https://httpbin.org/ip"
  request_headers = {
    Accept = "application/json"
  }
}

locals {
  my_ip = var.ssh_cidr_block != "" ? var.ssh_cidr_block : "${jsondecode(data.http.my_ip.response_body).origin}/32"
}

# -------------------------
# VPC + NETWORKING SETUP
# -------------------------
resource "aws_vpc" "staging_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name        = "staging-vpc"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

resource "aws_internet_gateway" "staging_igw" {
  vpc_id = aws_vpc.staging_vpc.id

  tags = {
    Name        = "staging-igw"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

resource "aws_subnet" "staging_subnet" {
  vpc_id                  = aws_vpc.staging_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "us-east-1a"

  tags = {
    Name        = "staging-subnet"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

resource "aws_route_table" "staging_rt" {
  vpc_id = aws_vpc.staging_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.staging_igw.id
  }

  tags = {
    Name        = "staging-rt"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

resource "aws_route_table_association" "staging_rt_assoc" {
  subnet_id      = aws_subnet.staging_subnet.id
  route_table_id = aws_route_table.staging_rt.id
}

# -------------------------
# SECURITY GROUP
# -------------------------
resource "aws_security_group" "staging_sg" {
  name        = var.security_group_name
  description = "Security group for staging EC2 instance"
  vpc_id      = aws_vpc.staging_vpc.id

  # Allow all inbound traffic from all IPs
  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
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
# NETWORK ACL (NACL)
# -------------------------
resource "aws_network_acl" "staging_acl" {
  vpc_id     = aws_vpc.staging_vpc.id
  subnet_ids = [aws_subnet.staging_subnet.id]

  tags = {
    Name        = "staging-acl"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

resource "aws_network_acl_rule" "allow_all_inbound" {
  network_acl_id = aws_network_acl.staging_acl.id
  rule_number    = 100
  egress         = false
  protocol       = "-1"         # All protocols
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"  # From anywhere
  from_port      = 0
  to_port        = 0
}

resource "aws_network_acl_rule" "outbound_all" {
  network_acl_id = aws_network_acl.staging_acl.id
  rule_number    = 100
  egress         = true
  protocol       = "-1"
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 0
  to_port        = 0
}

# -------------------------
# IAM ROLE for EC2 + ECR + DynamoDB Access
# -------------------------
resource "aws_iam_role" "ec2_ecr_role" {
  name = "ec2-ecr-dynamodb-access-role"

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
    Name        = "ec2-ecr-dynamodb-access-role"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

# Attach ECR read-only policy
resource "aws_iam_role_policy_attachment" "ecr_read_only" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
}

# Attach DynamoDB access policy
resource "aws_iam_role_policy_attachment" "dynamodb_access" {
  role       = aws_iam_role.ec2_ecr_role.name
  policy_arn = module.dynamodb.dynamodb_access_policy_arn
}

resource "aws_iam_instance_profile" "ec2_ecr_profile" {
  name = "ec2-ecr-dynamodb-profile"
  role = aws_iam_role.ec2_ecr_role.name
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
# EC2 INSTANCE
# -------------------------
resource "aws_instance" "staging_server" {
  ami                    = var.ami_id
  instance_type          = var.instance_type
  key_name               = var.key_name
  vpc_security_group_ids = [aws_security_group.staging_sg.id]
  subnet_id              = aws_subnet.staging_subnet.id
  user_data              = file("${path.module}/user_data.sh")
  iam_instance_profile   = aws_iam_instance_profile.ec2_ecr_profile.name
  associate_public_ip_address = var.associate_public_ip

  tags = {
    Name        = "staging-ec2"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }

  lifecycle {
    ignore_changes = [associate_public_ip_address]
  }
}

# -------------------------
# ELASTIC IP
# -------------------------
resource "aws_eip" "staging_eip" {
  tags = {
    Name        = "staging-eip"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

resource "aws_eip_association" "staging_eip_assoc" {
  instance_id   = aws_instance.staging_server.id
  allocation_id = aws_eip.staging_eip.id
}

# -------------------------
# DYNAMODB MODULE
# -------------------------
module "dynamodb" {
  source = "./modules/dynamodb"

  environment              = "staging"
  notifications_table_name = var.dynamodb_notifications_table_name

  # Billing mode (PAY_PER_REQUEST for staging, can switch to PROVISIONED for production)
  billing_mode = var.dynamodb_billing_mode

  # Enable streams for real-time processing
  stream_enabled   = var.dynamodb_stream_enabled
  stream_view_type = var.dynamodb_stream_view_type

  # TTL configuration (auto-delete old notifications after 90 days)
  ttl_enabled        = var.dynamodb_ttl_enabled
  ttl_attribute_name = var.dynamodb_ttl_attribute_name

  # Backup and recovery
  point_in_time_recovery_enabled = var.dynamodb_pitr_enabled
  # Note: prevent_destroy is set directly in the module as a literal value

  # CloudWatch alarms
  enable_cloudwatch_alarms = var.dynamodb_enable_alarms

  # Tags
  common_tags = {
    Project     = "Twitter Backend"
    Environment = "staging"
    ManagedBy   = "Terraform"
    Service     = "DynamoDB"
  }
}

# -------------------------
# SES TEMPLATES MODULE
# -------------------------
module "ses_templates" {
  source = "./templates/email_confirmation"
}
