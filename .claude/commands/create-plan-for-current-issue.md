---
description: Lit l'issue GitHub liée à la branche courante et propose un plan d'implémentation
allowed-tools: Bash(git *), Bash(gh *)
---

## Contexte

- Branche actuelle : !`git branch --show-current`
- Dernier commit : !`git log -1 --oneline`
- Statut du repo : !`git status --short`

## Tâche

1. **Identifier le numéro d'issue** à partir du nom de la branche courante.
   - Cherche un pattern du type `123`, `issue-123`, `feature/123-...`, `fix/123-...` dans le nom de la branche.
   - Si aucun numéro n'est trouvé dans le nom de la branche, cherche dans le dernier message de commit (ex: `#123`).
   - Si toujours rien trouvé, liste les issues ouvertes assignées à moi avec `gh issue list --assignee @me` et demande-moi de préciser laquelle traiter.

2. **Récupérer l'issue** correspondante avec `gh issue view <numero> --json title,body,labels,comments`.
   - Lis attentivement le titre, la description et les commentaires pour bien comprendre le besoin, les contraintes et les critères d'acceptation éventuels.

3. **Explorer le code existant** pertinent (fichiers, modules, tests) en lien avec la demande de l'issue, pour ancrer le plan dans la réalité du repo plutôt que dans des suppositions.

4. **Proposer un plan d'implémentation** structuré, sans encore écrire de code :
   - Vérifie que tu es en mode plan. Si ce n'est pas le cas demande à l'utilisateur de passer en mode plan
   - Résumé en une phrase de ce que l'issue demande.
   - Liste des étapes concrètes, dans l'ordre, avec pour chacune les fichiers probablement concernés.
   - Points d'attention / risques / questions ouvertes (edge cases, impacts sur d'autres modules, migrations, tests à ajouter).

5. **Ne pas commencer l'implémentation.** Présente le plan et attends ma validation ou mes ajustements avant de coder.

## Format de sortie attendu

```
## Issue #<numero> — <titre>

### Résumé
...

### Plan
1. ...
2. ...

### Points d'attention
- ...
```