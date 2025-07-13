# Stage 1: Build NestJS app
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS production
WORKDIR /app

COPY package*.json ./
COPY . .                 # ✅ Make sure the whole app (including build/postInstall.js) is present

RUN npm install --omit=dev   

CMD ["node", "dist/main"]
