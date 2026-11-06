# Recette visuelle web

La recette utilise le code du worktree livré et ses propres données locales.
Les ports fixes permettent une seule recette à la fois sur la machine.

## Prérequis

- Node.js 24, pnpm et Docker avec Compose ; `pnpm install` réussi dans le worktree livré.
- Les `.env` backend et frontend renseignés comme pour le développement ; le lancement conserve ces fichiers.
- Un navigateur pilotable avec export PNG et une session privée ou un profil dédié ; les cookies de `localhost` sont partagés entre ports.
- Autoriser `http://localhost:3100/*` dans les restrictions de référents HTTP de la clé Google Maps utilisée par le frontend.
- Un accès Git en écriture au dépôt pour publier les captures et modifier la description de la PR.

Les variables existantes gardent leurs schémas applicatifs. Le lanceur impose les endpoints recette aux seuls
processus enfants, même si le terminal ou les `.env` ciblent une autre base. Les clés Google et autres
valeurs requises restent lues depuis les `.env`. Aucune variable supplémentaire n'est nécessaire.

## Ressources et ports

Un seul fichier Compose : `apps/backend/docker-compose.resources.yml`.

| Usage | Projet Compose | Frontend / backend | PostgreSQL / Redis | Stockage |
|---|---|---|---|---|
| Dev | `cityborn_resources` | 3000 / 4000 | 5432 / 6379 | Répertoires dev existants |
| Tests | `cityborn_tests` | Aucun port HTTP fixe | 5433 / 6380 | Volumes du projet tests |
| Recette | `cityborn_recette` | 3100 / 4100 | 5434 / 6381 | Volumes du projet recette |

Les services recette sont `postgis-recette` et `redis-recette`, sous le profil `recette`.
Leurs ports de données sont liés à la boucle locale. Les images et healthchecks PostGIS/Redis sont communs.
Les commandes de démarrage et d'arrêt ciblent explicitement leur projet et leurs services.

## Démarrer depuis le worktree livré

Vérifier d'abord qu'aucune autre recette n'occupe 3100/4100 ni les ressources du projet `cityborn_recette`.
En cas d'occupation, laisser les processus présents et reporter le conflit ; terminer la recette précédente
avant d'en démarrer une autre. Utiliser un worktree distinct de celui des serveurs dev déjà actifs.

```bash
pnpm recette:prepare
```

Cette commande attend PostGIS et Redis, applique les migrations existantes et recharge le seed uniquement
sur la base recette. Elle ne vide aucune base dev ou test. Les données recette sont réutilisables après arrêt ;
une nouvelle préparation recharge les comptes et le contenu du seed.

Dans deux terminaux, à la racine du même worktree :

```bash
pnpm recette:backend
```

```bash
pnpm recette:frontend
```

Le frontend appelle l'API HTTP et WebSocket sur 4100. Le backend accepte l'origine `http://localhost:3100`
et génère ses liens frontend avec cette origine. Le port frontend est explicite : un port occupé est une erreur.
Ces commandes appellent directement les apps ; elles ne passent pas par Turbo et son filtrage d'environnement.

Ouvrir `http://localhost:3100`, puis se connecter avec `player` / `Password123`.
Parcours de vérification minimal : connexion, consultation des packs, ouverture d'une session solo.
Pour chaque PR, choisir ensuite les scénarios selon les critères de l'issue et les tests manuels attendus.

## Arrêter

Arrêter avec Ctrl+C chacun des deux serveurs lancés pour la recette, puis :

```bash
pnpm db:recette:stop
```

Cette commande arrête seulement les deux services recette, en conservant leurs volumes.
`pnpm db:recette:start` permet de démarrer seulement ces ressources, sans migrations ni seed.

## Publier les captures

Enregistrer 1 à 3 PNG desktop finaux hors du checkout, par exemple dans un répertoire temporaire.
Contrôler leur lisibilité et leur contenu avant publication.

```bash
pnpm recette:captures 123 /chemin/absolu/packs.png /chemin/absolu/session.png
```

La commande :

- vérifie le numéro de PR et la signature PNG des fichiers ;
- crée la branche distante orpheline `recette` à la première publication, puis prolonge cette histoire indépendante ;
- remplace les captures de cette PR sous `pr-123/capture-1.png`, sans toucher aux autres PR ;
- utilise un index temporaire, sans changer le checkout, sa branche, son index ou son HEAD ;
- pousse avec une vérification du SHA distant attendu ; en cas de publication concurrente, échoue sans écraser l'autre publication ;
- retourne les images Markdown avec des URL GitHub figées sur le SHA du commit des captures.

Coller ces images dans « Recette » dans la description actuelle de la PR, avec le SHA de la branche testée,
le viewport, les scénarios, résultats et anomalies. Cocher seulement les tests manuels web exécutés et réussis.
Les PNG restent sur `recette` ; cette branche ne se fusionne pas dans `main`.
Une capture remplacée reste accessible par son ancien SHA.

Si le navigateur manque, inscrire :
« ⚠️ Non réalisée : l’environnement de l’agent ne fournit pas de navigateur. »
Pour tout autre blocage, indiquer la cause réelle et les scénarios non exécutés.
Les anomalies constatées sont rapportées sans correction automatique.

## Anciens conteneurs de test

Des tests ont pu être démarrés sous `cityborn_resources` avant l'usage de `cityborn_tests`.
S'ils occupent 5433/6380, vérifier leur projet et service avant de supprimer uniquement ces deux conteneurs :

```bash
docker ps -a --filter label=com.docker.compose.project=cityborn_resources --filter label=com.docker.compose.service=postgis-test
docker ps -a --filter label=com.docker.compose.project=cityborn_resources --filter label=com.docker.compose.service=redis-test
docker compose -p cityborn_resources -f apps/backend/docker-compose.resources.yml --profile test rm --stop --force postgis-test redis-test
pnpm db:test:start
```

Les volumes de ces anciens tests sont conservés. Les nouveaux tests utilisent ceux de `cityborn_tests`.
Les services dev et leurs volumes restent intacts ; les commandes dev ne retirent plus les conteneurs orphelins.
