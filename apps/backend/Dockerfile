# Étape 1 — Base avec pnpm + deps
FROM node:23-alpine AS deps

WORKDIR /app

# Installer pnpm
RUN npm install -g pnpm

# Copier les fichiers clés
COPY turbo.json .
COPY pnpm-workspace.yaml .
COPY package.json .
COPY pnpm-lock.yaml .
COPY apps ./apps
COPY packages ./packages

# Installer les dépendances
RUN pnpm install --no-frozen-lockfile

# Étape 2 — Builder uniquement l'app ciblée
FROM deps AS builder

COPY . .

# Construire l'app ciblée (on passera le filtre en build arg)
ARG FILTER
RUN pnpm turbo run build --filter=backend

# Étape 3 — Image finale pour l'app (runtime only)
FROM node:23-alpine AS runner

WORKDIR /app

# Copier les fichiers nécessaires au runtime
COPY --from=builder /app/apps /app/apps
COPY --from=builder /app/packages /app/packages
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/package.json ./

# Expose le port que ton app utilise
EXPOSE 3000

# Démarrage : à ajuster selon app
CMD ["node", "apps/backend/dist/server.js"]

