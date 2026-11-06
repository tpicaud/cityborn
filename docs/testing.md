# Tests

Après `pnpm install`, `pnpm test` lance toutes les suites sans infrastructure : API, Core, Client et tests unitaires backend.
L'installation prépare aussi oasdiff 1.26.1, avec vérification SHA-256, dans le cache local de `packages/api`.
Aucune installation globale de cet outil n'est requise pour les tests ou `pnpm check:api-compat`.

`pnpm test:cov` exécute les mêmes tests et produit la couverture dans chaque package, sans seuil bloquant.
`pnpm test:watch` lance leurs modes watch. Chaque package expose aussi ces trois commandes indépendamment.

`pnpm test:all` ajoute l'intégration et les e2e backend. Docker et Compose doivent être disponibles.
La commande lance ses propres conteneurs PostgreSQL/PostGIS et Redis, sur des ports locaux attribués par Docker.
Elle applique les migrations via le setup des suites, lance intégration puis e2e, puis supprime ses conteneurs et volumes.
Le nettoyage s'exécute après réussite, échec ou interruption SIGINT/SIGTERM, y compris si le démarrage échoue.
Les services déjà présents sont conservés. Deux exécutions peuvent coexister.
`pnpm backend test:all` exécute uniquement les suites backend avec la même isolation.

Pour un lancement ciblé, `pnpm db:test:start`, puis `pnpm test:int` ou `pnpm test:e2e`, utilisent les ressources locales habituelles.
Ces deux suites partagent alors la même base et doivent se lancer séquentiellement.
Le lanceur exhaustif transmet ses adresses par `TEST_DATABASE_URL` et `TEST_REDIS_URL`.
Les valeurs par défaut restent les ressources de test locales sur les ports 5433 et 6380.

En CI, hors PR draft, Turbo sélectionne les packages modifiés et leurs consommateurs transitifs.
Chaque package a son propre résultat ; les suites backend d'intégration et e2e ont chacune leurs propres services.
Les fichiers racine, workflows, règles de lint et scripts de test déclenchent toutes les suites.
Les hashes des dépendances partagées invalident les caches de test des consommateurs sans lancer leurs suites.
