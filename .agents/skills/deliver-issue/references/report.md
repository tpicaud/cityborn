# Rapport de livraison

Le rapport de livraison sert à la fois de description de la PR et de compte rendu final de `deliver-issue`. Son lecteur est le dev qui relit avant de merger : le rapport lui explique ce qui a été fait et comment ça fonctionne, sans qu'il ait besoin du diff.

## Rédaction

- Chaque mise à jour part de la description actuelle de la PR et la ramène à l'état de la branche au dernier commit, sans historique des passages précédents.
- Suivre le [gabarit](#gabarit), dans son ordre, en remplaçant chaque texte d'exemple ; omettre une section vide.
- Le rapport est télégraphique : une phrase tient en environ 120 caractères.
- Un symbole ou un fichier n'y figure que s'il situe une pièce clé du changement ou une surface publique, un par phrase au plus.

## Sections

- **Critères non satisfaits** : un critère d'acceptation qui attend seulement un test manuel va dans « Tests manuels attendus ».
- **Comment ça marche** : quelques phrases de prose, complétées au besoin de bullets pour les étapes du flux ; cinq phrases ou bullets au plus. Quand le flux traverse au moins trois acteurs, comme client, serveur et Redis, un diagramme de séquence Mermaid peut remplacer les bullets.
- **Décisions prises**, **Déploiement** et **Tests manuels attendus** : chaque bullet commence par un libellé court en gras qui nomme son sujet ; dans « Décisions prises », les points liés partagent une bullet.
- **Déploiement** : toujours présente ; une case par action hors du déploiement habituel, backend puis clients, et une bullet par effet de transition qui change ce que le dev fait ou surveille au déploiement. Sans rien de tel, la section contient seulement `✅ RAS`.
- **Tests manuels attendus** : seulement quand l'UI est touchée.
- Les autres sections listent chaque élément.

## Gabarit

```markdown
## En bref

Une ou deux phrases : le comportement ou la structure obtenus.

## Critères non satisfaits

- ❌ Critère de l'issue : pourquoi.

## Comment ça marche

Une ou deux phrases sur le principe du changement.

- Une bullet par étape du flux, quand l'ordre compte.

## Décisions prises

- **Choix en quelques mots** : fait hors des consignes de l'issue, plutôt que l'alternative ; raison, et sa contrepartie s'il en a une.

## Pistes

- Problème hors périmètre : ce qu'il y a à voir.

## Déploiement

- [ ] **Migration, variable d'environnement, donnée Redis ou configuration d'hébergement** : l'action attendue.
- **Effet de transition** : ce que vivent les clients déployés, les sessions en cours ou les données existantes.

## Tests manuels attendus

- [ ] **Plateforme et mode** : scénario → résultat attendu.

Closes #<numéro>
```
