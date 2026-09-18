---
name: cleanup-worktree
description: Supprime le worktree courant si tout son travail est publié, puis ramène la session sur le checkout principal
disable-model-invocation: true
---

# Nettoyer le worktree courant

Invoqué depuis le worktree dont le travail est terminé.

## Étape 1 — Supprimer le worktree

```
./scripts/cleanup-worktree.sh
```

Le script résout seul le worktree courant et le checkout principal, et se ré-exécute depuis la copie du checkout principal.

Il refuse tant que le worktree a des modifications non commitées, ou des commits publiés nulle part — ni sur sa branche distante, ni dans `origin/main`, ni via une PR fusionnée. Ce refus est final : rapporter la raison telle quelle et rendre la main. Pousser d'abord, uniquement si l'utilisateur le demande.

Après suppression, il remet le checkout principal sur `main` et le met à jour en fast-forward. Les branches locale et distante sont conservées.

## Étape 2 — Ramener la session sur le checkout principal

Le répertoire de travail de la session vient d'être supprimé : toute commande suivante y échouerait. La dernière ligne du script donne le chemin de reprise.

Rejoindre ce chemin avec le mécanisme de la session courante — sous Claude Code, l'outil `ExitWorktree` avec `action: "keep"`, à charger avec `ToolSearch` s'il n'est pas disponible ; le worktree étant déjà supprimé, il ne reste rien à retirer.

Si la session ne peut pas changer de répertoire, demander à l'utilisateur d'en ouvrir une nouvelle sur le checkout principal.

## Étape 3 — Rendre compte

Reprendre la sortie du script : worktree supprimé, endroit où le travail est publié, branche locale conservée, état du checkout principal.
