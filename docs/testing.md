# Tests

Après `pnpm install`, `pnpm test` lance toutes les suites sans infrastructure : API, Core, Client et tests unitaires backend.
L'installation prépare aussi oasdiff 1.26.1, avec vérification SHA-256, dans le cache local de `packages/api`.
Cet outillage prend en charge Linux et macOS, sur x64 et arm64.
Aucune installation globale de cet outil n'est requise pour les tests ou `pnpm check:api-compat`.

`pnpm test:cov` exécute les mêmes tests et produit la couverture dans chaque package, sans seuil bloquant.
`pnpm test:watch` lance leurs modes watch. Chaque package expose aussi ces trois commandes indépendamment.
API, Core et Client découvrent les fichiers `**/*.test.ts` dans tout leur package.
Le backend découvre ses tests par suffixe : `*.unit.spec.ts`, `*.integration.spec.ts` et `*.e2e.spec.ts`, quel que soit leur dossier.

`pnpm test:all` lance toutes les suites via Turbo : API, Core, Client et backend.
Dans chaque package, `pnpm test:all` lance toutes ses suites ; le backend enchaîne unitaires, intégration puis e2e.
Les exécutions exhaustives ne sont pas mises en cache.

Avant les tests avec infrastructure, démarrer les ressources locales PostgreSQL/PostGIS et Redis avec `pnpm db:test:start`.
Lancer ensuite `pnpm test:all`, ou une commande ciblée : `pnpm backend test:all`, `pnpm test:int` ou `pnpm test:e2e`.
Les migrations sont appliquées par le setup des suites.
Les ressources restent démarrées après les tests ; `pnpm db:test:stop` les arrête.
L'intégration et les e2e partagent la même base : deux exécutions utilisant ces ressources doivent se lancer séquentiellement.
Les variables `TEST_DATABASE_URL` et `TEST_REDIS_URL` permettent de cibler d'autres ressources déjà disponibles.
Les valeurs par défaut ciblent les ressources locales de test sur les ports 5433 et 6380.
Les tests de restauration nécessitent également Docker et gèrent eux-mêmes leurs conteneurs temporaires.

En CI, chaque PR hors draft lance toutes les suites, sans sélection des fichiers modifiés.
Chaque package a son propre résultat ; les suites backend d'intégration et e2e ont chacune leurs propres services.
Les hashes des dépendances partagées invalident les caches de test des consommateurs sans lancer leurs suites.
