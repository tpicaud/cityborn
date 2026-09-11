---
name: check-and-remove-deprecated
description: Dépréciations du contrat @cityborn/api. À utiliser pour auditer leur éligibilité ou supprimer les éléments publics arrivés au terme de leur fenêtre de compatibilité.
---

# Nettoyage des dépréciations du contrat API

## Marquage

Le skill `deprecate` définit les marqueurs `@deprecated` et `@deprecatedSince`. Le rapport automatisé est la source de vérité pour leur détection et leur éligibilité.

## Phase 1 — Rapport automatisé

Lancer `pnpm --dir packages/api check:deprecations`. Pour chaque élément, le rapport donne le symbole, l'emplacement, la raison et le statut : ✅ éligible, ⏳ encore couvert ou ❓ pas encore déployé.

Utiliser ce statut sans recalcul manuel. Si le rapport ne couvre pas un cas, corriger sa logique et ses tests.

## Phase 2 — Présenter le rapport

Présenter la sortie du script à l'utilisateur avant toute suppression, sous forme de tableau si cela facilite la décision.

## Phase 3 — Suppression autorisée

Une demande explicite de nettoyer ou supprimer les éléments éligibles autorise cette phase après présentation du rapport dans la même tâche. Si l'utilisateur demande seulement de vérifier, auditer ou produire un rapport, attendre sa confirmation avant toute suppression. L'éligibilité garantit seulement que `check:api-compat` ne râlera pas : rechercher les clients réels avant de modifier le contrat.

Pour chaque élément confirmé :
- Chercher toutes les références au symbole dans **tout le monorepo**, pas seulement `packages/api` — un champ déprécié peut avoir du code de fallback ailleurs (ex. `data.newField ?? data.oldField`), une route dépréciée peut avoir un handler dédié dans un controller backend, un type déprécié peut être importé par des apps.
- Supprimer la déclaration dans `packages/api` et nettoyer tout le code qui la consommait spécifiquement (handler dédié, branche de fallback, etc.) — ne pas supprimer à l'aveugle, comprendre chaque usage trouvé avant de le toucher.
- Lancer d'abord les tests ciblés pendant l'implémentation, puis une seule fois avant le compte rendu final : `pnpm typecheck`, `pnpm --dir apps/backend test`, `pnpm --dir packages/api test`, `pnpm format` et `pnpm check:api-compat`.
- Présenter le diff pour relecture.
