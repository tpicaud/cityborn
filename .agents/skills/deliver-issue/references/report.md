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
  - Chaque parcours porte une plateforme, `Web` ou `Mobile`, jamais les deux ; un scénario à jouer sur les deux devient deux parcours.
  - À la rédaction, retenir les parcours utilisateur directement modifiés, du plus risqué au moins risqué, cinq au plus, tous dans « Recette manuelle ». Sans parcours modifié, la section contient seulement `Non applicable : aucun parcours utilisateur modifié.`.
  - **Recette manuelle** : une case par parcours, sur une ou deux lignes, au format `- [ ] **<parcours> — <plateforme>** : <action> → <action> → <résultat attendu>`.
  - **Recette agent** : un parcours joué par l'agent quitte « Recette manuelle » pour un titre de niveau 4 au format `#### <statut> <parcours> — <plateforme>`, avec `✅` pour une réussite ou `❌` pour un échec.
    - Sous chaque titre, une courte liste numérotée des actions effectuées, puis `**Résultat :**` sur une ligne distincte avec l'observé, et enfin les captures associées.
    - Un parcours que l'agent n'a pas joué jusqu'au bout reste dans « Recette manuelle » ; son motif va dans « Notes ».
  - Remplacer les résultats rejoués ; un correctif qui invalide un parcours validé le renvoie dans « Recette manuelle ». Conserver tous les parcours et leurs attentes.
  - Ajouter « Notes » à la fin de « Recette agent » seulement pour les exceptions utiles : anomalie, blocage, preuve manquante, changement de modèle ou nettoyage incomplet. Omettre le déroulement normal de l’infrastructure.

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

## 🧪 Recette

### 🙋 Recette manuelle

- [ ] **Parcours — Web** : ouvrir l'écran → effectuer l'action → résultat attendu.
- [ ] **Parcours — Mobile** : ouvrir l'écran → effectuer l'action → résultat attendu.

### 🤖 Recette agent

#### ✅ Parcours — Web

1. Action effectuée.
2. Vérification effectuée.

**Résultat :** observé.

![Capture du résultat observé](https://github.com/<owner>/<repo>/blob/<SHA-captures>/pr-<num>/capture-1.png?raw=true)

#### Notes

- **Exception** : ce qu'il y a à savoir.

Closes #<numéro>
```
