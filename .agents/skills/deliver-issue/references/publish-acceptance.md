# Publier la recette

1. Lire le rapport de recette et la description actuelle de la PR.
2. Publier les captures disponibles : `pnpm recette:captures <numéro-PR> <PNG> [PNG] [PNG]`, avec 1 à 3 chemins absolus.
3. Déplacer chaque parcours joué jusqu'au bout de « Recette manuelle » vers « Recette agent », au [format](#recette-agent), ou remplacer son résultat s'il y figure déjà ; ne toucher à aucune autre section.
4. Laisser dans « Recette manuelle » chaque parcours non joué jusqu'au bout, avec son motif dans « Notes ».
5. Signaler les échecs de publication ou l'absence de captures ; conserver les résultats et chemins disponibles.

Les PNG restent sur la branche orpheline `recette`, jamais dans la branche livrée ni dans `main`. Leurs URL sont figées sur le SHA des captures.

Terminé quand chaque parcours joué et ses preuves, ou leur motif d'absence, figurent dans « Recette agent » ; la branche livrée garde son SHA.

## Recette agent

- Sous-section de « Recette », après « Recette manuelle ».
- Un titre de niveau 4 par parcours joué, au format `#### <statut> <parcours> — <plateforme>`, avec `✅` pour une réussite ou `❌` pour un échec.
- Sous chaque titre, une courte liste numérotée des actions effectuées, puis `**Résultat :**` sur une ligne distincte avec l'observé, et enfin les captures associées.
- « Notes » termine la section, seulement pour les exceptions utiles : anomalie, blocage, preuve manquante, changement de modèle ou nettoyage incomplet. Omettre le déroulement normal de l’infrastructure.

```markdown
### 🤖 Recette agent

#### ✅ Parcours — Web

1. Action effectuée.
2. Vérification effectuée.

**Résultat :** observé.

![Capture du résultat observé](https://github.com/<owner>/<repo>/blob/<SHA-captures>/pr-<num>/capture-1.png?raw=true)

#### Notes

- **Exception** : ce qu'il y a à savoir.
```
