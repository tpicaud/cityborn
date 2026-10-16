---
name: remove-deprecations
description: "Nettoyage des dépréciations de @cityborn/api. À utiliser pour auditer les éléments dépréciés ou supprimer ceux arrivés au terme de leur fenêtre de compatibilité."
---

# Supprimer les dépréciations

## Étapes

1. Lancer `pnpm --dir packages/api check:deprecations` et suivre le statut de chaque élément sans le recalculer : ✅ éligible, ⏳ encore couvert, ❓ pas encore déployé.
2. Présenter le rapport à l'utilisateur.
3. Supprimer seulement si l'utilisateur a demandé le nettoyage ; une demande de vérification ou d'audit attend sa confirmation.
4. Pour chaque élément éligible confirmé :
   - chercher ses usages dans tout le monorepo, y compris les replis comme `data.newField ?? data.oldField` et les handlers dédiés ;
   - supprimer la déclaration et le code qui ne servait qu'à elle, après avoir compris chaque usage.

## Critère de fin

- Aucun élément non éligible ou non confirmé n'est supprimé.
- `pnpm check:api-compat` passe.
