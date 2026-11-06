# Tests

Après `pnpm install`, `pnpm test` lance toutes les suites sans infrastructure : API, Core, Client et tests unitaires backend.
L'installation prépare aussi oasdiff 1.26.1, avec vérification SHA-256, dans le cache local de `packages/api`.
Cet outillage prend en charge Linux et macOS, sur x64 et arm64.
Aucune installation globale de cet outil n'est requise pour les tests ou `pnpm check:api-compat`.

`pnpm test:cov` exécute les mêmes tests et produit la couverture dans chaque package, sans seuil bloquant.
`pnpm test:watch` lance leurs modes watch. Chaque package expose aussi ces trois commandes indépendamment.
API, Core et Client découvrent les fichiers `**/*.test.ts` dans tout leur package.
Le backend découvre ses tests par suffixe : `*.unit.spec.ts`, `*.integration.spec.ts` et `*.e2e.spec.ts`, quel que soit leur dossier.

`pnpm test:all` ajoute l'intégration et les e2e backend. Docker et Compose doivent être disponibles.
La commande lance ses propres conteneurs PostgreSQL/PostGIS et Redis, sur des ports locaux attribués par Docker.
Elle applique les migrations via le setup des suites, lance intégration puis e2e, puis supprime ses conteneurs et volumes.
Le nettoyage s'exécute après réussite, échec ou interruption SIGINT/SIGTERM, y compris si le démarrage échoue.
Les conteneurs temporaires des tests de restauration sont étiquetés par `TEST_DOCKER_RUN_ID` et nettoyés eux aussi.
Les services déjà présents sont conservés. Deux exécutions peuvent coexister.
Le lanceur racine `scripts/tests/run-all.sh` coordonne la préparation des ressources, les suites et le nettoyage.
Son `compose.yml` décrit des ressources jetables, séparées du Compose backend utilisé pour les ressources locales à ports fixes et données persistantes.
`pnpm backend test:all` enchaîne uniquement les suites backend : unitaires, intégration puis e2e.
Cette commande nécessite des ressources de test déjà démarrées et ne gère pas leur cycle de vie.

Pour utiliser les ressources locales habituelles, lancer `pnpm db:test:start`, puis `pnpm backend test:all`, `pnpm test:int` ou `pnpm test:e2e`.
L'intégration et les e2e partagent alors la même base et doivent se lancer séquentiellement.
Le lanceur exhaustif transmet ses adresses par `TEST_DATABASE_URL` et `TEST_REDIS_URL`.
Les valeurs par défaut restent les ressources de test locales sur les ports 5433 et 6380.

En CI, chaque PR hors draft lance toutes les suites, sans sélection des fichiers modifiés.
Chaque package a son propre résultat ; les suites backend d'intégration et e2e ont chacune leurs propres services.
Les hashes des dépendances partagées invalident les caches de test des consommateurs sans lancer leurs suites.
