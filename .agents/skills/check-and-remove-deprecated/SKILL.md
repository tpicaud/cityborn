---
name: check-and-remove-deprecated
description: Vérifie les éléments dépréciés du contrat API (@cityborn/api — routes, champs de schéma, valeurs d'enum, types) et propose de supprimer ceux dont la version de dépréciation est sortie de la fenêtre de compatibilité obligatoire. À utiliser pour le ménage périodique des dépréciations d'API, ou quand on me demande de vérifier/nettoyer les dépréciations.
---

# Nettoyage des dépréciations du contrat API

## Convention de marquage

Un élément du contrat (`packages/api/src/**/*.ts` — routes de contrat ts-rest, champs de schéma zod, valeurs d'enum, types exportés, ou tout autre élément de la surface publique de `@cityborn/api`) est marqué déprécié via un commentaire JSDoc portant deux tags :

```ts
/**
 * @deprecated Utiliser `finalizeGame` à la place. Conservé pour les
 * builds mobile publiées avant ce renommage.
 * @deprecatedSince 2026-08-21
 */
```

- `@deprecated` : explication humaine (raison, remplaçant).
- `@deprecatedSince <YYYY-MM-DD>` : date d'introduction de la dépréciation dans le code. **Toujours une date, jamais un numéro de version** — le numéro n'est connu qu'au déploiement (`packages/api/scripts/generate-openapi-file.ts` le calcule à la volée à partir du dernier snapshot existant).

## Phase 1 — Rapport automatisé

Lancer `pnpm --dir packages/api check:deprecations`. Ce script (`packages/api/scripts/check-deprecations.ts`, logique dans `packages/api/openapi/compat/find-deprecations.ts`, testée dans `find-deprecations.test.ts`) :
- scanne tout `packages/api/src/**/*.ts` à la recherche des blocs `@deprecated` + `@deprecatedSince`,
- pour chacun, retrouve dans `versions-manifest.json` la version qui l'a effectivement embarquée en prod,
- réutilise la logique déjà testée de `packages/api/openapi/compat/select-versions.ts` (`selectVersionsToCheck`) pour savoir si cette version est encore dans la fenêtre obligatoire de `check:api-compat`,
- imprime pour chaque élément : symbole, emplacement, raison, et un statut — ✅ éligible à la suppression / ⏳ pas encore (avec échéance précise : date de fin de fenêtre et/ou nombre de versions restantes) / ❓ pas encore déployé.

**Ne jamais recalculer cette logique à la main** — si le script ne couvre pas un cas, corriger `find-deprecations.ts` (et ses tests) plutôt que de contourner en prose.

## Phase 2 — Présenter le rapport

Toujours présenter la sortie du script à l'utilisateur avant toute action (reformater en tableau si utile : élément | date de dépréciation | version d'origine | statut).

## Phase 3 — Suppression autorisée

Une demande explicite de nettoyer ou supprimer les éléments éligibles autorise cette phase après présentation du rapport dans la même tâche. Si l'utilisateur demande seulement de vérifier, auditer ou produire un rapport, attendre sa confirmation avant toute suppression. L'éligibilité garantit seulement que `check:api-compat` ne râlera pas : rechercher les clients réels avant de modifier le contrat.

Pour chaque élément confirmé :
- Chercher toutes les références au symbole dans **tout le monorepo**, pas seulement `packages/api` — un champ déprécié peut avoir du code de fallback ailleurs (ex. `data.newField ?? data.oldField`), une route dépréciée peut avoir un handler dédié dans un controller backend, un type déprécié peut être importé par des apps.
- Supprimer la déclaration dans `packages/api` et nettoyer tout le code qui la consommait spécifiquement (handler dédié, branche de fallback, etc.) — ne pas supprimer à l'aveugle, comprendre chaque usage trouvé avant de le toucher.
- Lancer d'abord les tests ciblés pendant l'implémentation, puis une seule fois avant le compte rendu final : `pnpm typecheck`, `pnpm --dir apps/backend test`, `pnpm --dir packages/api test`, `pnpm format` et `pnpm check:api-compat`.
- Présenter le diff complet pour relecture. Ne jamais commit (cf. garde-fou du projet — c'est au développeur de committer).
