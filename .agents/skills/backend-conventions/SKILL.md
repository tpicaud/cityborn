---
name: backend-conventions
description: Conventions backend NestJS Cityborn (apps/backend) — structure d'un module (controllers/ fins + services/ + mappers/, split *.public.* / *.admin.*, handlers ts-rest), gestion des erreurs (exceptions Nest typées avec ErrorCode de @cityborn/api, filtres globaux qui sérialisent en ApiError, erreurs Prisma déjà mappées) et observabilité (un wide event par requête HTTP et par message WebSocket via WideEventService). À utiliser dès qu'on crée ou modifie un module, controller, service ou mapper dans apps/backend, ou qu'on lève une exception.
---

# Conventions backend (NestJS)

## Structure d'un module

- `feature/feature.module.ts` + `controllers/` + `services/` + `mappers/` (entité DB → DTO du contrat).
- Controllers = handlers ts-rest (`@TsRestHandler(contract.x)` + `tsRestHandler`), **fins** : aucune logique métier, tout dans les services.
- Séparer `*.public.*` / `*.admin.*` (controller + service) quand l'auth ou les règles diffèrent.

## Gestion des erreurs

- Lever une exception Nest **typée** depuis les services : `throw new NotFoundException({ code: ErrorCode.X, message })` (idem `ConflictException`, `BadRequestException`, `UnauthorizedException`). `code` = un `ErrorCode` de `@cityborn/api`, jamais une string libre.
- **Ne jamais construire la réponse HTTP soi-même** : les filtres globaux de `main.ts` sérialisent tout au format `ApiError` `{ statusCode, code, message }` — `DefaultExceptionFilter`, `PrismaExceptionFilter`, `RequestValidationErrorFilter`.
- Erreurs Prisma (`P2002`, `P2025`, …) déjà mappées par `PrismaExceptionFilter` — ne pas les `catch` pour les relancer.
- `installFrenchZodErrorMap()` est déjà appelé au bootstrap (`apps/backend/src/main.ts`).

## Observabilité — wide event par unité de travail

- **Une seule ligne de log par requête HTTP** (`event: 'http_request'`, `msg: 'request'`) et **par message WebSocket** (`event: 'ws_message'`, `msg: 'message'`), succès, erreur ou interruption. Le middleware `HttpWideEventMiddleware` ouvre et finalise le contexte HTTP avant guards et routing ; `WsWideEventLifecycle`, branché dans `RedisIoAdapter`, enveloppe chaque callback avant le pipeline Nest. Ne pas réintroduire l'émission dans un interceptor.
- Chaque événement expose un `domain` et un `outcome` bornés. Le test `wide-event-domain.audit.spec.ts` inventorie automatiquement les routes du contrat et les messages des gateways ; il doit échouer si un nouveau domaine n'est pas déclaré dans `WIDE_EVENT_DOMAINS`. L'opération est déduite sans table par route : `method + route` pour HTTP, `eventName` pour WS. Une route 404 non reconnue devient `<unmatched>` afin de ne pas créer une dimension libre.
- Le contexte vit dans un `AsyncLocalStorage` (`nestjs-cls`), une entrée par requête / message. Injecter `WideEventService` et utiliser l'API structurée adaptée : `enrichAuth`, `enrichRateLimit`, `enrichBusinessContext` ou `enrichError`. Depuis un filtre global non injectable, utiliser `enrichWideEventFromCls`. Seuls les événements passés par `finalize` peuvent être émis. **Ne jamais** ajouter de `logger.log(...)` ad hoc pour tracer une requête ou un message — enrichir le wide event.
- **Erreurs : jamais de ligne à part.** Les `ExceptionFilter` (HTTP + WS) et `WsErrorInterceptor` replient l'erreur dans le wide event via `enrichWideEventFromCls(toWideEventErrorFields(payload, exception))` → `errorCode` / `errorMessage` (+ `errorStack` pour les 5xx et `UNKNOWN_ERROR`). `logWsApiError` ne subsiste qu'en fallback hors contexte CLS pendant le cycle de connexion du gateway.
- Enrichissements déjà branchés : `AuthGuard` / `OptionalAuthGuard` → `userId` / `isAuthenticated` ; `RateLimitGuard` → `rateLimitBucket` / `rateLimitRemaining` / `rateLimitStatus` ; `SessionGateway` → `sessionId` / `playerId` / `gameId`.
- `requestId` est partagé avec les autres logs Pino du même contexte. `pino-http` `autoLogging` reste à `false` (`common/logger/logger.params.ts`) : aucune ligne HTTP automatique.

## Garde-fou DB

Migrations Prisma : voir *Garde-fous* dans `AGENTS.md`.
