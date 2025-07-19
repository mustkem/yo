#!/bin/bash
set -e

# Log everything
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

echo "======== 🚀 Starting EC2 user_data.sh setup ========"

# Update and install Docker
echo "➡️ Updating system..."
dnf update -y

echo "➡️ Installing Docker..."
dnf install -y docker

echo "✅ Docker installed"
echo "➡️ Starting Docker service..."
systemctl start docker

echo "➡️ Adding ec2-user to docker group..."
usermod -aG docker ec2-user

echo "➡️ Enabling Docker to start on boot..."
systemctl enable docker

# Install AWS CLI
echo "➡️ Installing AWS CLI..."
dnf install -y aws-cli

# Install Docker Compose (v2 plugin binary)
DOCKER_COMPOSE_VERSION="2.24.6"
echo "➡️ Installing Docker Compose v$DOCKER_COMPOSE_VERSION..."
curl -SL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "✅ Docker Compose installed"

# Set up application directory
APP_DIR="/home/ec2-user/twitter-backend-node"
echo "➡️ Creating app directory at $APP_DIR"
mkdir -p $APP_DIR
chown ec2-user:ec2-user $APP_DIR
cd $APP_DIR

# ECR config
echo "➡️ Setting up AWS CLI and ECR login..."
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query 'Account' --output text)
ECR_REPOSITORY="nestjs-app"
ECR_IMAGE="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPOSITORY:latest"

echo "➡️ Logging into Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

echo "➡️ Writing docker-compose.yaml"
cat <<EOF > docker-compose.yaml
version: '3.8'

services:
  app:
    image: $ECR_IMAGE
    container_name: nestjs-app
    ports:
      - "3000:3000"
    restart: always
    environment:
      - DATABASE_HOST=mysql
      - DATABASE_PORT=3306
      - DATABASE_NAME=yoodb
      - DATABASE_USER=yooadmin
      - DATABASE_PASSWORD=yoopass
      - KAFKA_BROKERS=kafka:29092
      - REDIS_HOST=yoo-redis
      - REDIS_PORT=6379
    depends_on:
      - mysql
      - kafka
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 10s
      retries: 5
      timeout: 5s

  mysql:
    image: mysql:8.3
    container_name: yoo-mysql
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: yoodb
      MYSQL_USER: yooadmin
      MYSQL_PASSWORD: yoopass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 5
      timeout: 5s

  kafka:
    image: bitnami/kafka:latest
    container_name: kafka
    restart: always
    ports:
      - "9092:9092"
    environment:
      KAFKA_CFG_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092,INTERNAL://kafka:29092
      KAFKA_CFG_LISTENERS: PLAINTEXT://:9092,INTERNAL://:29092,CONTROLLER://:9093
      KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP: PLAINTEXT:PLAINTEXT,INTERNAL:PLAINTEXT,CONTROLLER:PLAINTEXT
      KAFKA_CFG_INTER_BROKER_LISTENER_NAME: INTERNAL
      KAFKA_KRAFT_MODE_ENABLED: "yes"
      KAFKA_CFG_NODE_ID: "1"
      KAFKA_CFG_PROCESS_ROLES: controller,broker
      KAFKA_CFG_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
      KAFKA_CFG_CONTROLLER_LISTENER_NAMES: CONTROLLER
      ALLOW_PLAINTEXT_LISTENER: "yes"
    volumes:
      - kafka_data:/bitnami/kafka
    healthcheck:
      test: ["CMD", "kafka-topics.sh", "--bootstrap-server", "kafka:29092", "--list"]
      interval: 10s
      retries: 5
      timeout: 5s

  redpanda-console:
    image: docker.redpanda.com/redpandadata/console:latest
    container_name: redpanda-console
    ports:
      - "8080:8080"
    environment:
      - KAFKA_BROKERS=kafka:29092
    depends_on:
      - kafka

  redis:
    image: redis:7-alpine
    container_name: yoo-redis
    restart: always
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      retries: 5
      timeout: 5s

volumes:
  mysql_data:
  redis_data:
  kafka_data:
EOF

echo "✅ docker-compose.yaml written"

# Pull latest image explicitly (safety net)
echo "➡️ Pulling latest images..."
docker-compose pull

# Run as ec2-user to ensure correct permissions
echo "➡️ Starting docker-compose stack..."
sudo -u ec2-user -i bash -c "cd $APP_DIR && docker-compose up -d"

echo "✅ Application stack started"
echo "======== ✅ Finished user_data.sh setup ========"
