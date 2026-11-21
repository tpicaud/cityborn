# Rapport de livraison

Le rapport de livraison sert à la fois de description de la PR et de compte rendu final de `deliver-issue`. Son lecteur est le dev qui relit avant de merger : le rapport lui explique ce qui a été fait et comment ça fonctionne, sans qu'il ait besoin du diff.

## Rédaction

- Le relecteur a lu l'issue : chaque phrase lui apprend ce que ni l'issue ni « En bref » ne disent, et oriente sa relecture ou son déploiement.
- Chaque mise à jour part de la description actuelle de la PR et la ramène à l'état de la branche au dernier commit, sans historique des passages précédents.
- Suivre le [gabarit](#gabarit), dans son ordre, en remplaçant chaque texte d'exemple ; omettre une section vide.
- Le rapport est télégraphique : une phrase tient en environ 120 caractères, un paragraphe sur une seule ligne.
- Un symbole ou un fichier n'y figure que s'il situe une pièce clé du changement ou une surface publique, un par phrase au plus.

## Sections

- **Verdict** : absent du gabarit, posé en première ligne par l'orchestrateur seul, à la sortie de la boucle de review :
  - aucun finding `bloquant` ni `majeur` ouvert : `> ✅ **Prête pour recette** · <n> tours · <modèle du reviewer>` ;
  - sinon : `> ⛔ **Bloquée** · <n> tours · <modèle du reviewer>`, suivi d'une bullet par finding ouvert avec son ID, son résumé, l'argument du reviewer et, en cas de rejet, la raison du correcteur.
- **À vérifier en recette** : une case par critère « (vérification manuelle) », avec ce qu'il faut regarder et où.
- **Comment ça marche** : le mécanisme qui produit le comportement, ses pièces et leur enchaînement ; le résultat et le code retiré se lisent dans « En bref » et le diff. Quelques phrases de prose, complétées au besoin de bullets pour les étapes du flux ; cinq phrases ou bullets au plus. Quand le flux traverse au moins trois acteurs, comme client, serveur et Redis, un diagramme de séquence Mermaid peut remplacer les bullets.
- **Décisions prises** : un arbitrage dont l'alternative écartée aurait été un choix crédible pour le relecteur ; sans alternative à nommer, ce n'est pas une décision. Une phrase par décision, sans détail d'implémentation.
- **Décisions prises** et **Déploiement** : chaque bullet commence par un libellé court en gras qui nomme son sujet ; dans « Décisions prises », les points liés partagent une bullet.
- **Déploiement** : toujours présente ; une case par action hors du déploiement habituel, backend puis clients, et une bullet par effet de transition qui change ce que le dev fait ou surveille au déploiement. Sans rien de tel, la section contient seulement `Aucune action particulière à effectuer.`.
- Les autres sections listent chaque élément.

## Gabarit

```markdown
## 📌 En bref

Une ou deux phrases : le comportement ou la structure obtenus.

## ❌ Critères non satisfaits

- ❌ Critère de l'issue : pourquoi.

## 🔍 À vérifier en recette

- [ ] Critère de l'issue : ce qu'il faut regarder, sur quel écran ou appareil.

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

Closes #<numéro>
```
