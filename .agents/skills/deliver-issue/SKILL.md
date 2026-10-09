---
name: deliver-issue
description: "Issue GitHub Cityborn à développer, corriger ou délivrer dans le checkout courant. Une tâche ou un worktree dédié relève de start-issue-task."
---

# Délivrer une issue

Tu es l'**orchestrateur** : chaque étape tourne dans un sous-agent au contexte neuf, et ton contexte ne garde que l'issue et les rapports. Le diff et le code restent dans les sous-agents, pour que chaque étape démarre avec toute son attention.

Résoudre d'abord l'issue exacte à partir de son numéro ou de son URL. Si l'identifiant manque ou reste ambigu, demander lequel utiliser.

## Lancer un sous-agent

Ces règles valent pour les trois étapes.

- Lancer un sous-agent au contexte neuf, dans le checkout courant, et attendre son rapport avant l'étape suivante.
- Désigner chaque skill à appliquer par son chemin (`.agents/skills/<nom>/SKILL.md`) : le sous-agent lit le fichier et l'applique.
- Exiger un rapport qui commence par `statut: done` ou `statut: blocked`.
- Toute question destinée à l'utilisateur arrête le sous-agent : il rend `statut: blocked` avec la question et l'état dans lequel il laisse le checkout. Poser la question telle quelle à l'utilisateur, puis transmettre la réponse au même sous-agent si l'outil le permet, sinon à un nouveau sous-agent avec l'état décrit.
- Si l'environnement ne permet pas de lancer un sous-agent, exécuter les étapes à la suite dans le contexte courant et l'indiquer dans le compte rendu final.

## Étape 1 — Développement

Transmettre au sous-agent l'URL de l'issue, les consignes explicites de l'utilisateur recopiées telles quelles (checkout à utiliser directement, périmètre, état de départ) et l'instruction d'appliquer `.agents/skills/develop-issue/SKILL.md`. Son rapport donne la branche, l'URL de la PR draft et le compte rendu final prévu par `develop-issue`.

L'étape est terminée quand la branche liée est poussée et que la PR draft existe.

## Étape 2 — Review

Transmettre au sous-agent uniquement l'URL de l'issue et l'URL de la PR, avec l'instruction d'appliquer `.agents/skills/review-pr/SKILL.md`. Le reviewer juge le code, sans le récit du développement : le rapport de l'étape 1 reste chez l'orchestrateur.

L'étape est terminée quand le rapport liste les findings au format de `review-pr`, éventuellement aucun.

## Étape 3 — Correctifs

Si aucun finding n'est dans le périmètre de l'issue, ajouter à la description de la PR une section « Review automatique » qui l'indique, puis passer au compte rendu.

Sinon, transmettre au sous-agent l'URL de l'issue, l'URL de la PR et les findings dans le périmètre, recopiés tels quels. Il doit :

- charger les skills métier déclenchés par les fichiers concernés ;
- traiter chaque finding : le corriger, ou le rejeter avec une justification tirée du code ;
- exécuter les vérifications ciblées sur les fichiers modifiés, puis relancer les contrôles transverses de l'étape 1 que les correctifs concernent ;
- livrer selon la section « Livrer l'issue » de `.agents/skills/develop-issue/SKILL.md`, en ajoutant à la description de la PR la section « Review automatique » qui liste les findings corrigés et rejetés.

Son rapport donne le statut de chaque finding et les vérifications exécutées. L'étape est terminée quand chaque finding a un statut, que chaque correctif commité est poussé et que la PR contient la section « Review automatique ».

## Compte rendu final

Indiquer :

- l'issue traitée, le lien de la PR et le résultat obtenu ;
- les findings corrigés, rejetés avec leur raison, et hors périmètre signalés ;
- les vérifications exécutées au développement et aux correctifs, avec leur résultat, puis celles non exécutées et leur raison ;
- les tests manuels attendus, risques résiduels ou problèmes d'architecture constatés ;
- le cas échéant, que les étapes ont tourné sans sous-agent.
