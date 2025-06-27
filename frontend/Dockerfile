# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies)
RUN npm ci

# Copy source files
COPY . .

RUN npm run build

# Production stage (serving with a static server)
FROM node:18-alpine

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/build ./build

RUN npm set registry https://registry.npmjs.org/
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build"] 