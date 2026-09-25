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

- Pour une méthode testée, prévoir un `describe` par méthode couverte, même avec un seul `it`. Quand un `describe` parent nomme déjà la classe, le repository ou l'adaptateur, nommer l'enfant par la méthode seule (`describe('delete', ...)`) ; sans parent, utiliser `Classe.méthode` (`describe('SessionService.kickPlayer', ...)`). En e2e, le `describe` nomme le parcours ou la frontière observée.
- Un `it` décrit en anglais un comportement au présent (`rejects when the requester is not the host`), jamais avec `should`.
- Un `it` couvre un seul comportement. Plusieurs assertions sont permises lorsqu'elles caractérisent ensemble ce même résultat.
- Séparer Arrange, Act et Assert par une ligne vide, sans commentaires `Arrange` / `Act` / `Assert`.
- Pour les doubles typés, importer `createMock<T>()` directement depuis `@golevelup/ts-jest`, configurer explicitement les retours utiles au scénario et ne jamais utiliser `as unknown as`. Ne pas créer de fichier relais qui ne ferait que réexporter cet utilitaire.
- Pour chaque type métier principal défini dans un package partagé, placer son builder dans ce même package, dans un fichier dédié, puis l'exporter et le réutiliser dans les tests consommateurs. Ne pas redéfinir ce builder dans une app.
- Ne pas créer de builder pour un DTO secondaire, un type d'infrastructure ou une forme locale ponctuelle. Les retours de mocks Prisma sont de simples données d'Arrange : les écrire explicitement près du scénario qui les utilise.
- Réserver les builders à l'Arrange. Dans un Assert, écrire directement la valeur attendue afin que le contrat vérifié soit visible sans suivre l'implémentation d'un builder.
- Dans l'Arrange, déclarer explicitement les objets du scénario avec leurs builders quand ils existent. Garder leurs données visibles dans le test plutôt que les construire dans un helper de scénario ou directement dans l'appel testé.
- Tous les builders acceptent des overrides typés et retournent des données indépendantes à chaque appel. Les tests importent chaque builder directement depuis son package propriétaire : ne créer ni fichier de réexport ni barrel de fixtures. `test/support/fixtures/` ne contient que les fixtures propres au backend.

## Intégration

En intégration, créer un fichier par repository ou adaptateur testé. Regrouper dans `prisma-transaction.integration.spec.ts` les tests de rollback des transactions Prisma qui coordonnent plusieurs repositories, avec un `describe` par service puis par méthode. Les autres services restent couverts au tier unitaire pour leurs branches métier.

Pour Prisma, rendre les insertions explicites dans chaque test d'intégration. Un helper Prisma éventuel ne fait qu'une insertion et reçoit l'objet à insérer en argument ; il ne construit ni ne choisit les données à la place du test.

## E2E

Partir d'une frontière de production partagée, puis choisir le plus petit parcours qui démontre son câblage réel. Couvrir un chemin nominal et un rejet représentatif lorsque la frontière possède les deux ; ajouter une variante seulement si elle traverse un câblage ou un transport distinct qui ne peut pas être observé à un tier inférieur.

Réserver un nouvel e2e à une route, un événement ou un guard qui active un pipeline distinct. Couvrir ses branches métier, ses `ErrorCode` et ses variantes de données au tier unitaire ; couvrir sa persistance, ses locks et ses TTL au tier intégration.

## Harnais réel

Pour écrire, modifier ou exécuter un test d'intégration ou e2e, lire [la référence du harnais partagé](references/integration-e2e.md). Elle porte les invariants d'infrastructure, le bootstrap de production, les transports HTTP/WS et le teardown sans fuite.
