#!/bin/bash
set -e

# Log everything
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Update system and install Docker
yum update -y
amazon-linux-extras install docker -y
service docker start
usermod -a -G docker ec2-user

# Install Docker Compose
DOCKER_COMPOSE_VERSION="2.24.6"
curl -SL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Enable Docker on boot
systemctl enable docker

# Login to Docker Hub or ECR (optional, only if private repo)
# echo "$DOCKER_PASSWORD" | docker login -u "$DOCKER_USERNAME" --password-stdin

# Create app directory
mkdir -p /home/ec2-user/app
cd /home/ec2-user/app

# Create docker-compose.yaml
cat <<EOF > docker-compose.yaml
version: '3.8'

services:
  app:
    image: your-dockerhub-username/your-app-image:latest
    ports:
      - "3000:3000"
    restart: always
EOF

# Run the app
docker-compose up -d
