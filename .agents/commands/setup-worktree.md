---
description: Prépare un worktree Cityborn — conserve les .env présents, complète les manquants et lance pnpm install
argument-hint: [chemin du worktree (optionnel, défaut : worktree courant)]
---

# Rôle

Préparer un worktree existant ou fraîchement créé : conserver ses `.env`,
compléter les fichiers manquants depuis le checkout principal, vérifier les
fichiers requis et installer les dépendances.

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

Lister les fichiers copiés et confirmer que `pnpm install` s'est terminé sans
erreur. Tout échec bloque le développement : signaler l'erreur telle quelle sans
tenter de contourner (pas de `--force`, pas de suppression de lockfile).

Cette commande ne crée pas de worktree, ne change pas de branche et ne touche
pas au checkout principal.
