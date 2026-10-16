# Tests backend

## Niveaux

| Niveau | Couvre |
|---|---|
| Unitaire | La logique isolée, dépendances mockées : chaque branche métier et chaque code d'erreur levé. |
| Intégration | Le contact réel avec PostgreSQL, Redis ou un autre adaptateur d'infrastructure, sans transport ni application complète. |
| E2E | Le câblage de bout en bout par HTTP ou WebSocket : guards, validation, filtres, sérialisation. |

- Un e2e se justifie seulement pour une route, un event ou un guard qui active un pipeline distinct ; il couvre un chemin nominal et un rejet représentatif.

## Unitaire

- Un `describe` par méthode testée ; sans `describe` parent qui nomme la classe, il se nomme `Classe.méthode`.
- Les doubles typés viennent de `createMock<T>()` (`@golevelup/ts-jest`), avec les seuls retours utiles au scénario.

## Intégration

- Un fichier par repository ou adaptateur testé ; les rollbacks de transactions qui coordonnent plusieurs repositories sont regroupés dans un seul fichier.
- La base et Redis sont vidés avant chaque test : chaque test insère explicitement ses données.
- Un helper Prisma fait une seule insertion et reçoit l'objet à insérer.
- PostgreSQL, Redis, modules, services et repositories restent ceux de production ; seuls les fournisseurs externes non déterministes sont remplacés.

## E2E

- L'application est créée par `createTestApp()`, qui reprend la configuration de production ; son callback remplace les fournisseurs externes non déterministes.
- HTTP : l'application reste sans `listen()`, Supertest appelle `app.getHttpServer()`.
- WebSocket : `app.listen(0)`, puis un vrai client Socket.IO sur `app.getUrl()`.
- Routes, events et schémas de réponse viennent de `@cityborn/api`.
- Teardown :
  - chaque client ouvert est fermé en `afterEach`, ou en `afterAll` s'il est volontairement partagé ;
  - la fermeture attend les effets serveur de la déconnexion ;
  - tous les clients sont fermés avant `app.close()`.

## Commandes

- `pnpm db:test:start` avant `pnpm test:int` ou `pnpm test:e2e`.
- Intégration et e2e se lancent l'un après l'autre : ils partagent la base de test.
