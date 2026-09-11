# Harnais d'intégration et e2e

- Les projets Jest `integration` et `e2e` partagent `test/support/`. `globalSetup.ts` déploie les migrations une seule fois par lancement. `setupEnvironment.ts` configure la base PostgreSQL et Redis dédiées aux tests.
- Avant chaque test, le setup partagé vide les tables applicatives avec `TRUNCATE … RESTART IDENTITY CASCADE` et exécute `FLUSHDB`. Les migrations et les tables d'extension PostGIS sont conservées. Le teardown final nettoie les données et ferme ses connexions.
- La base est partagée et Jest utilise un seul worker. Exécuter les commandes d'intégration et e2e séquentiellement et garder les tests sérialisés.
- Un test qui ouvre ses propres clients les ferme dans `afterAll`. Les conteneurs restent disponibles jusqu'à `pnpm db:test:stop`.
- `main.ts` et `test/support/createTestApp.ts` appellent `configureApp()` : garder la configuration HTTP/WS dans cette fonction partagée. Les filtres globaux et handlers ts-rest restent enregistrés par les modules de production.
- Tous les e2e utilisent `createTestApp()` puis `await app.close()` dans `afterAll`. Son callback optionnel sert aux overrides Nest de services externes. Prisma et l'adaptateur Redis WebSocket ferment leurs connexions au teardown Nest.

Les commandes et coordonnées d'infrastructure sont définies dans `AGENTS.md` et `test/support/setupEnvironment.ts`.
