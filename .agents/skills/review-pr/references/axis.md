# Relire un axe

Tu relis la cible sur le seul axe de ton brief ; l'autre axe tourne en parallèle. Tu restes en lecture seule et mènes toute la review toi-même, sans sous-agent ni skill de review.

## Étapes

1. Après `git fetch --all --prune`, la tête relue est `HEAD` du worktree de la cible, sinon `origin/<branche>`. Résoudre le diff : `gh pr diff` pour une PR, sinon `git diff origin/<base>...<tête>` ; en relecture, `git diff <SHA de départ>..<tête>`. Lire le code à cette tête : dans le worktree, sinon par `git show <tête>:<chemin>`.
2. Lire l'issue liée et ses commentaires, et en extraire les critères d'acceptation ; sans issue, les déduire de la description de la PR. Les affirmations de cette description restent à démontrer par le code.
3. Confronter chaque fichier du diff à chaque point de la checklist du brief, en ouvrant appelants et voisins dès qu'un constat en dépend.
4. Confirmer chaque finding en relisant le code concerné : garder ce qui est démontré par le code, écarter le soupçon.
5. En relecture, statuer sur chaque entrée du registre de l'axe, puis relever les nouveaux findings dans le delta seulement :
   - `corrigé <sha>` : le correctif est confirmé par le code ;
   - `rejeté : raison` : le rejet tient ;
   - `ouvert`, avec l'argument tiré du code : correctif absent ou rejet contesté.

Terminé quand chaque fichier du diff a été confronté à chaque point de la checklist et, en relecture, que chaque entrée du registre de l'axe a un statut.

## Gravité

| Gravité | Sens |
|---|---|
| 🔴 `bloquant` | bug, faille, critère non satisfait ou sans preuve |
| 🟠 `à corriger` | règle d'`AGENTS.md` ou d'un skill violée, test manquant, élargissement du périmètre |
| 🟡 `mineur` | amélioration facultative, jamais corrigée |

## Périmètre

- `issue` : ce que le diff introduit, et tout ce qui empêche un critère de l'issue d'être satisfait, même hors du diff.
- `hors périmètre` : défaut préexistant sans effet sur les critères, à signaler seulement.

## Format

1. En relecture, une ligne par entrée du registre : `<ID> : <statut>`.
2. Les nouveaux findings, du plus grave au moins grave, dans un tableau :

   | ID | Axe | Gravité | Périmètre | Emplacement | Résumé |
   |---|---|---|---|---|---|
   | `F1` | Correction | 🔴 bloquant | issue | `chemin:ligne` | le constat en une phrase |

3. Sous le tableau, une section par finding titrée `<ID> <emoji de gravité> <résumé>`, avec :
   - `règle` : le point de checklist ou la règle précise enfreinte ;
   - `constat` : ce qui ne va pas, démontré par le code ;
   - `correctif` : le changement attendu.
4. Les sections propres au brief.

Sans finding, l'indiquer explicitement avec les points de checklist couverts.
