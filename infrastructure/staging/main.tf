provider "aws" {
  region = "us-east-1" # or your desired region
}

resource "aws_instance" "staging_server" {
  ami           = "ami-0f58b397bc5c1f2e8" # Amazon Linux 2023
  instance_type = "t3.medium"
  key_name      = "your-key-name" # must exist in AWS

  tags = {
    Name = "staging-ec2"
  }

  vpc_security_group_ids = [aws_security_group.staging_sg.id]
}

resource "aws_security_group" "staging_sg" {
  name        = "staging-sg"

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
}
