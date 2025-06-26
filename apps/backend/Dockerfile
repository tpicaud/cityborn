# Étape 1 : Builder le projet avec Turbo depuis la racine
FROM node:23-alpine AS builder

WORKDIR /repo

# Installer pnpm
RUN corepack enable && corepack prepare pnpm@10.12.3 --activate

# Copier les fichiers nécessaires pour l'installation et le build
COPY . .

# Installer les dépendances de tout le monorepo (avec le cache partagé)
RUN pnpm install --no-frozen-lockfile

# Builder uniquement le backend
RUN pnpm turbo run build --filter=backend...

# Étape 2 : Image finale, uniquement avec les fichiers nécessaires à l’exécution
FROM node:20-alpine

WORKDIR /app

# Installer pnpm
RUN corepack enable && corepack prepare pnpm@10.12.3 --activate

# Copier package.json du backend pour réinstaller les deps prod
COPY apps/backend/package.json ./
COPY pnpm-lock.yaml ./

# Installer seulement les deps runtime
RUN pnpm install --prod --no-frozen-lockfile

# Copier le build du backend depuis l’étape builder
COPY --from=builder /repo/dist/apps/backend ./dist

EXPOSE 3000

CMD ["node", "dist/server.js"]
