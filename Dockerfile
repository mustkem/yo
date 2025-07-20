# 1. Base image
FROM node:20-alpine AS builder

WORKDIR /app

# 2. Copy package files and install dependencies
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./
COPY apps ./apps
COPY libs ./libs

RUN npm install
RUN npm run build

# 3. Create production image
FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY package*.json ./

RUN npm install --only=production

CMD ["node", "dist/apps/api/main"]
