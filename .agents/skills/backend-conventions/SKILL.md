---
name: backend-conventions
description: Conventions backend NestJS Cityborn (apps/backend) — structure d'un module (controllers/ fins + services/ + mappers/, split *.public.* / *.admin.*, handlers ts-rest) et gestion des erreurs (exceptions Nest typées avec ErrorCode de @cityborn/api, filtres globaux qui sérialisent en ApiError, erreurs Prisma déjà mappées). À utiliser dès qu'on crée ou modifie un module, controller, service ou mapper dans apps/backend, ou qu'on lève une exception.
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

## Garde-fou DB

Ne jamais modifier une migration Prisma déjà appliquée/mergée : toujours en créer une nouvelle (`pnpm db:migrate`).
