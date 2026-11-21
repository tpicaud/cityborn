---
name: deliver-issue
description: "Issue GitHub Cityborn à développer, corriger ou délivrer : dev, boucle de review et correctifs par sous-agents."
---

# Délivrer une issue

Tu es l'**orchestrateur** : chaque étape tourne dans un sous-agent au contexte neuf, et ton contexte ne garde que l'issue et les rapports. Le diff et le code restent dans les sous-agents, pour que chaque étape démarre avec toute son attention.

## Préparer le worktree

Appliquer [la préparation](references/prepare.md) avant tout sous-agent, quelle que soit l'origine du checkout.

La préparation est terminée quand le worktree retenu utilise la branche liée, à jour d'`origin` et basée sur la branche cible, que les `.env` requis sont présents, que son env Docker tourne et que `pnpm install` a réussi. Un échec bloque le développement et figure dans le rapport.

## Lancer un sous-agent

Ces règles valent pour chaque étape.

- Lancer un sous-agent au contexte neuf et attendre son rapport avant l'étape suivante.
- Lui transmettre le chemin absolu du worktree, la branche liée et la branche cible : il y exécute chaque commande et chaque modification.
- Désigner chaque document à appliquer par son chemin : le sous-agent le lit et l'applique.
- Exiger un rapport qui commence par `statut: done` ou `statut: blocked`.
- Toute question destinée à l'utilisateur arrête le sous-agent : il rend `statut: blocked` avec la question et l'état dans lequel il laisse le checkout. Poser la question telle quelle à l'utilisateur, puis transmettre la réponse au même sous-agent si l'outil le permet, sinon à un nouveau sous-agent avec l'état décrit.
- Si l'environnement ne permet pas de lancer un sous-agent, exécuter les étapes à la suite dans le contexte courant, dans le worktree, et l'indiquer dans le compte rendu final.

## Étape 1 — Développement

Transmettre au sous-agent l'URL de l'issue, les consignes explicites de l'utilisateur sur le périmètre recopiées telles quelles et l'instruction d'appliquer `.agents/skills/deliver-issue/references/develop.md`. Son rapport donne l'URL de la PR draft.

L'étape est terminée au critère de fin de la référence.

## Étape 2 — Boucle de review

Enchaîner au plus 3 tours de review, séparés par des correctifs. À chaque tour :

1. Lancer un reviewer avec l'URL de l'issue, l'URL de la PR et l'instruction d'appliquer `.agents/skills/review-pr/SKILL.md`, sans le rapport du dev, sur GPT Sol 6.1, sinon Opus 5.5, sinon le meilleur modèle disponible, toujours en effort high. Dès le tour 2, lui transmettre aussi la tête relue au tour précédent, le plus grand ID attribué et chaque finding `bloquant` ou `majeur` du périmètre de l'issue qu'aucun reviewer n'a déclaré `résolu`, quel que soit son tour, avec le dernier statut rendu par le correcteur.
2. Sans finding `bloquant` ni `majeur` ouvert dans le périmètre de l'issue, ou au tour 3, sortir de la boucle.
3. Sinon, lancer un correcteur avec l'URL de l'issue, l'URL de la PR et ces findings recopiés tels quels. Il doit :
   - charger les skills de conventions des périmètres touchés ;
   - vérifier chaque finding dans le code : un finding s'accepte sur preuve, jamais pour clore la boucle ;
   - corriger chaque finding fondé par le plus petit changement, en supprimant ou restreignant plutôt qu'en ajoutant ;
   - rejeter chaque autre finding avec une raison tirée du code ;
   - livrer selon la section « Livrer » de `.agents/skills/deliver-issue/references/develop.md`.

   Son rapport donne, pour chaque finding, `corrigé <sha>` ou `rejeté : raison`, puis chaque vérification en échec ou non exécutée, avec la raison.

L'étape est terminée quand la boucle est sortie.

## Étape 3 — Verdict

Mettre à jour toi-même la description de la PR selon `.agents/skills/deliver-issue/references/report.md` : le verdict en première ligne d'après les findings encore ouverts au dernier tour, chaque finding hors périmètre dans « Pistes ».

## Compte rendu final

Indiquer l'issue traitée, le lien de la PR et le chemin du worktree, puis le rapport de livraison, identique à la description de la PR, et les findings mineurs ; le cas échéant, ajouter les vérifications en échec ou non exécutées et que les étapes ont tourné sans sous-agent.
