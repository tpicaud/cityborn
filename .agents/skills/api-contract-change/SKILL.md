---
name: api-contract-change
description: Modifier la surface publique de @cityborn/api (route ts-rest, schéma zod, type ou valeur d'enum exportés) en respectant la rétrocompat obligatoire — règle additive, pnpm check:api-compat (oasdiff), bump de version d'API pour un breaking change, bypass ponctuel via err-ignore.txt. À utiliser dès qu'on ajoute ou change un élément du contrat dans packages/api.
---

# Modifier un contrat `@cityborn/api`

`packages/api` est la source de vérité des contrats. Le monorepo entier en dépend, et `check:api-compat` (oasdiff) tourne en CI.

## Règle : additif d'abord

- Ajouter un champ optionnel, une route, une valeur d'enum, un type → OK, rétrocompatible.
- Rendre un champ requis, retirer/renommer une route ou un champ, restreindre un type → **breaking change**. Interdit en silence.
  - Créer le remplaçant **à côté** de l'ancien, sans toucher à l'ancien.
  - Déprécier l'ancien via le skill `deprecate` (il sera supprimé plus tard par `check-and-remove-deprecated`, une fois la fenêtre de compat passée).

## Vérifier

1. `pnpm typecheck`
2. `pnpm check:api-compat` — doit passer. S'il signale un breaking change non voulu, revoir l'approche (additif).
3. `pnpm --dir packages/api test` — tests de compatibilité OpenAPI.

## Breaking change assumé

Un vrai breaking change = **bump de version d'API**, jamais une modif silencieuse. **Demander à l'utilisateur avant** (garde-fou `AGENTS.md`).

## Bypass ponctuel de `check:api-compat`

Une ligne `<METHOD> <path> <texte exact>` dans `packages/api/openapi/compat/err-ignore.txt`. **Demander à l'utilisateur avant d'ajouter cette ligne** (garde-fou `AGENTS.md`).
