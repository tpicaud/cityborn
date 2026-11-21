---
name: review-pr
description: "Review Cityborn d'une PR ou d'une branche, pour toute demande de review sans outil désigné : confronter le diff à son issue, aux règles d'AGENTS.md, aux skills de conventions, à la sécurité et aux tests."
---

# Relire une PR

La review rend des findings : le code, la branche et GitHub restent inchangés. Publier les findings sur la PR uniquement à la demande de l'utilisateur.

## Étapes

1. Résoudre la cible : une PR (`gh pr view`, `gh pr diff`) ou, à défaut, la branche courante (`git diff origin/main...HEAD`) après `git fetch --all --prune`.
2. Lire l'issue liée (`Closes #…` dans la PR, ou numéro de la branche) et ses commentaires. En extraire les critères d'acceptation ; sans issue, les déduire de la description de la PR. Les affirmations de cette description (vérifications passées, impacts écartés) restent à démontrer par le code.
3. Charger les skills de conventions des périmètres du diff.
4. Relire chaque fichier modifié avec son contexte, à travers chaque axe de la [checklist](#checklist). Ouvrir les appelants et les fichiers voisins dès qu'un constat en dépend.
5. Confirmer chaque finding en relisant le code concerné : garder ce qui est démontré par le code, écarter le soupçon.
6. En relecture, avec la tête relue au tour précédent et ses findings :
   - statuer sur chaque finding transmis : `résolu`, ou `ouvert` avec l'argument tiré du code quand le correctif manque ou que le rejet ne tient pas ;
   - relever les nouveaux findings dans `git diff <tête précédente>..HEAD` seulement, numérotés à la suite.

L'étape 4 est terminée quand chaque fichier du diff a été confronté à chaque axe.

## Checklist

- **Issue** : chaque critère d'acceptation satisfait et prouvé par un test ou une commande, sauf un critère « (vérification manuelle) » ; rien d'ajouté hors de l'issue.
- **Correction** : logique, cas limites, erreurs propagées, concurrence, états partiels, appelants cassés hors du diff.
- **Sécurité** : authentification et autorisation de chaque route ou event touché, validation zod des entrées, secrets absents du code, des logs et des réponses, données exposées au strict nécessaire, injections.
- **Règles d'`AGENTS.md`** : chaque règle, dont chaque symptôme de « Découpage ».
- **Skills de conventions** : chaque règle des skills chargés à l'étape 3.
- **Tests** : chaque comportement ajouté ou modifié est couvert par un test.
- **Documentation** : une convention modifiée est reflétée dans `AGENTS.md` ou le skill concerné ; aucun ajout ne décrit l'implémentation du diff (noms de fichiers, comportement d'un cas particulier).

## Format des findings

Ouvrir le rapport par `tête relue : <sha>`, puis rendre les findings du plus grave au moins grave, d'abord dans un tableau récapitulatif, une ligne par finding :

| ID | Gravité | Périmètre | Emplacement | Résumé |
|---|---|---|---|---|
| `F1` | 🔴 bloquant | issue | `chemin:ligne` | le constat en une phrase |

- `ID` : `F1`, `F2`… ;
- `Gravité` : 🔴 `bloquant` (bug, faille, critère non satisfait ou sans preuve), 🟠 `majeur` (règle d'`AGENTS.md` ou d'un skill violée) ou 🟡 `mineur` ;
- `Périmètre` : `issue` (introduit par le diff, ou défaut qui empêche un critère même hors du diff) ou `hors périmètre` (défaut préexistant sans effet sur les critères, à signaler seulement) ;
- `Emplacement` : `chemin:ligne`.

Puis, sous le tableau, une section par finding titrée `<ID> <emoji de gravité> <résumé>`, avec :

- `règle` : l'axe de la checklist ou la règle précise enfreinte ;
- `constat` : ce qui ne va pas, démontré par le code ;
- `correctif` : le changement attendu.

Sans finding, l'indiquer explicitement avec les axes couverts.
