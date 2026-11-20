---
name: review-pr
description: "Review Cityborn d'une PR ou d'une branche, pour toute demande de review sans outil désigné : confronter le diff à son issue, aux règles d'AGENTS.md, aux skills de conventions, à la sécurité et aux tests."
---

# Relire une PR

La review rend des findings : le code, la branche et GitHub restent inchangés. Publier les findings sur la PR uniquement à la demande de l'utilisateur.

Ce skill orchestre deux axes ; la lecture du code et la confirmation des findings se font dans leurs sous-agents, pour qu'un orchestrateur l'applique sans charger le diff.

## Étapes

1. Retenir les entrées des axes :
   - la cible : une PR, sinon la branche courante ou celle du worktree transmis, avec sa base ;
   - l'issue liée : `Closes #…` de la PR, sinon le numéro de la branche ;
   - en relecture, le SHA de départ du delta, le registre des findings et le plus grand ID déjà attribué.
2. Lancer les deux axes en parallèle, chacun dans un sous-agent au contexte neuf, avec les entrées et le chemin de son brief à appliquer :

   | Axe | Brief | Modèle |
   |---|---|---|
   | Correction | `.agents/skills/review-pr/references/correctness.md` | GPT Sol 6.1 en effort high si l'environnement le permet, sinon Opus 5.5 en effort high |
   | Conventions | `.agents/skills/review-pr/references/conventions.md` | celui de la session |

   Sans sous-agent possible, appliquer les deux briefs à la suite et l'indiquer.
3. Fusionner les rapports selon le [format](references/axis.md#format) : ligne de tête et de modèle de chaque axe, statuts du registre, puis un seul tableau trié par axe et, dans chaque axe, par gravité, sans reclasser un finding d'un axe à l'autre ; numéroter les nouveaux findings `F<n>` à la suite du plus grand ID déjà attribué.

Terminé quand chaque axe a rendu son rapport et que la fusion reprend la ligne de tête et de modèle de chaque axe.
