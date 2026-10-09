---
name: review-pr
description: "Review Cityborn d'une PR ou d'une branche, pour toute demande de review sans outil désigné : confronter le diff à son issue, aux règles d'AGENTS.md, aux skills métier, à la sécurité et aux tests."
---

# Relire une PR

La review rend des findings : le code, la branche et GitHub restent inchangés. Publier les findings sur la PR uniquement à la demande de l'utilisateur.

## Étapes

1. Résoudre la cible : une PR (`gh pr view`, `gh pr diff`) ou, à défaut, la branche courante (`git diff origin/main...HEAD`) après `git fetch --all --prune`.
2. Lire l'issue liée (`Closes #…` dans la PR, ou numéro de la branche) et ses commentaires. En extraire les critères d'acceptation ; sans issue, les déduire de la description de la PR. Les affirmations de cette description (vérifications passées, impacts écartés) restent à démontrer par le code.
3. Charger les skills métier déclenchés par les fichiers du diff.
4. Relire chaque fichier modifié avec son contexte, à travers chaque axe de la [checklist](#checklist). Ouvrir les appelants et les fichiers voisins dès qu'un constat en dépend.
5. Confirmer chaque finding en relisant le code concerné : garder ce qui est démontré par le code, écarter le soupçon.

L'étape 4 est terminée quand chaque fichier du diff a été confronté à chaque axe.

## Checklist

- **Issue** : chaque critère d'acceptation est satisfait ; le diff reste dans le périmètre demandé.
- **Correction** : logique, cas limites, erreurs propagées, concurrence, états partiels.
- **Sécurité** : authentification et autorisation de chaque route ou event touché, validation zod des entrées, secrets absents du code, des logs et des réponses, données exposées au strict nécessaire, injections.
- **Règles d'`AGENTS.md`** : principes, chaque symptôme de « Découpage », style de code, frontières du monorepo, configuration d'environnement, garde-fous.
- **Skills métier** : chaque règle des skills chargés à l'étape 3.
- **Contrat API** : rétrocompatibilité et conventions de `api-contract-change` pour tout changement dans `packages/api`.
- **Tests** : chaque comportement ou invariant significatif est testé au bon tier ; aucun test ne recopie l'implémentation.
- **Documentation** : `AGENTS.md`, le skill concerné ou le `README.md` suivent toute convention ou commande modifiée.

## Format des findings

Rendre les findings du plus grave au moins grave, chacun avec :

- `id` : `F1`, `F2`… ;
- `gravité` : `bloquant` (bug, faille, critère non satisfait), `majeur` (règle d'`AGENTS.md` ou d'un skill violée) ou `mineur` ;
- `périmètre` : `issue` (à corriger dans la PR) ou `hors périmètre` (architecture préexistante, à signaler seulement) ;
- `emplacement` : `chemin:ligne` ;
- `règle` : l'axe de la checklist ou la règle précise enfreinte ;
- `constat` : ce qui ne va pas, démontré par le code ;
- `correctif` : le changement attendu.

Sans finding, l'indiquer explicitement avec les axes couverts.
