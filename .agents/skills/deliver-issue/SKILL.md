---
name: deliver-issue
description: "Issue GitHub Cityborn à développer, corriger ou délivrer : dev, review puis correctifs par sous-agents."
---

# Délivrer une issue

Tu es l'**orchestrateur** : chaque étape tourne dans un sous-agent au contexte neuf, et ton contexte ne garde que l'issue et les rapports. Le diff et le code restent dans les sous-agents, pour que chaque étape démarre avec toute son attention.

## Préparer le worktree

Appliquer [la préparation](references/prepare.md) avant tout sous-agent, quelle que soit l'origine du checkout.

La préparation est terminée quand le worktree retenu utilise la branche liée, que sa base est vérifiée, que les `.env` requis sont présents et que `pnpm install` a réussi. Un échec bloque le développement et figure dans le rapport.

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
- livrer selon la section « Livrer » de `.agents/skills/deliver-issue/references/develop.md`, en laissant à l'orchestrateur les findings hors périmètre de « Pistes ».

Son rapport donne, pour chaque finding, son statut et le correctif ou la raison du rejet, en une ligne, puis chaque vérification en échec ou non exécutée, avec la raison.

Dans tous les cas, ajouter ensuite les findings hors périmètre à « Pistes » dans la description de la PR, selon `.agents/skills/deliver-issue/references/report.md`.

L'étape est terminée quand chaque finding a un statut, que chaque correctif commité est poussé et que « Pistes » liste chaque finding hors périmètre.

## Compte rendu final

Indiquer l'issue traitée, le lien de la PR et le chemin du worktree, puis le rapport de livraison, identique à la description de la PR ; le cas échéant, ajouter les vérifications en échec ou non exécutées et que les étapes ont tourné sans sous-agent.
