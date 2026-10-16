---
name: agent-docs
description: "Docs agents Cityborn. À utiliser avant de créer ou modifier AGENTS.md, un skill ou l'un de ses fichiers de référence, y compris pour une retouche en cours d'issue ou de review."
---

# Docs agents

## Étapes

1. Charger le skill `writing-for-agents`, qui porte la méthode générique.
2. Avant d'ajouter une règle, vérifier qu'elle s'applique au-delà des fichiers du changement, qu'elle change le comportement par défaut de l'agent et qu'aucune règle existante ne la couvre ; sinon modifier ou supprimer la règle existante plutôt qu'en ajouter une.
3. Rédiger selon les [conventions Cityborn](#conventions-cityborn).
4. Lancer `pnpm check:agent-docs` et corriger chaque erreur.
5. Dans `.agents/evals/skill-cases.md`, mettre à jour les cas de chaque skill touché, ses non-déclenchements et ses chevauchements.

Terminé quand le check passe et que les cas de chaque skill touché sont à jour.

## Conventions Cityborn

- Contenu en français ; noms de code, commandes et chemins tels quels.
- Bullets et tableaux plutôt que paragraphes ; une obligation par bullet.
- Nommer le concept plutôt que le symbole qui l'implémente, sauf si la règle porte sur ce symbole.
- Une règle d'architecture renvoie aux axes d'organisation d'`AGENTS.md`, sans lister les packages ou apps visés.
- Une règle décrit la cible : un écart du code existant se traite par une issue, jamais par une phrase de transition.
- Renvois :
  - un renvoi vers un autre skill sert une étape ou délègue une notion qu'il possède ;
  - il nomme le skill, jamais ses fichiers de référence ;
  - il va du spécifique vers le générique, sans cycle ;
  - `AGENTS.md` renvoie vers un skill seulement pour une étape ou un garde-fou incontournable.
- `writing-for-agents` reste identique à sa source (`mattpocock/skills`) ; toute adaptation Cityborn vit dans ce skill.

## Skills

- Un skill de conventions couvre le périmètre d'un package ou d'une app de la vue d'ensemble d'`AGENTS.md`, ou une préoccupation transverse ; un skill de workflow couvre une tâche du début à la fin.
- Un skill pose des règles et des décisions ; l'état du code (listes de fichiers, de hooks, de domaines) reste dans le code.
- Un document lu seulement par un autre skill est une référence de ce skill, pas un skill.
- Un skill de conventions se nomme `conventions-<périmètre>` ; un skill de workflow `<verbe>-<objet>`.
