# Boucle de review

L'orchestrateur enchaîne au plus 3 tours de review, tient le registre, puis vérifie le critère de merge et rédige le verdict.

## Registre

| ID | Axe | Gravité | Emplacement | Résumé | Statut | Tour |
|---|---|---|---|---|---|---|
| `F1` | Correction | bloquant | `chemin:ligne` | le constat en une phrase | `corrigé <sha>` | 1 |

- Il porte chaque finding `bloquant` ou `à corriger` du périmètre `issue` ; les mineurs et les findings hors périmètre sont gardés à part, pour le verdict et la description.
- Statuts : `ouvert`, `corrigé <sha>` ou `rejeté : raison`. Le reviewer qui infirme un correctif ou conteste un rejet par un argument tiré du code repasse le finding `ouvert`.

## Tour

1. Appliquer `review-pr` avec l'URL de l'issue, l'URL de la PR et le worktree ; dès le tour 2, avec le SHA de tête relu au tour précédent et le registre. Le rapport du dev et ceux des correctifs restent chez l'orchestrateur.
2. Reporter au registre chaque statut rendu et chaque nouveau finding.
3. Sans finding `ouvert`, sortir de la boucle.
4. Au tour 3, poser à l'utilisateur une question par finding `ouvert`, avec l'argument du reviewer et celui du correcteur ; faire appliquer sa décision par un sous-agent de correctifs, sans nouveau tour. Sans décision, le verdict passe à ⛔.
5. Sinon, lancer le sous-agent de [correctifs](#correctifs), puis le tour suivant.

## Correctifs

Transmettre au sous-agent l'URL de l'issue, l'URL de la PR et les findings `ouvert` du registre, recopiés tels quels avec l'argument du reviewer. Il doit :

- charger les skills de conventions des périmètres touchés ;
- corriger chaque finding, ou le rejeter avec une raison tirée du code ;
- vérifier chaque correctif ;
- livrer selon la section « Livrer » de `.agents/skills/deliver-issue/references/develop.md`, sans toucher la description de la PR.

Son rapport donne, par finding, `corrigé <sha>` ou `rejeté : raison`, le résultat de `pnpm verify` sur le dernier commit poussé, puis chaque vérification en échec ou non exécutée, avec la raison.

## Critère de merge

1. `pnpm verify` est vert sur le dernier commit poussé, d'après le rapport du dernier sous-agent qui a poussé.
2. Après `git fetch`, `git merge-base --is-ancestor origin/<branche cible> HEAD` réussit. Sinon, un sous-agent de correctifs applique la section « Mettre la branche à jour » de `.agents/skills/deliver-issue/references/prepare.md`, puis livre selon « Livrer » de `develop.md` ; il rend les fichiers dont il a résolu un conflit, sans nouveau tour de review.
3. Aucun finding n'est `ouvert`.

## Verdict

Une citation d'une ligne, transmise telle quelle à la rédaction :

- critère de merge tenu : `> ✅ **Prête pour recette** · Review : <n> tours (<modèle Correction> + <modèle Conventions>) · 0 bloquant · 0 à corriger · <n> mineurs non traités · <n> critères à vérifier en recette` ;
- sinon : `> ⛔ **Bloquée** : <condition en échec ou finding ouvert, en quelques mots>, décision attendue.`

Y ajouter `review mono-famille` quand l'axe Correction a tourné sur la famille du modèle de la session, et `conflits résolus : <fichiers>` après un rebase conflictuel. Les critères à vérifier en recette viennent des preuves du dernier tour.

## Critère de fin

Aucun finding n'est `ouvert` sans question posée, le critère de merge est vérifié et le verdict rédigé.
