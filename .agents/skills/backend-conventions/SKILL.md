---
name: backend-conventions
description: Conventions backend NestJS Cityborn (apps/backend) — structure des modules, gestion des erreurs, observabilité et tests unitaires / intégration / e2e. À utiliser dès qu'on crée ou modifie un module, controller, service, mapper ou test dans apps/backend, ou qu'on lève une exception Nest.
---

# Conventions backend (NestJS)

## Structure d'un module

- `feature/feature.module.ts` + `controllers/` + `services/` + `mappers/` (entité DB → DTO du contrat).
- Controllers = handlers ts-rest (`@TsRestHandler(contract.x)` + `tsRestHandler`), **fins** : aucune logique métier, tout dans les services.
- Séparer `*.public.*` / `*.admin.*` (controller + service) quand l'auth ou les règles diffèrent.

## Gestion des erreurs

- Lever une exception Nest **typée** depuis les services : `throw new NotFoundException({ code: ErrorCode.X, message })` (idem `ConflictException`, `BadRequestException`, `UnauthorizedException`). `code` = un `ErrorCode` de `@cityborn/api`, jamais une string libre.
- **Ne jamais construire la réponse d'erreur HTTP/WS dans un service** : `DefaultExceptionFilter`, injectable et global via `APP_FILTER` pour HTTP, sérialise les exceptions en `ApiError`. Les gateways l'appliquent avec `@UseFilters(DefaultExceptionFilter)` ; le filtre répond par acknowledgement WS, ou par événement `error` si aucun acknowledgement n'est fourni.
- `normalizeException` centralise la conversion Nest / WS / Prisma / validation ts-rest / corps trop volumineux. Les erreurs Prisma (`P2002`, `P2025`, …) y sont déjà mappées pour les deux transports — ne pas les `catch` pour les relancer.
- **Aucun `catch` d'erreur dans les services, guards ou handlers de messages** : laisser les erreurs remonter au filtre, sans les absorber, les envelopper ou les logger localement. Seuls les callbacks de connexion/déconnexion WS, hors pipeline des filtres Nest, peuvent les intercepter. Un `try/finally` reste autorisé pour libérer une ressource.
- Les messages 5xx publics restent génériques ; le diagnostic interne conserve l'exception originale et sa chaîne de causes bornée. Les erreurs JWT et les rejets `RateLimiterRes` sont classifiés centralement en 401 et 429 ; une panne du rate limiter remonte en 500.
- `installFrenchZodErrorMap()` est déjà appelé au bootstrap (configuration partagée `apps/backend/src/configure-app.ts`).

## Observabilité — un récapitulatif par opération

- **Une seule ligne récapitulative par opération** : requête HTTP (`event: 'http_request'`), message WS traité (`event: 'ws_message'`), connexion WS (`event: 'ws_connection'`) et déconnexion WS (`event: 'ws_disconnection'`). Côté WS, `kind` (`'message' | 'connection' | 'disconnection'`) discrimine la forme de la ligne ; un nouveau `kind` s'ajoute à `WsWideEventKind` et à `wideEventLogShapes`. `WideEventService.run` ouvre le contexte CLS ; `finish` calcule durée, résultat et niveau, puis émet une seule fois. Les enrichissements ne modifient plus un événement finalisé.
- `HttpWideEventMiddleware` est branché au début de `configureApp()`, avant CORS, parsers, guards et routing. Il termine sur `finish` ou `close`. `WsWideEventLifecycle`, branché dans `RedisIoAdapter`, ouvre le contexte **à la souscription** et y exécute le pipeline Nest complet ; il termine à la complétion ou à l'annulation. Ne pas déplacer l'émission dans un interceptor ni construire une réponse métier dans le lifecycle.
- Les callbacks `handleConnection` / `handleDisconnect` de la gateway ouvrent leur propre contexte via `runConnectionWideEvent` (`session:connect` / `session:disconnect`), qui enrichit l'auth depuis `socket.data.user` et appelle `finish` dans un `finally`. Une gateway qui instrumente ses callbacks suit ce modèle ; elle ne logue pas la connexion en texte libre.
- Dans les services et guards, utiliser uniquement `enrichAuth`, `enrichRateLimit` ou `enrichBusinessContext` pour le contexte normal. Le filtre est le seul responsable de l’enregistrement des erreurs de requête/message ; le lifecycle WS ne les intercepte pas.
- `recordError` est réservé au filtre et aux callbacks de connexion/déconnexion WS. Il normalise, enregistre et retourne l'`ApiError`. Sous un contexte actif il enrichit l'événement en cours — c'est le cas des callbacks WS depuis leur instrumentation. Sans contexte actif, ou après finalisation, il émet un diagnostic structuré autonome. Les erreurs tardives restent ainsi visibles sans réémettre le récapitulatif. Les événements d'infrastructure (Redis, démarrage) peuvent avoir leurs propres logs.
- `domain` et `outcome` sont bornés. Déclarer les nouveaux domaines dans `WIDE_EVENT_DOMAINS`. L'opération est `method + route` pour HTTP, `eventName` pour WS ; une route non reconnue devient `<unmatched>`, sans URL libre dans cette dimension.
- `WideEventService` utilise le `PinoLogger` existant. Le `requestId` CLS est aussi utilisé par `pino-http` et les autres logs Pino ; `autoLogging` reste à `false`. Aucun logger Pino séparé pour les wide events.

## Garde-fou DB

Migrations Prisma : voir *Garde-fous* dans `AGENTS.md`.

## Tests backend

### Choisir un seul tier

Chaque comportement est couvert dans **un seul tier**, le plus bas qui permette de l'observer. Ne pas répéter en e2e les branches métier déjà démontrées en unitaire, ni les détails d'infrastructure déjà couverts en intégration.

| Tier | Suffixe et emplacement | Périmètre exclusif |
|---|---|---|
| Unitaire | `*.unit.spec.ts`, colocé avec le code dans `src/` ; les tests des helpers de support restent sous `test/support/` | Logique isolée sans infrastructure ni application Nest : combinatoire métier, chaque branche et chaque `ErrorCode` levé. Les dépendances sont mockées. |
| Intégration | `*.integration.spec.ts` sous `test/integration/` | Contact réel avec PostgreSQL, Redis, les locks ou un autre adaptateur d'infrastructure, sans transport HTTP/WS ni bootstrap complet de l'application. |
| E2E | `*.e2e.spec.ts` sous `test/e2e/` | Câblage bout-à-bout via HTTP ou WS : bootstrap de production, routing/gateway, guards, validation, filtres et sérialisation. Ne pas y exhaustiver les branches métier. |

### Nommer et structurer

- En unitaire, un `describe` cible une méthode ou fonction : `describe('SessionService.kickPlayer', ...)`. En intégration et e2e, il nomme la frontière observée.
- Un `it` décrit en anglais un comportement au présent (`rejects when the requester is not the host`), jamais avec `should`.
- Un `it` couvre un seul comportement. Plusieurs assertions sont permises lorsqu'elles caractérisent ensemble ce même résultat.
- Séparer Arrange, Act et Assert par une ligne vide, sans commentaires `Arrange` / `Act` / `Assert`.
- Pour les doubles typés, importer `createMock<T>()` depuis `test/support/createMock`, configurer explicitement les retours utiles au scénario et ne jamais utiliser `as unknown as`.
- Définir les fixtures d'entité réutilisables dans `test/support/fixtures/` et les exporter depuis son barrel. Leurs builders utilisent les types de `@cityborn/api`, acceptent des overrides et retournent des données indépendantes à chaque appel.

### Harnais d'intégration et e2e

- Les projets Jest `integration` et `e2e` partagent `test/support/`. `globalSetup.ts` déploie les migrations une seule fois par lancement. `setupEnvironment.ts` force PostgreSQL sur `localhost:5433/cityborn_test` et Redis sur `localhost:6380/0` ; ne pas créer de `.env.test`.
- Avant chaque test, le setup partagé vide les tables applicatives avec `TRUNCATE … RESTART IDENTITY CASCADE` et exécute `FLUSHDB`. Les migrations et les tables d'extension PostGIS sont conservées. Le teardown final nettoie les données et ferme ses connexions.
- La base est partagée et Jest utilise un seul worker : ne jamais lancer plusieurs commandes d'intégration/e2e en parallèle ni utiliser `test.concurrent`.
- Un test qui ouvre ses propres clients les ferme dans `afterAll`. Les conteneurs restent disponibles jusqu'à `pnpm db:test:stop`.
- `main.ts` et `test/support/createTestApp.ts` appellent `configureApp()` : garder la configuration HTTP/WS dans cette fonction partagée. Les filtres globaux et handlers ts-rest restent enregistrés par les modules de production ; ne pas créer de pipeline propre aux tests.
- Tous les e2e utilisent `createTestApp()` puis `await app.close()` dans `afterAll`. Son callback optionnel sert aux overrides Nest de services externes. Prisma et l'adaptateur Redis WebSocket ferment leurs connexions au teardown Nest.

### Exemples canoniques

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
