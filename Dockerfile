# Stage 1: Build the NestJS app
FROM node:20-alpine AS builder
WORKDIR /app

# Copy config and dependency files
COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig*.json ./

# Copy source code
COPY apps ./apps
COPY libs ./libs
# ✅ Ensure build/ is available for postinstall
COPY build ./build       
RUN npm install
RUN npm run build

# Stage 2: Create production image
FROM node:20-alpine AS production
WORKDIR /app

# Copy config and dependency files
COPY package*.json ./
# ✅ Copy build/ folder so postinstall works
COPY build ./build       

# Install only production dependencies
RUN npm install --omit=dev

# Copy the compiled output from builder
COPY --from=builder /app/dist ./dist

# Run the app (adjust this path if your entrypoint is different)
CMD ["node", "dist/apps/api/main"]
