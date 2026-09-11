---
name: backend-testing
description: Tests backend Cityborn. À utiliser pour choisir le tier ou travailler sur un test unitaire, d'intégration ou e2e dans apps/backend.
---

# Tests backend

## Choisir le tier

Placer chaque branche métier dans le tier le plus bas qui permette de l'observer. Les e2e couvrent des parcours représentatifs du câblage sans répéter la matrice métier démontrée en unitaire ni les détails d'infrastructure couverts en intégration.

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
- Pour les doubles typés, importer `createMock<T>()` directement depuis `@golevelup/ts-jest`, configurer explicitement les retours utiles au scénario et ne jamais utiliser `as unknown as`. Ne pas créer de fichier relais qui ne ferait que réexporter cet utilitaire.
- Pour chaque type métier principal défini dans un package partagé, placer son builder dans ce même package, dans un fichier dédié, puis l'exporter et le réutiliser dans les tests consommateurs. Ne pas redéfinir ce builder dans une app.
- Ne pas créer de builder pour un DTO secondaire, un type d'infrastructure ou une forme locale ponctuelle. Les retours de mocks Prisma sont de simples données d'Arrange : les écrire explicitement près du scénario qui les utilise.
- Réserver les builders à l'Arrange. Dans un Assert, écrire directement la valeur attendue afin que le contrat vérifié soit visible sans suivre l'implémentation d'un builder.
- Tous les builders acceptent des overrides typés et retournent des données indépendantes à chaque appel. Les tests importent chaque builder directement depuis son package propriétaire : ne créer ni fichier de réexport ni barrel de fixtures. `test/support/fixtures/` ne contient que les fixtures propres au backend.

## Intégration et e2e

Pour écrire, modifier ou exécuter un test d'intégration ou e2e, lire [la référence du harnais partagé](references/integration-e2e.md).
