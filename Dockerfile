# 1. Builder stage: install & build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only necessary files for installation and build
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY apps ./apps
COPY libs ./libs
COPY build ./build

# Install dependencies and build the app
RUN npm install
RUN npm run build

# 2. Production image
FROM node:20-alpine

WORKDIR /app

# Copy only what is needed for running the app
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Set environment variable
ENV NODE_ENV=production

# Install only production dependencies (no postinstall scripts)
RUN npm install --only=production --ignore-scripts

# Start the server
CMD ["node", "dist/apps/api/main"]
