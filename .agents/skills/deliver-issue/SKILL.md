---
name: deliver-issue
description: "Issue GitHub Cityborn à développer, corriger ou délivrer : dev, boucle de review, correctifs et verdict par sous-agents."
---

# Délivrer une issue

Tu es l'**orchestrateur** : chaque étape tourne dans un sous-agent au contexte neuf, sauf la boucle de l'étape 2 que tu mènes toi-même, et ton contexte ne garde que l'issue, les rapports et le registre des findings. Le diff et le code restent dans les sous-agents, pour que chaque étape démarre avec toute son attention.

`deliver-issue` s'arrête à la PR draft prête pour la recette de l'utilisateur.

## Préparer le worktree

Appliquer [la préparation](references/prepare.md) avant tout sous-agent, quelle que soit l'origine du checkout.

La préparation est terminée quand le worktree retenu utilise la branche liée, à jour d'`origin`, que les `.env` requis sont présents, que son env Docker tourne et que `pnpm install` a réussi. Un échec bloque le développement et figure dans le rapport.

## Lancer un sous-agent

Ces règles valent pour chaque étape.

- Lancer un sous-agent au contexte neuf et attendre son rapport avant l'étape suivante.
- Transmettre le chemin absolu du worktree, la branche liée et la branche cible : le sous-agent y exécute chaque commande et chaque modification.
- Désigner chaque document à appliquer par son chemin, et chaque section par son titre : le sous-agent le lit et l'applique.
- Exiger un rapport qui commence par `statut: done` ou `statut: blocked`.
- Toute question destinée à l'utilisateur arrête le sous-agent : il rend `statut: blocked` avec la question et l'état dans lequel il laisse le checkout. Poser la question telle quelle à l'utilisateur, puis transmettre la réponse au même sous-agent si l'outil le permet, sinon à un nouveau sous-agent avec l'état décrit.
- Si l'environnement ne permet pas de lancer un sous-agent, exécuter les étapes à la suite dans le contexte courant, dans le worktree, et l'indiquer dans le compte rendu final.

## Étape 1 — Développement

Transmettre au sous-agent l'URL de l'issue, les consignes explicites de l'utilisateur sur le périmètre recopiées telles quelles et l'instruction d'appliquer « Cadrer », « Développer » et « Vérifier » de `.agents/skills/deliver-issue/references/develop.md`.

L'étape est terminée quand le rapport donne la preuve ou la place de chaque critère et un `pnpm verify` vert sur le dernier commit. Ses décisions prises restent chez l'orchestrateur jusqu'à l'étape 3.

## Étape 2 — Review

Appliquer toi-même [la boucle de review](references/review-loop.md), sans sous-agent intermédiaire.

L'étape est terminée au critère de fin de la référence.

## Étape 3 — Livraison

Transmettre au sous-agent l'URL de l'issue, l'instruction d'appliquer « Livrer » de `develop.md` et, pour le rapport de livraison :

- les décisions prises de l'étape 1 ;
- le nombre de tours et le modèle de chaque axe au dernier tour ;
- les findings encore `ouvert`, le nombre de findings mineurs et les findings hors périmètre ;
- les preuves du dernier tour de l'axe Correction.

L'étape est terminée au critère de fin de « Livrer ».

## Compte rendu final

Donner, dans cet ordre :

- le verdict ;
- les liens de l'issue et de la PR, et le chemin du worktree ;
- la description de la PR ;
- les findings mineurs non traités ;
- chaque vérification en échec ou non exécutée, avec la raison, et le cas échéant que les étapes ont tourné sans sous-agent.
