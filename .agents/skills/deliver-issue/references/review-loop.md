# Boucle de review

L'orchestrateur enchaîne au plus 3 tours de review et tient le registre ; entre deux tours, le sous-agent de développement corrige.

## Registre

| ID | Axe | Gravité | Emplacement | Résumé | Statut | Tour |
|---|---|---|---|---|---|---|
| `F1` | Correction | bloquant | `chemin:ligne` | le constat en une phrase | `corrigé <sha>` | 1 |

- Il porte chaque finding `bloquant` ou `à corriger` du périmètre `issue` ; les mineurs sont gardés à part pour le verdict et le compte rendu final, les findings hors périmètre pour « Pistes ».
- Statuts : `ouvert`, `corrigé <sha>` ou `rejeté : raison`. Le reviewer qui infirme un correctif ou conteste un rejet par un argument tiré du code repasse le finding `ouvert`.

## Tour

1. Appliquer `review-pr` avec l'URL de l'issue, le worktree et la branche cible, sans le rapport du dev ; dès le tour 2, avec le SHA de tête relu au tour précédent, le registre et le plus grand ID attribué.
2. Reporter au registre chaque statut rendu et chaque nouveau finding.
3. Sans finding `ouvert`, sortir de la boucle.
4. Au tour 3, poser à l'utilisateur une question par finding `ouvert`, avec l'argument du reviewer et, le cas échéant, celui du dev ; faire appliquer sa décision par le sous-agent de développement selon « Corriger » de `.agents/skills/deliver-issue/references/develop.md`, sans nouveau tour. Sans décision, le finding reste `ouvert`.
5. Sinon, reprendre le sous-agent de développement avec les findings `ouvert` du registre, recopiés tels quels avec l'argument du reviewer, et l'instruction d'appliquer « Corriger » de `develop.md` ; reporter au registre le statut rendu pour chaque finding, puis lancer le tour suivant.

## Critère de fin

Aucun finding n'est `ouvert`, ou chaque finding `ouvert` a fait l'objet d'une question à l'utilisateur.
