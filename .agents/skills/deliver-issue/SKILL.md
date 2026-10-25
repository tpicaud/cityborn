---
name: deliver-issue
description: "Issue GitHub Cityborn à développer, corriger ou délivrer : dev, review puis correctifs par sous-agents."
---

# Délivrer une issue

Tu es l'**orchestrateur** : chaque étape tourne dans un sous-agent au contexte neuf, et ton contexte ne garde que l'issue et les rapports. Le diff et le code restent dans les sous-agents, pour que chaque étape démarre avec toute son attention.

## Préparer le worktree

L'orchestrateur prépare lui-même la branche liée à l'issue et son worktree, avant tout sous-agent : le checkout courant garde sa branche et ses changements.

1. Résoudre l'issue exacte à partir de son numéro ou de son URL.
2. Exécuter `git fetch --all --prune`, puis trouver la branche que GitHub associe à l'issue : `gh issue develop <numéro> --list` ; une branche locale au nom proche ne compte pas. Sans branche liée, la créer avec `gh issue develop <numéro> --base main` et relancer le fetch.
3. Réutiliser le worktree où `git worktree list` montre la branche liée ; sinon en créer un avec `git worktree add <checkout principal>/.claude/worktrees/issue-<numéro> <branche liée>`, où le checkout principal est la première entrée de `git worktree list`, puis exécuter `./scripts/setup-worktree.sh <worktree>` et signaler un échec tel quel.
4. Rebaser la branche liée sur `origin/main`, sauf si le worktree contient des changements ou si le rebase réécrit des commits publiés : présenter alors l'état et demander. Résoudre seul un conflit seulement si la résolution découle clairement de l'issue et du code actuel ; sinon laisser le rebase en cours et demander une décision.

Si l'utilisateur demande de travailler dans un checkout précis, ce checkout remplace le worktree et garde sa branche : appliquer les étapes 1, 2, puis 4 si c'est la branche liée, sinon le signaler avant tout sous-agent.

La préparation est terminée quand le worktree est sur la branche liée, rebasée ou avec sa divergence présentée, et prêt à l'emploi.

## Lancer un sous-agent

Ces règles valent pour les trois étapes.

- Lancer un sous-agent au contexte neuf et attendre son rapport avant l'étape suivante.
- Lui transmettre le chemin absolu du worktree et la branche liée : il y exécute chaque commande et chaque modification.
- Désigner chaque document à appliquer par son chemin : le sous-agent le lit et l'applique.
- Exiger un rapport qui commence par `statut: done` ou `statut: blocked`.
- Toute question destinée à l'utilisateur arrête le sous-agent : il rend `statut: blocked` avec la question et l'état dans lequel il laisse le checkout. Poser la question telle quelle à l'utilisateur, puis transmettre la réponse au même sous-agent si l'outil le permet, sinon à un nouveau sous-agent avec l'état décrit.
- Si l'environnement ne permet pas de lancer un sous-agent, exécuter les étapes à la suite dans le contexte courant, dans le worktree, et l'indiquer dans le compte rendu final.

## Étape 1 — Développement

Transmettre au sous-agent l'URL de l'issue, les consignes explicites de l'utilisateur sur le périmètre recopiées telles quelles et l'instruction d'appliquer `.agents/skills/deliver-issue/references/develop.md`. Son rapport donne l'URL de la PR draft.

L'étape est terminée au critère de fin de la référence.

## Étape 2 — Review

Transmettre au sous-agent uniquement l'URL de l'issue et l'URL de la PR, avec l'instruction d'appliquer `.agents/skills/review-pr/SKILL.md`. Le reviewer juge le code, sans le récit du développement : le rapport de l'étape 1 reste chez l'orchestrateur.

L'étape est terminée quand le rapport liste les findings au format de `review-pr`, éventuellement aucun.

## Étape 3 — Correctifs

Si au moins un finding est dans le périmètre de l'issue, transmettre au sous-agent l'URL de l'issue, l'URL de la PR et ces findings, recopiés tels quels. Il doit :

- charger les skills de conventions des périmètres touchés ;
- traiter chaque finding : le corriger, ou le rejeter avec une justification tirée du code ;
- vérifier chaque correctif ;
- livrer selon la section « Livrer » de `.agents/skills/deliver-issue/references/develop.md`, en laissant à l'orchestrateur la section « Review automatique » et les findings de « Pistes ».

Son rapport donne, pour chaque finding, son statut et le correctif ou la raison du rejet, en une ligne.

Dans tous les cas, écrire ensuite dans la description de la PR, selon `.agents/skills/deliver-issue/references/report.md`, la section « Review automatique » et ajouter à « Pistes » les findings hors périmètre.

L'étape est terminée quand chaque finding a un statut, que chaque correctif commité est poussé et que la description de la PR contient la section « Review automatique ».

## Compte rendu final

Indiquer l'issue traitée, le lien de la PR et le chemin du worktree, puis le rapport de livraison, identique à la description de la PR ; le cas échéant, ajouter que les étapes ont tourné sans sous-agent.
