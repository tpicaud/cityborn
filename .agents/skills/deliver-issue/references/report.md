# Rapport de livraison

Le rapport de livraison sert à la fois de description de la PR et de compte rendu final de `deliver-issue`. Son lecteur est le dev qui relit avant de merger : le rapport lui explique ce qui a été fait et comment ça fonctionne, sans qu'il ait besoin du diff.

## Rédaction

- Chaque mise à jour part de la description actuelle de la PR et la ramène à l'état de la branche au dernier commit, sans historique des passages précédents.
- Suivre le [gabarit](#gabarit), dans son ordre, en remplaçant chaque texte d'exemple ; omettre une section vide.
- Le rapport est télégraphique : une bullet tient en une phrase courte, environ 120 caractères.
- « Comment ça marche » tient en cinq bullets au plus ; les autres sections listent chaque élément.
- Un symbole ou un fichier n'y figure que s'il situe une pièce clé du changement ou une surface publique.

## Sections

- **Critères de l'issue** : une bullet par critère d'acceptation, satisfait ou non.
- **Tests manuels attendus** : seulement quand l'UI est touchée.
- **Review automatique** : le décompte compte tous les findings ; le tableau ne liste que ceux du périmètre, les autres vont dans « Pistes ». Sans finding dans le périmètre, le tableau laisse place à `Aucun finding dans le périmètre.`

## Gabarit

```markdown
## En bref

Une ou deux phrases : le comportement ou la structure obtenus.

## Critères de l'issue

- ✅ Critère satisfait.
- ❌ Critère non satisfait : pourquoi.

## Comment ça marche

- Une bullet par pièce ou étape, dans l'ordre du flux.

## À trancher

- Décision prise hors des consignes de l'issue, plutôt que l'alternative : raison.

## Risques et déploiement

- Contrat, comportement, migration, clients déployés ou variable d'environnement touchés : action attendue au déploiement.

## Vérifications

- ✅ Vérifications réussies, nommées sur une ligne.
- ❌ Vérification en échec : l'échec.
- ⚠️ Vérification non exécutée : la raison.

## Tests manuels attendus

- [ ] Scénario → résultat attendu.

## Review automatique

🔴 0 bloquant · 🟠 1 majeur · 🟡 2 mineurs

| ID | Gravité | Constat | Suite |
|---|---|---|---|
| `F1` | 🟠 | Le constat de la review. | ✅ Le correctif. |
| `F2` | 🟡 | Le constat de la review. | ❌ La raison du rejet. |

## Pistes

- 🟡 `F3` Finding hors périmètre : ce qu'il y a à voir.
- Problème constaté hors périmètre : ce qu'il y a à voir.

Closes #<numéro>
```
