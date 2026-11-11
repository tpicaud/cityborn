# Rapport de livraison

Le rapport de livraison sert à la fois de description de la PR et de compte rendu final de `deliver-issue`. Son lecteur est le dev qui relit avant de merger : le rapport lui explique ce qui a été fait et comment ça fonctionne, sans qu'il ait besoin du diff.

## Rédaction

- Le relecteur a lu l'issue : chaque phrase lui apprend ce que ni l'issue ni « En bref » ne disent, et oriente sa relecture, son déploiement ou sa recette.
- Chaque mise à jour part de la description actuelle de la PR et la ramène à l'état de la branche au dernier commit, sans historique des passages précédents.
- Suivre le [gabarit](#gabarit), dans son ordre, en remplaçant chaque texte d'exemple ; omettre une section vide.
- Le rapport est télégraphique : une phrase tient en environ 120 caractères.
- Un symbole ou un fichier n'y figure que s'il situe une pièce clé du changement ou une surface publique, un par phrase au plus.

## Sections

- **Critères non satisfaits** : un critère d'acceptation qui attend seulement un test manuel va dans « Recette ».
- **Comment ça marche** : le mécanisme qui produit le comportement, ses pièces et leur enchaînement ; le résultat et le code retiré se lisent dans « En bref » et le diff. Quelques phrases de prose, complétées au besoin de bullets pour les étapes du flux ; cinq phrases ou bullets au plus. Quand le flux traverse au moins trois acteurs, comme client, serveur et Redis, un diagramme de séquence Mermaid peut remplacer les bullets.
- **Décisions prises** : un arbitrage dont l'alternative écartée aurait été un choix crédible pour le relecteur ; sans alternative à nommer, ce n'est pas une décision. Une phrase par décision, sans détail d'implémentation.
- **Décisions prises** et **Déploiement** : chaque bullet commence par un libellé court en gras qui nomme son sujet ; dans « Décisions prises », les points liés partagent une bullet.
- **Déploiement** : toujours présente ; une case par action hors du déploiement habituel, backend puis clients, et une bullet par effet de transition qui change ce que le dev fait ou surveille au déploiement. Sans rien de tel, la section contient seulement `Aucune action particulière à effectuer.`.
- Les autres sections listent chaque élément.
- **Recette** : toujours présente ; un parcours est un scénario de bout en bout, joué dans l'app lancée comme le ferait un utilisateur.
  - Chaque parcours a un titre de niveau 3 au format `### <statut> <parcours> — <plateforme>`.
  - Sous chaque titre, écrire une courte liste numérotée des actions utilisateur et vérifications attendues, puis `**Résultat :**` sur une ligne distincte et enfin les captures associées.
  - À la rédaction, retenir les parcours utilisateur directement modifiés, du plus risqué au moins risqué, cinq au plus. Sans parcours modifié, la section contient seulement `Non applicable : aucun parcours utilisateur modifié.`.
  - Avant recette, lister les actions prévues ; après recette, restituer les actions effectuées et signaler celles non exécutées.
  - Le statut du titre est `✅` pour une réussite, `❌` pour un échec ou `⏸️` pour une non-exécution ; le résultat donne l’observé ou le motif de non-exécution.
  - Remplacer les résultats rejoués ; invalider les validations affectées par un correctif. Conserver tous les scénarios et leurs attentes.
  - Ajouter « Notes » sous « Recette » seulement pour les exceptions utiles : anomalie, blocage, preuve manquante, changement de modèle ou nettoyage incomplet. Omettre le déroulement normal de l’infrastructure.

## Gabarit

```markdown
## 📌 En bref

Une ou deux phrases : le comportement ou la structure obtenus.

## ❌ Critères non satisfaits

- ❌ Critère de l'issue : pourquoi.

## ⚙️ Comment ça marche

Une ou deux phrases sur le principe du changement.

- Une bullet par étape du flux, quand l'ordre compte.

## 🧭 Décisions prises

- **Choix en quelques mots** : fait hors des consignes de l'issue, plutôt que l'alternative ; raison, et sa contrepartie s'il en a une.

## 💡 Pistes

- Problème hors périmètre : ce qu'il y a à voir.

## 🚀 Déploiement

- [ ] **Migration, variable d'environnement, donnée Redis ou configuration d'hébergement** : l'action attendue.
- **Effet de transition** : ce que vivent les clients déployés, les sessions en cours ou les données existantes.

## Recette

### ⏸️ Parcours — Plateforme

1. Ouvrir l’application.
2. Effectuer l’action du parcours.
3. Vérifier le résultat attendu.

**Résultat :** non exécuté, en attente de recette.

Après recette, actualiser le statut du titre et le résultat, puis ajouter la capture disponible :

![Capture du résultat observé](https://github.com/<owner>/<repo>/blob/<SHA-captures>/pr-<num>/capture-1.png?raw=true)

Closes #<numéro>
```
