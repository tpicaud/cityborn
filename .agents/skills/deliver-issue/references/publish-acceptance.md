# Publier la recette

1. Lire le rapport de recette et la description actuelle de la PR.
2. Publier les captures disponibles : `pnpm recette:captures <numéro-PR> <PNG> [PNG] [PNG]`, avec 1 à 3 chemins absolus.
3. Actualiser « Recette » selon le format du [rapport de livraison](report.md), avec les parcours, résultats et images Markdown retournés, sans toucher aux autres scénarios ni sections.
4. Signaler les échecs de publication ou l'absence de captures ; conserver les résultats et chemins disponibles.

Les PNG restent sur la branche orpheline `recette`, jamais dans la branche livrée ni dans `main`. Leurs URL sont figées sur le SHA des captures.

Terminé quand chaque résultat et ses preuves, ou leur motif d'absence, figurent dans la PR ; la branche livrée garde son SHA.
