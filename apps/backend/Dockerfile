# --- 1. Build Stage ---
FROM node:23-alpine AS builder

# Set workdir
WORKDIR /app

# Install turbo globally (optional, si build local)
RUN npm install -g turbo

# Copy package files
COPY . .

# Install dependencies via turbo (dans le monorepo)
RUN corepack enable && turbo prune --scope=backend --docker

# Re-install dependencies for pruned project
WORKDIR /app/out

RUN npm install

# Build backend app
RUN npm run build --workspace=backend

# --- 2. Runtime Stage ---
FROM node:23-alpine AS runner

WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/out/apps/backend/dist ./dist
COPY --from=builder /app/out/apps/backend/package.json ./
COPY --from=builder /app/out/node_modules ./node_modules

# Run backend (adaptable selon le framework)
CMD ["node", "dist/index.js"]
