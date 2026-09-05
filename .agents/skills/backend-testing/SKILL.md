---
name: backend-testing
description: Conventions des tests backend Cityborn (apps/backend) — choix exclusif entre unitaire / intégration / e2e, nommage, AAA, mocks, fixtures et harnais Jest partagé. À utiliser dès qu'on crée, modifie, relit ou vérifie un test backend, ou qu'on choisit le tier d'un comportement.
---

# Tests backend

## Choisir un seul tier

Chaque comportement est couvert dans **un seul tier**, le plus bas qui permette de l'observer. Ne pas répéter en e2e les branches métier déjà démontrées en unitaire, ni les détails d'infrastructure déjà couverts en intégration.

| Tier | Suffixe et emplacement | Périmètre exclusif |
|---|---|---|
| Unitaire | `*.unit.spec.ts`, colocé avec le code dans `src/` ; les tests des helpers de support restent sous `test/support/` | Logique isolée sans infrastructure ni application Nest : combinatoire métier, chaque branche et chaque `ErrorCode` levé. Les dépendances sont mockées. |
| Intégration | `*.integration.spec.ts` sous `test/integration/` | Contact réel avec PostgreSQL, Redis, les locks ou un autre adaptateur d'infrastructure, sans transport HTTP/WS ni bootstrap complet de l'application. |
| E2E | `*.e2e.spec.ts` sous `test/e2e/` | Câblage bout-à-bout via HTTP ou WS : bootstrap de production, routing/gateway, guards, validation, filtres et sérialisation. Ne pas y exhaustiver les branches métier. |

## Nommer et structurer

- En unitaire, un `describe` cible une méthode ou fonction : `describe('SessionService.kickPlayer', ...)`. En intégration et e2e, il nomme la frontière observée.
- Un `it` décrit en anglais un comportement au présent (`rejects when the requester is not the host`), jamais avec `should`.
- Un `it` couvre un seul comportement. Plusieurs assertions sont permises lorsqu'elles caractérisent ensemble ce même résultat.
- Séparer Arrange, Act et Assert par une ligne vide, sans commentaires `Arrange` / `Act` / `Assert`.
- Pour les doubles typés, importer `createMock<T>()` depuis `test/support/createMock`, configurer explicitement les retours utiles au scénario et ne jamais utiliser `as unknown as`.
- Pour chaque type métier principal défini dans un package partagé, placer son builder dans ce même package, dans un fichier dédié, puis l'exporter et le réutiliser dans les tests consommateurs. Ne pas redéfinir ce builder dans une app.
- Ne pas créer de builder partagé pour un DTO secondaire, un type d'infrastructure ou une forme locale ponctuelle : garder ces données près du test.
- Tous les builders acceptent des overrides typés et retournent des données indépendantes à chaque appel. `test/support/fixtures/` ne contient que les fixtures propres au backend et les éventuelles réexportations de builders partagés utiles à sa suite de tests.

## Harnais d'intégration et e2e

- Les projets Jest `integration` et `e2e` partagent `test/support/`. `globalSetup.ts` déploie les migrations une seule fois par lancement. `setupEnvironment.ts` force PostgreSQL sur `localhost:5433/cityborn_test` et Redis sur `localhost:6380/0` ; ne pas créer de `.env.test`.
- Avant chaque test, le setup partagé vide les tables applicatives avec `TRUNCATE … RESTART IDENTITY CASCADE` et exécute `FLUSHDB`. Les migrations et les tables d'extension PostGIS sont conservées. Le teardown final nettoie les données et ferme ses connexions.
- La base est partagée et Jest utilise un seul worker : ne jamais lancer plusieurs commandes d'intégration/e2e en parallèle ni utiliser `test.concurrent`.
- Un test qui ouvre ses propres clients les ferme dans `afterAll`. Les conteneurs restent disponibles jusqu'à `pnpm db:test:stop`.
- `main.ts` et `test/support/createTestApp.ts` appellent `configureApp()` : garder la configuration HTTP/WS dans cette fonction partagée. Les filtres globaux et handlers ts-rest restent enregistrés par les modules de production ; ne pas créer de pipeline propre aux tests.
- Tous les e2e utilisent `createTestApp()` puis `await app.close()` dans `afterAll`. Son callback optionnel sert aux overrides Nest de services externes. Prisma et l'adaptateur Redis WebSocket ferment leurs connexions au teardown Nest.

## Exemples canoniques

Unitaire — dépendances mockées, `describe` au niveau de la méthode et branche métier unique :

```typescript
describe('SessionService.kickPlayer', () => {
  it('rejects when the requester is not the host', async () => {
    const session = buildSession();
    const { sessionService } = buildSessionService(session);

    const result = sessionService.kickPlayer('bob', session.id, 'host');

    await expect(result).rejects.toMatchObject({
      response: { code: ErrorCode.SESSION_FORBIDDEN_HOST },
    });
  });
});
```

Intégration — vraie infrastructure, sans transport :

```typescript
describe('User persistence', () => {
  const infrastructure = createTestInfrastructure();

  afterAll(async () => {
    await infrastructure.close();
  });

  it('persists a user in PostgreSQL', async () => {
    const user = buildUser();
    await infrastructure.prisma.user.create({ data: user });

    const persistedUser = await infrastructure.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });

    expect(persistedUser).toMatchObject(user);
  });
});
```

E2E — application réelle traversée par HTTP :

```typescript
describe('GET /health', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns the service health through the production bootstrap', async () => {
    const path = contract.health.check.path;

    const response = await request(app.getHttpServer()).get(path);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({});
  });
});
```
