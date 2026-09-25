# Harnais d'intégration et e2e

## Invariants partagés

- Les projets Jest `integration` et `e2e` partagent `test/support/`. `globalSetup.ts` déploie les migrations une seule fois par lancement. `setupEnvironment.ts` configure la base PostgreSQL et Redis dédiées aux tests.
- Avant chaque test, le setup partagé vide les tables applicatives avec `TRUNCATE … RESTART IDENTITY CASCADE` et exécute `FLUSHDB`. Les migrations et les tables d'extension PostGIS sont conservées. Le teardown final nettoie les données et ferme ses connexions.
- La base est partagée et Jest utilise un seul worker. Exécuter les commandes d'intégration et e2e séquentiellement et garder les tests sérialisés.
- Utiliser PostgreSQL et Redis réels. Insérer explicitement les données du scénario et réserver les overrides aux fournisseurs externes non déterministes ; garder les modules, guards, services et repositories de production.
- Les conteneurs restent disponibles jusqu'à `pnpm db:test:stop`.

## E2E HTTP et WebSocket

- Tous les e2e créent l'application avec `createTestApp()`. `main.ts` et ce helper appellent `configureApp()` : le routing, les gateways, guards, pipes, filtres, interceptors, middlewares et adaptateurs restent ceux de production.
- En HTTP, conserver l'application initialisée sans `listen()` et appeler `app.getHttpServer()` avec Supertest.
- En WebSocket, exécuter `await app.listen(0)`, récupérer `await app.getUrl()` et utiliser un vrai client Socket.IO. Chaque suite écoute ainsi sur un port éphémère.
- Dériver les routes, noms d'événements et schémas de réponse depuis `@cityborn/api`. Parser les réponses et broadcasts avec les schémas du contrat lorsque leur forme fait partie du comportement observé.
- Utiliser le callback optionnel de `createTestApp()` pour remplacer les fournisseurs externes non déterministes nécessaires au scénario. Conserver PostgreSQL, Redis et le pipeline Nest réels.
- Quand un scénario révèle une incohérence de câblage, le faire passer au rouge, corriger la frontière de production la plus basse responsable, puis le faire repasser au vert par le même transport.

## Teardown e2e

- Suivre chaque client ouvert par la suite. Le fermer dans `afterEach` quand il porte un état propre au scénario, ou dans `afterAll` seulement lorsqu'il est volontairement partagé.
- Attendre les effets serveur asynchrones de la déconnexion — acknowledgement, broadcast, suppression du registre ou disparition de la socket selon le comportement testé — avant de poursuivre.
- Fermer tous les clients avant `await app.close()` dans `afterAll`. Ce séquencement laisse les callbacks de déconnexion terminer avec Redis disponible, puis ferme Prisma et l'adaptateur Redis WebSocket.
- Un test est terminé lorsque ses clients, l'application et les clients d'infrastructure qu'il a créés lui-même sont fermés sans handle ouvert ni erreur de teardown.

Les commandes et coordonnées d'infrastructure sont définies dans `AGENTS.md` et `test/support/setupEnvironment.ts`.
