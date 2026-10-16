---
name: agent-docs
description: "Docs agents Cityborn. À utiliser avant de créer ou modifier AGENTS.md, un skill ou l'un de ses fichiers de référence, y compris pour une retouche en cours d'issue ou de review."
---

# Docs agents

## Étapes

1. Charger le skill `writing-for-agents`, qui porte la méthode générique.
2. Rédiger selon les [conventions Cityborn](#conventions-cityborn).
3. Placer chaque règle à un seul endroit selon le [placement](#placement).
4. Lancer `pnpm check:agent-docs` et corriger chaque erreur.
5. Dans `.agents/evals/skill-cases.md`, relire les cas de chaque skill touché, ses non-déclenchements et ses chevauchements ; un nouveau skill invocable par le modèle reçoit au moins un cas.

Terminé quand `pnpm check:agent-docs` passe et que chaque skill touché a des cas à jour.

## Conventions Cityborn

- Contenu en français ; noms de code, commandes et chemins tels quels.
- Structure :
  - un paragraphe court pour une affirmation indivisible ;
  - un bullet par obligation indépendante ;
  - une liste numérotée seulement quand l'ordre compte ;
  - un tableau pour une correspondance dont les cellules restent courtes.
- Une phrase qui porte trois obligations vérifiables ou plus est découpée en bullets.
- Une règle d'architecture renvoie aux axes d'organisation de la vue d'ensemble d'`AGENTS.md`, sans lister les packages ou apps visés.
- Un nom de code est cité seulement si :
  - la règle porte sur ce nom ;
  - c'est un piège ou une convention introuvable dans le code ;
  - c'est une techno ou un package stable.
- Sinon, nommer le concept : l'agent trouve le nom exact dans le code.
- Une liste qui recopie l'arborescence, les scripts ou les exports reste dans le code.
- Une règle porte au plus un ou deux exemples.

## Placement

| Contenu | Emplacement |
|---|---|
| Règle utile à presque toute tâche | `AGENTS.md` |
| Règle propre à un domaine, une app ou un workflow | le skill qui le couvre |
| Détail que seule une partie des cas d'un skill consulte | un fichier de référence du skill |
| Démarrage local, prérequis, ports | `README.md` |

## Références entre documents

- La description d'un skill est son déclencheur : la préciser plutôt qu'ajouter des renvois vers le skill.
- Un renvoi vers un autre skill sert une étape d'une séquence ou délègue une notion qu'il possède ; il nomme le skill, pas ses fichiers de référence.
- Les renvois vont du spécifique vers le générique, sans cycle.
- `AGENTS.md` renvoie vers un skill seulement pour une étape ou un garde-fou incontournable.
- `writing-for-agents` reste identique à sa source externe (`mattpocock/skills`) ; toute adaptation Cityborn vit dans ce skill.
