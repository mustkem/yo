#!/bin/bash
set -e

# Log everything
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

# Update system and install Docker
yum update -y
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user
systemctl enable docker

# Install Docker Compose
DOCKER_COMPOSE_VERSION="2.24.6"
curl -SL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Wait for EC2 instance metadata to be available
sleep 5

# Login to ECR (use EC2 IAM role)
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
docker login --username AWS --password $(aws ecr get-login-password --region $AWS_REGION) $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create app directory
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# Create docker-compose.yaml using ECR image
cat <<EOF > docker-compose.yaml
version: '3.8'

services:
  app:
    image: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/nestjs-app:latest
    ports:
      - "3000:3000"
    restart: always
EOF

# Pull latest image and run container
docker-compose pull
docker-compose up -d
