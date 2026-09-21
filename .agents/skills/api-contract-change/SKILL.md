---
name: api-contract-change
description: Contrat public @cityborn/api. À utiliser pour modifier une route ts-rest, un event WebSocket, un schéma zod, un type ou une valeur d'enum exportés depuis packages/api.
---

# Modifier un contrat `@cityborn/api`

Deux contrats y cohabitent : les routes ts-rest (`src/contract/`) et les channels WebSocket (`src/ws/`). La règle additive vaut pour les deux ; seules les vérifications diffèrent.

## Règle : additif d'abord

- Ajouter un champ optionnel, une route, une valeur d'enum, un type → OK, rétrocompatible.
- Rendre un champ requis, retirer/renommer une route ou un champ, restreindre un type → **breaking change**. Interdit en silence.
  - Créer le remplaçant **à côté** de l'ancien, sans toucher à l'ancien.
  - Déprécier l'ancien via le skill `deprecate` (il sera supprimé plus tard par `check-and-remove-deprecated`, une fois la fenêtre de compat passée).

## Contrat WebSocket

Un channel est déclaré dans `src/ws/<domaine>.channel.ts`, rattaché au registre `wsChannels` (`src/ws/registry.ts`) sous une clé `ApiDomain`. Les noms de fil sont dérivés du domaine et de la clé de l'event : ne jamais écrire `session:guess` ailleurs que dans `sessionWsEvent` / `sessionWsServerEvent`.

Un event ajouté se propage dans le même lot :

1. déclarer son `payload` et son `ack` dans le channel ;
2. côté backend, un handler de gateway décoré par `@WsMessage(channel, event)` — le nom, la validation zod et l'enveloppe d'ack en découlent ;
3. côté client, émettre via le `emit` de `@cityborn/client/ws`, ou écouter l'event serveur via le port `SocketConnection`.

`check:api-compat` ne couvre pas le WS : aucun schéma WS n'entre dans l'OpenAPI. Les gardes sont `pnpm typecheck` et le test d'exhaustivité de `session.gateway.unit.spec.ts`, qui échoue sur un event du contrat sans handler comme sur un handler hors contrat.

Les builds mobile déjà déployés restent le vrai frein : renommer un event, retirer un champ de payload ou resserrer un schéma existant les casse sans qu'aucune vérification ne l'annonce. Traiter ces cas comme un breaking change et **demander à l'utilisateur avant**.

## Vérifier

Pendant l'implémentation, lancer les tests ciblés du contrat modifié. Avant le compte rendu final, exécuter une seule fois :

1. `pnpm --dir packages/api test` — tests de compatibilité OpenAPI ;
2. `pnpm check:api-compat` — doit passer. S'il signale un breaking change non voulu, revoir l'approche additive ;
3. `pnpm typecheck` ;
4. `pnpm --dir apps/backend test` quand le contrat WS bouge.

## Breaking change assumé

Un vrai breaking change = **bump de version d'API**, jamais une modif silencieuse. **Demander à l'utilisateur avant** (garde-fou `AGENTS.md`).

## Bypass ponctuel de `check:api-compat`

Une ligne `<METHOD> <path> <texte exact>` dans `packages/api/tools/compat/err-ignore.txt`. **Demander à l'utilisateur avant d'ajouter cette ligne** (garde-fou `AGENTS.md`).
