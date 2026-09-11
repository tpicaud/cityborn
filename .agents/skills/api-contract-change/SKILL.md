---
name: api-contract-change
description: Contrat public @cityborn/api. À utiliser pour modifier une route ts-rest, un schéma zod, un type ou une valeur d'enum exportés depuis packages/api.
---

# Modifier un contrat `@cityborn/api`

## Règle : additif d'abord

- Ajouter un champ optionnel, une route, une valeur d'enum, un type → OK, rétrocompatible.
- Rendre un champ requis, retirer/renommer une route ou un champ, restreindre un type → **breaking change**. Interdit en silence.
  - Créer le remplaçant **à côté** de l'ancien, sans toucher à l'ancien.
  - Déprécier l'ancien via le skill `deprecate` (il sera supprimé plus tard par `check-and-remove-deprecated`, une fois la fenêtre de compat passée).

## Vérifier

Pendant l'implémentation, lancer les tests ciblés du contrat modifié. Avant le compte rendu final, exécuter une seule fois :

1. `pnpm --dir packages/api test` — tests de compatibilité OpenAPI ;
2. `pnpm check:api-compat` — doit passer. S'il signale un breaking change non voulu, revoir l'approche additive ;
3. `pnpm typecheck`.

## Breaking change assumé

Un vrai breaking change = **bump de version d'API**, jamais une modif silencieuse. **Demander à l'utilisateur avant** (garde-fou `AGENTS.md`).

## Bypass ponctuel de `check:api-compat`

Une ligne `<METHOD> <path> <texte exact>` dans `packages/api/openapi/compat/err-ignore.txt`. **Demander à l'utilisateur avant d'ajouter cette ligne** (garde-fou `AGENTS.md`).
