---
name: recette
description: "Recette visuelle web d'une PR Cityborn, autonome ou après livraison : parcourir les scénarios, publier les captures et renseigner le rapport."
---

# Recette visuelle web

## Préparer

1. Résoudre la PR, son issue, le worktree livré et sa branche ; lire les critères de l'issue, les commentaires et les tests manuels attendus de la description actuelle de la PR.
2. Utiliser une session de navigateur distincte (privée ou profil dédié), les cookies de `localhost` étant partagés entre ports. Vérifier que l'environnement permet de piloter un navigateur et d'enregistrer des captures PNG. Sans navigateur, renseigner « ⚠️ Non réalisée : l’environnement de l’agent ne fournit pas de navigateur. » dans « Recette » et terminer ; préciser toute autre cause réelle de blocage.
3. Appliquer [le démarrage de la recette](../../../docs/recette.md) depuis le worktree livré. Relever le SHA de la branche, vérifier qu'aucune autre recette n'occupe les ports fixes, puis préparer les données et démarrer les deux serveurs. Conserver les processus déjà présents et les fichiers `.env`.

La préparation est terminée quand le frontend répond sur 3100, le backend sur 4100 et que le navigateur permet la connexion du joueur du seed. Tout échec figure dans « Recette » avec sa cause ; seules les ressources lancées pour cette recette sont arrêtées.

## Parcourir et capturer

- Choisir les scénarios web à partir des critères de l'issue et des tests manuels attendus ; privilégier l'apport principal de la PR.
- Utiliser un viewport desktop ; attendre les états finaux lisibles et masquer les outils de développement avant les captures.
- Exécuter chaque scénario choisi et consigner le résultat observé, les anomalies et la route.
- Garder 1 à 3 captures PNG finales, chacune associée à un scénario ; vérifier leur lisibilité et l'absence de secrets.
- Signaler les anomalies dans le rapport, sans lancer de boucle automatique de correction.
- Limiter la recette au web desktop : mobile, animations, vidéos, GIF et comparaisons avant/après restent hors périmètre.
- Utiliser le navigateur fourni par l'environnement et conserver l'infrastructure de navigation existante.

Cette étape est terminée quand chaque scénario choisi porte un résultat observé ou une cause précise de non-exécution.

## Publier et rendre compte

1. Publier les PNG avec la commande de captures documentée dans [la recette](../../../docs/recette.md). Elle écrit sous `pr-<num>/` sur la branche orpheline `recette` et retourne des liens figés sur le SHA des captures. Conserver les PNG hors de la branche livrée et de `main`.
2. Partir de la description actuelle de la PR ; renseigner « Recette » avec le SHA testé, le viewport, les scénarios, leurs résultats, les anomalies et les images Markdown retournées. En cas de blocage, renseigner le motif explicite et les scénarios restant à vérifier.
3. Dans « Tests manuels attendus », cocher uniquement les tests web réellement exécutés et réussis ; conserver les autres cases en l'état.
4. Arrêter les serveurs lancés pour cette recette puis ses ressources, selon la documentation.

## Critère de fin

La description de la PR et le compte rendu portent les mêmes résultats et captures, ou le motif de non-exécution ; la branche livrée garde son SHA et ne contient aucun PNG de recette.
