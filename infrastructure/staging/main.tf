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
# VPC + NETWORKING SETUP
# -------------------------
# Create a new VPC
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

# Create Internet Gateway
resource "aws_internet_gateway" "staging_igw" {
  vpc_id = aws_vpc.staging_vpc.id

  tags = {
    Name        = "staging-igw"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

# Create a public subnet
resource "aws_subnet" "staging_subnet" {
  vpc_id                  = aws_vpc.staging_vpc.id
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true

  tags = {
    Name        = "staging-subnet"
    Environment = "staging"
    ManagedBy   = "Terraform"
  }
}

# Create a route table with default route to IGW
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

# Associate route table with subnet
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

  # Allow SSH (change 0.0.0.0/0 to office IP in production)
  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTP
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Allow HTTPS
  ingress {
    from_port   = 443
    to_port     = 443
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

# Allow all inbound
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

# Allow all outbound
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

# Allow inbound ephemeral ports (for SSH replies)
resource "aws_network_acl_rule" "inbound_ephemeral" {
  network_acl_id = aws_network_acl.staging_acl.id
  rule_number    = 102
  egress         = false
  protocol       = "6" # TCP
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 1024
  to_port        = 65535
}

# Allow outbound SSH
resource "aws_network_acl_rule" "outbound_ssh" {
  network_acl_id = aws_network_acl.staging_acl.id
  rule_number    = 103
  egress         = true
  protocol       = "6" # TCP
  rule_action    = "allow"
  cidr_block     = "0.0.0.0/0"
  from_port      = 22
  to_port        = 22
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
