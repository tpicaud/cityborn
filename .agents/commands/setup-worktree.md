---
description: Prépare un worktree Cityborn — copie les .env du checkout principal (main local) puis lance pnpm install
argument-hint: [chemin du worktree (optionnel, défaut : worktree courant)]
---

# Rôle

Rendre un worktree fraîchement créé immédiatement utilisable : les fichiers
`.env` ne sont pas versionnés, ils doivent être repris du checkout principal, et
les dépendances doivent être installées.

Chemin fourni par l'utilisateur (optionnel) : $ARGUMENTS

## Étape 1 — Déterminer le worktree cible

Si `$ARGUMENTS` contient un chemin, c'est la cible. Sinon, la cible est le
worktree courant. Ne jamais cibler le checkout principal : le script refuse ce
cas, il n'y a rien à copier.

## Étape 2 — Lancer le setup

```
./scripts/setup-worktree.sh $ARGUMENTS
```

Le script :

1. résout la racine du worktree cible et celle du checkout principal
   (`git worktree list --porcelain`, première entrée) ;
2. copie tous les fichiers `.env` ignorés par git du checkout principal vers la
   même arborescence dans le worktree (écrasement volontaire, opération
   idempotente) ;
3. exécute `pnpm install` dans le worktree.

Option `--skip-install` pour ne faire que la copie des `.env`.

## Étape 3 — Rendre compte

Lister les fichiers copiés et confirmer que `pnpm install` s'est terminé sans
erreur. En cas d'échec de l'installation, signaler l'erreur telle quelle sans
tenter de contourner (pas de `--force`, pas de suppression de lockfile).

Cette commande ne crée pas de worktree, ne change pas de branche et ne touche
pas au checkout principal.
