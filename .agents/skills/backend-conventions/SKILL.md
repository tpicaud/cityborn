---
name: backend-conventions
description: Architecture backend NestJS Cityborn. À utiliser pour modifier la structure d'un module, la gestion des erreurs ou l'observabilité dans apps/backend.
---

# Conventions backend (NestJS)

## Structure d'un module

- `feature/feature.module.ts` + `controllers/` + `services/` + `mappers/` (entité DB → DTO du contrat).
- Controllers = handlers ts-rest (`@TsRestHandler(contract.x)` + `tsRestHandler`), **fins** : aucune logique métier, tout dans les services.
- Séparer `*.public.*` / `*.admin.*` (controller + service) quand l'auth ou les règles diffèrent.

## Gestion des erreurs

- Lever une exception Nest **typée** depuis les services : `throw new NotFoundException({ code: ErrorCode.X, message })` (idem `ConflictException`, `BadRequestException`, `UnauthorizedException`). `code` = un `ErrorCode` de `@cityborn/api`, jamais une string libre.
- Le `DefaultExceptionFilter`, injectable et global via `APP_FILTER` pour HTTP, construit les réponses `ApiError`. Les gateways l'appliquent avec `@UseFilters(DefaultExceptionFilter)` ; le filtre répond par acknowledgement WS, ou par événement `error` si aucun acknowledgement n'est fourni.
- `normalizeException` centralise la conversion Nest / WS / Prisma / validation ts-rest / corps trop volumineux. Laisser les erreurs Prisma (`P2002`, `P2025`, …) remonter : elles y sont déjà mappées pour les deux transports.
- Dans les services, guards et handlers de messages, laisser les erreurs remonter au filtre. Les callbacks de connexion/déconnexion WS, hors pipeline des filtres Nest, peuvent les intercepter. Utiliser `try/finally` pour libérer une ressource.
- Les messages 5xx publics restent génériques ; le diagnostic interne conserve l'exception originale et sa chaîne de causes bornée. Les erreurs JWT et les rejets `RateLimiterRes` sont classifiés centralement en 401 et 429 ; une panne du rate limiter remonte en 500.
- `installFrenchZodErrorMap()` est déjà appelé au bootstrap (configuration partagée `apps/backend/src/configure-app.ts`).

## Observabilité

Pour modifier les logs HTTP/WS, le contexte CLS, le filtre d'erreurs, le lifecycle WS ou les wide events, lire [la référence d'observabilité](references/observability.md).
