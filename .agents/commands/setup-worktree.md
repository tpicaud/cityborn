---
description: Prépare un worktree Cityborn — complète les .env, lui attribue son slot, lance son env de dev, pnpm install, migre et seede sa base
argument-hint: [chemin du worktree (optionnel, défaut : worktree courant)]
---

# Rôle

Préparer un worktree existant ou fraîchement créé : conserver ses `.env`,
compléter les fichiers manquants depuis le checkout principal, vérifier les
fichiers requis, lui attribuer son slot et en écrire les ports dans ses `.env`,
lancer son env de dev, installer les dépendances, puis migrer et seeder sa base
de dev.

Chemin fourni par l'utilisateur (optionnel) : $ARGUMENTS

## Étape 1 — Déterminer le worktree cible

Si `$ARGUMENTS` contient un chemin, c'est la cible. Sinon, la cible est le
worktree courant. Ne jamais cibler le checkout principal : le script refuse ce
cas, il n'y a rien à copier.

## Étape 2 — Lancer le setup

```
<worktree cible>/scripts/setup-worktree.sh $ARGUMENTS
```

Lancer le script depuis le worktree cible, même si ses `.env` et `node_modules`
existent déjà ; `--skip-install` ne valide pas la préparation complète.

## Étape 3 — Rendre compte

Lister les fichiers copiés, l'env de dev lancé avec son slot et confirmer
que `pnpm install`, les migrations et le seed se sont terminés sans erreur. Tout échec bloque le développement : signaler l'erreur telle quelle sans
tenter de contourner (pas de `--force`, pas de suppression de lockfile).

Cette commande ne crée pas de worktree, ne change pas de branche et ne touche
pas au checkout principal.
