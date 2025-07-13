#!/bin/bash
set -e

# Log everything
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

echo "======== 🚀 Starting EC2 user_data.sh setup ========"

# Update and install Docker
echo "➡️ Updating system..."
dnf update -y

echo "➡️ Installing Docker..."
dnf install docker -y

echo "✅ Docker installed"
echo "➡️ Starting Docker service..."
systemctl start docker

echo "➡️ Adding ec2-user to docker group..."
usermod -a -G docker ec2-user

echo "➡️ Enabling Docker to start on boot..."
systemctl enable docker

# Install Docker Compose
DOCKER_COMPOSE_VERSION="2.24.6"
echo "➡️ Installing Docker Compose v$DOCKER_COMPOSE_VERSION..."
curl -SL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "✅ Docker Compose installed"

# Set up application directory
APP_DIR="/home/ec2-user/twitter-backend-node"
echo "➡️ Creating app directory at $APP_DIR"
mkdir -p $APP_DIR
cd $APP_DIR

echo "➡️ Writing docker-compose.yaml"
cat <<EOF > docker-compose.yaml
version: "3.8"
services:
  app:
    image: your-ecr-repo/image-name:latest
    ports:
      - "3000:3000"
    restart: always
EOF

echo "✅ docker-compose.yaml written"

# Start the app
echo "➡️ Starting docker-compose service..."
docker-compose up -d

echo "✅ Application container started"
echo "======== ✅ Finished user_data.sh setup ========"