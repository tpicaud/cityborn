---
name: backend-conventions
description: Conventions backend NestJS Cityborn (apps/backend) — structure d'un module (controllers/ fins + services/ + mappers/, split *.public.* / *.admin.*, handlers ts-rest), gestion des erreurs (exceptions Nest typées avec ErrorCode de @cityborn/api, filtres globaux qui sérialisent en ApiError, erreurs Prisma déjà mappées) et observabilité (un wide event par requête HTTP via WideEventService). À utiliser dès qu'on crée ou modifie un module, controller, service ou mapper dans apps/backend, ou qu'on lève une exception.
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

## Observabilité — wide event par requête

- **Une seule ligne de log par requête HTTP** (`msg: 'request'`, `event: 'http_request'`), émise par `WideEventInterceptor` (global) sur `response` `finish`/`close` — donc **après** les `ExceptionFilter`. Succès comme erreur. Niveau dérivé du `statusCode` : `info` (< 400), `warn` (4xx), `error` (5xx).
- Le contexte vit dans un `AsyncLocalStorage` (`nestjs-cls`) : `WideEventModule` crée le `WideEvent` par requête (`createWideEvent`, dans `src/common/wide-event/`), les guards l'enrichissent (`AuthGuard`/`OptionalAuthGuard` → `userId` / `isAuthenticated` ; `RateLimitGuard` → `rateLimitBucket` / `rateLimitRemaining`).
- **Les `ExceptionFilter` n'écrivent pas de ligne** : sur le chemin HTTP ils enrichissent le wide event via `enrichWideEventFromCls(toWideEventErrorFields(payload, exception))` → `errorCode` / `errorMessage`, plus `errorStack` uniquement pour les 5xx et `UNKNOWN_ERROR`. `logWsApiError` (`common/filters/utils.ts`) ne sert plus qu'au contexte WebSocket.
- Pour ajouter un champ au wide event : depuis un guard/interceptor injecter `WideEventService` et appeler `enrich({ … })` ; depuis un filtre global (non injectable, `new` dans `main.ts`) utiliser `enrichWideEventFromCls({ … })`. **Ne pas** ajouter de `logger.log(...)` ad hoc pour tracer une requête — enrichir le wide event.
- `pino-http` `autoLogging` est à `false` (`common/logger/logger.params.ts`) : aucune ligne automatique par requête.
- Hors périmètre actuel (sous-issue dédiée) : les messages WebSocket ne sont pas fusionnés dans le wide event.

## Garde-fou DB

Migrations Prisma : voir *Garde-fous* dans `AGENTS.md`.
