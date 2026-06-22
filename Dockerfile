# Build stage
FROM node:20-alpine AS builder
RUN npm install -g pnpm
WORKDIR /app

# Copy lockfile and workspace definitions
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json tsconfig.base.json ./
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/

# Install dependencies and build all projects
RUN pnpm install --frozen-lockfile
RUN pnpm --filter @workspace/api-server build

# Production stage
FROM node:20-alpine
RUN npm install -g pnpm
WORKDIR /app

# Copy build artifacts and dependencies
COPY --from=builder /app /app

# Hugging Face Spaces requires the container to listen on port 7860
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production

# Start the API server
CMD ["pnpm", "--filter", "@workspace/api-server", "start"]
