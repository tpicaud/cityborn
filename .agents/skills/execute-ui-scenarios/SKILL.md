---
name: execute-ui-scenarios
description: "Exécuter ou rejouer des scénarios de recette web desktop fournis : préparer l'environnement isolé, vérifier les résultats et rendre un rapport avec captures."
---

# Exécuter une recette web

## 1. Prendre les scénarios

- Identifier le checkout et tous les scénarios fournis, directement ou via une source désignée ; aucune PR requise.
- Relever préconditions, actions et résultats attendus ; ne pas inventer les attentes manquantes.
- Prendre en charge le frontend joueur et le back-office en web desktop ; marquer les scénarios hors périmètre ou incomplets non exécutés, avec leur motif.
- Sans scénario exécutable, rapporter le motif sans démarrer l'environnement.

Terminé quand chaque scénario est exécutable ou porte un motif de non-exécution.

## 2. Préparer l'environnement

- Relever le commit et les modifications locales du checkout ; utiliser un checkout distinct des serveurs dev actifs.
- Vérifier Node.js 24, pnpm, Docker Compose, les dépendances installées et les `.env` backend/frontend/back-office renseignés.
- Utiliser le navigateur fourni avec une session distincte et un viewport desktop ; les cookies de `localhost` sont partagés entre ports. Sans navigateur, rapporter explicitement son absence.
- Vérifier que les ports 3100/3101/4100/5434/6381 sont libres et le projet Compose `cityborn_recette` arrêté ; préserver les ressources en conflit.
- Depuis la racine, lancer `pnpm recette:prepare`, puis `pnpm recette:web` pour lancer les trois serveurs ensemble. Relever les ressources lancées, même en cas d'échec.
- Pour Google Maps, les clés des apps web doivent autoriser leurs origines recette (`http://localhost:3100/*` et `http://localhost:3101/*`).

Terminé quand le frontend répond sur `http://localhost:3100`, le back-office sur `http://localhost:3101` et le backend sur `http://localhost:4100`. Tout blocage passe à l'arrêt et au rapport.

## 3. Exécuter et observer

- Vérifier les préconditions ; préparer les données uniquement dans l'environnement recette, sans contourner le comportement testé. Le seed fournit `player` / `Password123` pour le frontend et `admin` / `Password123` pour le back-office, sans garantir un état initial complet.
- Rejouer chaque scénario exécutable et comparer l'observé à l'attendu ; aucun succès antérieur ne vaut validation.
- Après un échec, continuer les scénarios indépendants ; signaler les scénarios bloqués.
- Rapporter les anomalies sans corriger le code.
- Garder 1 à 3 PNG lisibles associés aux scénarios, hors du checkout, sans secrets ni outils de développement. Cette limite ne réduit pas les scénarios exécutés.

Terminé quand chaque scénario porte un résultat ou un motif de non-exécution.

## 4. Arrêter et rendre compte

- Arrêter uniquement les serveurs et ressources lancés, même après échec (`pnpm db:recette:stop`). Conserver les volumes ; signaler tout échec de nettoyage.
- Rendre un rapport daté avec l'état testé, le viewport et, pour chaque scénario, les actions utilisateur réellement effectuées, celles non exécutées, l’attendu et l’observé : ✅ réussi, ❌ échoué ou ⏸️ non exécuté avec motif.
- Fournir les chemins absolus des captures associées, ou leur motif d'absence ; laisser la publication à l'appelant.

## Critère de fin

Chaque scénario demandé porte un état étayé pour cette exécution. Les ressources lancées sont arrêtées ou leur état signalé. Le code, les `.env`, la branche, l'index et les données dev/test restent inchangés.
