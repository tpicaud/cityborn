# Étape 1 — Base avec pnpm + deps
FROM node:24-alpine AS deps

WORKDIR /app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers clés
COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY turbo.json .
COPY apps/backend ./apps/backend
COPY packages ./packages

# Installer les dépendances
RUN pnpm install --frozen-lockfile

# Étape 2 — Builder uniquement l'app ciblée
FROM deps AS builder

COPY . .

# Build le back
RUN pnpm turbo run build --filter=cityborn-backend

# Étape 3 — Image finale pour l'app (runtime only)
FROM node:24-alpine AS runner

WORKDIR /app

# Copier les fichiers nécessaires au runtime
COPY --from=builder /app/apps /app/apps
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json ./package.json

# Expose le port que ton app utilise
EXPOSE 4000

WORKDIR /app/apps/backend

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/main"]