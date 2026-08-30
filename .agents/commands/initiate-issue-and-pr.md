---
description: Crée une issue GitHub (template adapté), la rattache au projet Cityborn (Type DEV, Status "En développement"), puis initialise la branche/PR liée
argument-hint: [description courte de la tâche (optionnel)]
---

# Rôle

Automatiser le début d'une tâche : créer une issue GitHub correctement classée et
rattachée au board du projet Cityborn, puis démarrer le travail de code (branche
liée, et PR draft si du travail est déjà en cours).

Contexte fourni par l'utilisateur (optionnel) : $ARGUMENTS

## Étape 1 — Comprendre la tâche

Utiliser `$ARGUMENTS` et/ou le contexte de la conversation en cours pour savoir
ce qui doit être fait. Regarder aussi l'état de la branche courante :

```
git branch --show-current
git status --short
git diff main...HEAD --stat
git diff --stat
```

Si rien de tout ça ne permet de comprendre la tâche, demander à l'utilisateur
avant de continuer.

## Étape 2 — Choisir le template d'issue

Choisir UN des templates de `.github/ISSUE_TEMPLATE/` selon la nature du
diff/de la tâche :

| Template          | Fichier                                    | Label GitHub | Quand l'utiliser                                                           |
| ------------------ | ------------------------------------------- | ------------ | ---------------------------------------------------------------------------- |
| Bug                | `.github/ISSUE_TEMPLATE/bug.md`             | `Bug`        | Correction d'un comportement cassé / incorrect                              |
| Nouvelle feature   | `.github/ISSUE_TEMPLATE/nouvelle-feature.md`| `Feature`    | Nouvelle fonctionnalité ou évolution visible                                |
| Tâche technique    | `.github/ISSUE_TEMPLATE/tâche-technique.md` | `Tech`       | Refacto, dette technique, dépendances, CI/CD, migration, outillage sans changement fonctionnel direct |

Si c'est ambigu entre deux templates, poser la question à l'utilisateur (une
mauvaise classification pollue le board) plutôt que de deviner.

Lire le template choisi et remplir réellement ses sections (ne pas laisser les
placeholders `<!-- ... -->`).

## Étape 3 — Créer l'issue

```
gh issue create \
  --title "<titre concis, sans préfixe #>" \
  --body "<corps rempli à partir du template>" \
  --label "<Bug|Feature|Tech>" \
  --assignee "@me"
```

`gh issue create` retourne l'URL de l'issue créée ; le numéro est le dernier
segment de l'URL.

## Étape 4 — Rattacher l'issue au projet Cityborn avec les bons champs

Le projet est le project GitHub utilisateur `tpicaud`, numéro `1` ("Cityborn"),
id `PVT_kwHOBljjK84BRv8N`.

```
ITEM_ID=$(gh project item-add 1 --owner tpicaud --url <issue-url> --format json -q .id)

# Type = DEV
gh project item-edit --id "$ITEM_ID" \
  --project-id PVT_kwHOBljjK84BRv8N \
  --field-id PVTSSF_lAHOBljjK84BRv8NzhD1vfY \
  --single-select-option-id 8ca56bc2

# Status = En développement
gh project item-edit --id "$ITEM_ID" \
  --project-id PVT_kwHOBljjK84BRv8N \
  --field-id PVTSSF_lAHOBljjK84BRv8Nzg_fEiM \
  --single-select-option-id 47fc9ee4
```

L'assigné du projet est hérité de l'assigné GitHub de l'issue (`@me`, donc la
personne qui exécute la commande) — pas de champ séparé à renseigner pour ça.

Si une de ces commandes échoue avec une erreur de type "field/option not
found", c'est que les IDs ci-dessus ne sont plus valides (project modifié) :
relancer `gh project field-list 1 --owner tpicaud --format json` pour
retrouver les bons IDs de champ/option et mettre à jour ce fichier de commande
en conséquence.

## Étape 5 — Démarrer la branche / la PR

Vérifier s'il y a déjà du travail en cours sur la branche courante :

```
git rev-list --count main..HEAD
```

- **S'il y a des commits en avance sur `main`** (branche courante ≠ `main`,
  travail déjà entamé) :

  1. Pousser la branche : `git push -u origin <branche-courante>`
  2. Créer une PR **draft**, liée à l'issue via un mot-clé de fermeture dans le
     corps, avec un titre au format déjà utilisé dans ce repo
     (`#<numéro> - <titre>`) :

     ```
     gh pr create --draft \
       --title "#<numéro-issue> - <titre-issue>" \
       --body "Closes #<numéro-issue>" \
       --assignee "@me" \
       --base main
     ```

- **Sinon** (pas encore de travail : on est sur `main`, ou une branche propre
  sans commit en avance) :

  1. Créer et checkout une branche liée à l'issue (GitHub génère un nom du
     type `<numéro>-<slug-du-titre>`, déjà la convention utilisée dans ce
     repo) :

     ```
     gh issue develop <numéro-issue> --checkout
     ```

  2. Ne pas créer de PR tout de suite : il n'y a rien à proposer. Prévenir
     l'utilisateur qu'il faudra relancer une création de PR draft (même
     commande que ci-dessus) une fois qu'il y aura des commits.

## Étape 6 — Résumer

Donner à l'utilisateur : lien de l'issue créée, confirmation que l'item du
project a bien Type=DEV / Status=En développement, nom de la branche
courante, et lien de la PR si elle a été créée (sinon rappeler qu'elle reste à
faire).
