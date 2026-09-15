# Restaurer une sauvegarde de la base Cityborn

**La restauration remplace les données applicatives par leur état au moment de la
sauvegarde. Les modifications postérieures à cette sauvegarde seront perdues.**
L'URL utilisée par l'application reste identique ; aucun second projet Supabase
n'est nécessaire.

Toutes les commandes sont à lancer depuis la **racine du dépôt Cityborn**.

- Première utilisation : [préparer le poste et les accès](#1-préparer-le-poste-et-les-accès).
- Poste déjà configuré : [restaurer la production](#2-restaurer-la-production).
- Exercice ou validation d'une modification : [tester sur staging](#3-tester-sur-staging).
- Commande en échec : [diagnostiquer le problème](#4-en-cas-déchec).

## Périmètre de la restauration

La commande restaure les objets applicatifs du schéma `public` : tables, données,
séquences, enums, index, contraintes, droits et politiques de sécurité RLS,
y compris l'historique Prisma `_prisma_migrations`.

Les objets restaurés appartiennent au rôle `postgres`. Leurs droits sont repris de
la sauvegarde ; les droits du schéma et ses droits par défaut restent ceux de la cible.

Les schémas Supabase Auth et Storage, les fichiers stockés, les extensions, les rôles
et les réglages du projet sont conservés. Une archive contenant des données
Auth ou Storage non vides est refusée par cette procédure.

Certaines structures nécessitent une adaptation : vues, fonctions applicatives,
partitions, droits par colonne, publications portant sur `public` ou déclencheurs
d'événements non reconnus. Le script les signale avant le remplacement. Les
dépendances externes sont protégées par `DROP ... RESTRICT` ; aucun
`DROP SCHEMA ... CASCADE` n'est exécuté.

## 1. Préparer le poste et les accès

Effectuer cette préparation sur chaque poste susceptible de servir à une restauration,
idéalement avant un incident.

### Prérequis

- Disposer du dépôt et de ses dépendances : `pnpm install --frozen-lockfile`.
- Utiliser **Node 24**, **pnpm**, **Docker démarré**, **bash** et **tar**.
- Pouvoir accéder à Backblaze, à Supabase et aux registres des images Docker.
- Prévoir de l'espace disque pour les images, une base locale de validation et
  plusieurs copies de la sauvegarde.
- Disposer des accès pour arrêter et reprendre les services, notamment le backend
  hébergé sur Railway et les éventuels workers.

Les clients PostgreSQL et AWS CLI sont exécutés dans Docker ; leur installation
sur le poste n'est pas nécessaire.

### Configurer les accès

Copier le [modèle de configuration](../apps/backend/.env.restore.example) :

```bash
cp -n apps/backend/.env.restore.example apps/backend/.env.restore
chmod 600 apps/backend/.env.restore
```

L'option `-n` conserve le fichier s'il existe déjà. Renseigner ensuite
`apps/backend/.env.restore` avec les valeurs disponibles dans le coffre de l'équipe.
Ce fichier est ignoré par Git.

| Variable | Valeur à renseigner |
| --- | --- |
| `RESTORE_B2_BUCKET` | Nom du bucket contenant les sauvegardes |
| `RESTORE_B2_ENDPOINT` | Endpoint S3 B2 : `https://s3.<region>.backblazeb2.com`, sans slash final |
| `RESTORE_B2_PREFIX` | Préfixe dans le bucket, généralement `cityborn`, sans slash final |
| `RESTORE_B2_KEY_ID` | Identifiant d'une clé B2 autorisée à lire et lister les sauvegardes |
| `RESTORE_B2_APPLICATION_KEY` | Valeur secrète de cette clé B2 |
| `RESTORE_PRODUCTION_PROJECT_REF` | Référence technique du projet Supabase de production |
| `RESTORE_PRODUCTION_DB_URL` | URL PostgreSQL complète de la base de production |
| `RESTORE_PRODUCTION_SSL_ROOT_CERT` | Chemin absolu du certificat CA Supabase sur le poste |

Pour staging, renseigner les variables équivalentes `RESTORE_STAGING_PROJECT_REF`,
`RESTORE_STAGING_DB_URL` et `RESTORE_STAGING_SSL_ROOT_CERT`. Les accès des deux
environnements peuvent coexister ; `--target` choisit la connexion utilisée.

**La cible ne choisit pas la provenance du backup.** Le bucket et le préfixe restent
ceux des variables `RESTORE_B2_*`. Vérifier qu'ils contiennent les sauvegardes de
la base à restaurer.

Mettre les valeurs sensibles entre guillemets. Les variables déjà définies dans le
terminal ont priorité sur ce fichier. Le `.env` habituel du backend n'est pas chargé.
Une valeur requise manquante est demandée au lancement ; l'URL PostgreSQL et la clé
secrète B2 sont masquées lors de leur saisie.

### Retrouver les informations nécessaires

**Backblaze**

1. Dans **B2 Cloud Storage → Buckets**, relever le nom du bucket et son **S3 Endpoint**.
   Ajouter `https://` devant l'endpoint dans la configuration.
2. Dans **App Keys**, utiliser une clé avec les droits **Read Only**, incluant la
   lecture et la liste des fichiers du bucket/préfixe concerné.
3. Reporter le `keyID` et l'`applicationKey` dans les variables correspondantes.
   L'`applicationKey` n'est affichée qu'à sa création : si aucune clé de lecture
   n'est disponible dans le coffre de l'équipe, en créer une depuis le compte
   Backblaze autorisé et l'y enregistrer. La clé d'envoi des backups peut rester distincte.

**Supabase**

1. Depuis le projet cible, récupérer l'URL PostgreSQL du **Session Pooler**, sur le
   **port 5432**. Le pooler transactionnel sur le port 6543 est refusé.
2. Relever la référence du projet dans l'identifiant `postgres.<project_ref>` de
   l'URL et renseigner la même valeur dans `PROJECT_REF`.
3. Télécharger le certificat public dans **Database Settings → SSL Configuration →
   Download Certificate**. Le conserver sur le poste et renseigner son chemin absolu,
   par exemple `/chemin/absolu/certificats/supabase-ca.crt`.

La commande exige la base `postgres`, le rôle effectif `postgres`, PostgreSQL 16 ou
17 et une connexion TLS avec vérification du certificat et du nom du serveur
(`verify-full`). L'accès au tableau de bord n'est pas nécessaire à l'exécution si
l'URL, la référence et le certificat ont déjà été fournis.

Dans le mot de passe de l'URL, encoder les caractères réservés : `@` en `%40`,
`:` en `%3A`, `/` en `%2F`. Le `@` séparant les identifiants de l'hôte reste un
séparateur ; ne pas ajouter de barre oblique inverse devant lui.

## 2. Restaurer la production

### Étape 1 — Choisir et vérifier la sauvegarde

Identifier une sauvegarde de production antérieure à l'incident et une version du
code compatible avec son schéma. Puis lancer :

```bash
pnpm db:restore --target production --check-only
```

Le terminal affiche un menu numéroté de toutes les sauvegardes disponibles dans B2,
des plus récentes aux plus anciennes, toutes catégories confondues (`daily`,
`weekly`, `pre-migration`). Saisir le numéro choisi, ou `q` pour annuler.
Les dates contenues dans les noms de fichiers sont en UTC.

Le script télécharge l'archive et son fichier SHA-256, vérifie leur intégrité,
restaure le backup dans un PostgreSQL local isolé, puis contrôle la connexion et
les objets pris en charge sur la cible. **Avec `--check-only`, aucune donnée distante
n'est modifiée.**

Attendre une fin sans erreur et le message commençant par :

```text
Contrôle uniquement : connexion et objets pris en charge vérifiés, aucune écriture distante.
```

Conserver le chemin complet affiché après `Backup :`, le SHA-256 et l'identifiant
de session. Le chemin du fichier est appelé « clé B2 » dans le script ; il est
distinct des identifiants d'accès Backblaze.

Dans le même terminal, remplacer le texte entre guillemets ci-dessous par ce chemin :

```bash
RESTORE_BACKUP_KEY='COLLER_ICI_LE_CHEMIN_COMPLET_AFFICHE_APRES_BACKUP'
```

Cette valeur fixe le backup à utiliser pour le remplacement, même si une nouvelle
sauvegarde est publiée entre les commandes. Les dépendances externes seront
également contrôlées lors de la transaction de restauration.

### Étape 2 — Mettre les services en maintenance

1. Arrêter les écritures du backend et des éventuels workers ou autres clients de
   la base. Une fermeture du frontend seule ne suffit pas.
2. Suspendre les déploiements et migrations automatiques pendant l'intervention.
3. Préparer la version de l'application à utiliser après restauration.

Ces actions sont effectuées par la personne responsable de l'intervention.
Le script demande une confirmation de maintenance, mais n'arrête pas les services.

### Étape 3 — Lancer le remplacement

Utiliser le chemin conservé à l'étape 1 :

```bash
pnpm db:restore "$RESTORE_BACKUP_KEY" --target production
```

Le script répète les vérifications du backup. Contrôler la ligne `Cible vérifiée` :
elle doit indiquer `production` et la référence du projet attendu.

Deux confirmations sont demandées. **Recopier exactement les phrases affichées par
le terminal** ; les valeurs entre chevrons ci-dessous décrivent leur format.

**Première confirmation — services en maintenance :**

```text
MAINTENANCE production <project_ref>
```

Le script sauvegarde l'état actuel de `public` dans
`.restore-safety/<session>/before.dump`, vérifie que cette archive est lisible et
enregistre son SHA-256, une version SQL et l'identité de la cible. Un échec bloque
le remplacement. Cette copie de secours reste sur le poste de l'intervention ;
elle n'est pas envoyée automatiquement dans B2.

**Seconde confirmation — remplacement par le backup sélectionné :**

```text
RESTORE production <project_ref> <nom_du_backup.tar.gz>
```

Le remplacement et les contrôles des relations, de l'historique Prisma et des
nombres de lignes sont effectués dans une seule transaction. Une erreur SQL annule
les modifications de cette transaction.

### Étape 4 — Vérifier le résultat et reprendre le service

Attendre le message :

```text
Restauration distante validée techniquement.
```

En cas d'erreur ou de coupure réseau, suivre la section [En cas d'échec](#4-en-cas-déchec)
avant toute nouvelle tentative.

**Avant de redémarrer le backend, vérifier la version du code :** les commandes
`start` et `start:prod` exécutent automatiquement les migrations Prisma. Une version
incompatible pourrait réappliquer la migration à l'origine de l'incident.

Effectuer les vérifications fonctionnelles avec cette version compatible et un
accès de test contrôlé :

- Confirmer que le backend utilisé est relié au projet Supabase restauré.
- Se connecter avec un compte présent dans la sauvegarde.
- Vérifier le profil et les données attendues.
- Effectuer une partie de test, puis vérifier sa présence dans l'historique après
  actualisation de la page.

Le endpoint de santé actuel ne consulte pas la base ; utiliser les parcours
applicatifs pour valider le fonctionnement. Après validation, reprendre le trafic
et les workers, puis les déploiements et migrations compatibles.

Consigner dans le compte rendu d'intervention la date, la cible, la version du code,
le chemin du backup, le SHA-256, la session et le résultat des vérifications,
sans y inclure les secrets.

### Étape 5 — Nettoyer les fichiers temporaires

Reprendre l'identifiant de session affiché par la commande :

```bash
pnpm db:restore:cleanup restore-XXXXXX
```

Remplacer `restore-XXXXXX` par cet identifiant, puis saisir la confirmation affichée :

```text
DELETE restore-XXXXXX
```

Le nettoyage supprime le conteneur PostgreSQL local, son volume et les fichiers de
cette session. La base distante et les fichiers de `.restore-safety/` sont conservés.
Chaque commande crée sa propre session : nettoyer séparément celles du précontrôle,
de la restauration et des diagnostics lorsqu'elles ne sont plus utiles.

Conserver la sauvegarde de secours jusqu'à résolution de l'incident. Les archives
et logs locaux sont confidentiels ; ils ne doivent pas être joints à une PR.

## 3. Tester sur staging

Suivre les mêmes étapes avec les variables `RESTORE_STAGING_*` et la cible `staging`.
L'exercice remplace les données applicatives de cette base : prévoir sa maintenance
et utiliser une version de l'application compatible avec le backup choisi.

Commencer par le choix et le contrôle :

```bash
pnpm db:restore --target staging --check-only
```

Conserver le chemin du backup dans `RESTORE_BACKUP_KEY`, comme à l'étape 1, puis
appliquer les étapes de maintenance et de restauration :

```bash
pnpm db:restore "$RESTORE_BACKUP_KEY" --target staging
```

Les confirmations affichent alors `staging` et la référence de ce projet.
Effectuer les contrôles applicatifs, consigner leur résultat et nettoyer les sessions
selon la même procédure. Cet exercice permet de vérifier les accès et la prise en
main sur le poste d'un nouvel intervenant.

## 4. En cas d'échec

La commande affiche le chemin d'un log local dans `.restore-sessions/<session>/`.
Le consulter pour identifier l'erreur exacte, en conservant la confidentialité de
son contenu.

| Situation | Action |
| --- | --- |
| B2 `AccessDenied` ou `NoSuchKey` | Vérifier les droits de lecture/liste, le bucket, le préfixe et la présence du fichier avec `pnpm db:restore:list` |
| Bucket ou endpoint invalide | Vérifier le nom du bucket et le format `https://s3.<region>.backblazeb2.com`, sans slash final |
| Archive incomplète ou checksum incorrect | Contrôler le workflow de sauvegarde et choisir une archive complète et fiable |
| Connexion ou certificat refusé | Vérifier le projet, le port 5432, le mot de passe encodé et le chemin du certificat correspondant à la cible ; conserver la vérification TLS |
| Objet ou déclencheur non pris en charge | Utiliser le diagnostic ci-dessous ; faire adapter la procédure aux objets identifiés avant de relancer |
| Migration inachevée ou références incohérentes | Choisir un backup cohérent ou résoudre l'incohérence avant de reprendre la restauration |
| Sauvegarde de secours impossible | Corriger l'erreur de connexion, de permissions ou d'espace disque indiquée dans le log ; le remplacement n'a pas commencé |
| Erreur SQL pendant le remplacement | Les modifications de la transaction sont annulées ; conserver la maintenance, analyser le log et la sauvegarde de secours |
| Coupure réseau ou interruption pendant le remplacement | Maintenir la maintenance et vérifier l'état de la cible avant de relancer : la transaction peut avoir été validée sans que le terminal ait reçu la réponse |

### Diagnostiquer les publications et déclencheurs

```bash
pnpm db:restore:diagnose --target production
```

Utiliser `--target staging` pour un incident sur staging. La commande consulte
uniquement les métadonnées PostgreSQL en lecture seule : publications, tables
concernées, déclencheurs, fonctions et propriétaires. Elle ne télécharge aucun backup.
Le résultat est affiché et conservé dans `diagnostic.json` dans le dossier de session.

Les déclencheurs système Supabase reconnus par le script sont conservés, notamment
`issue_pg_graphql_access` sur `CREATE FUNCTION` et les watchers PostgREST. Une
publication `supabase_realtime` vide est également acceptée. Toute adaptation doit
préserver les contrôles sur les autres objets ; voir le
[précontrôle SQL](../scripts/database-backup/restore-public.sql).

### Utiliser la sauvegarde de secours

`before.dump` représente l'état de `public` juste avant le remplacement. Sa remise
en place n'est pas automatisée par `db:restore`, qui attend une archive B2 au format
Cityborn. Préparer une procédure adaptée à l'état constaté avec la personne
responsable de la base. Ne pas exécuter directement `before.sql` ou
`pg_restore --clean` sur la base existante.

## 5. Autres commandes utiles

| Besoin | Commande |
| --- | --- |
| Afficher l'aide | `pnpm db:restore --help` |
| Lister toutes les sauvegardes | `pnpm db:restore:list` |
| Lister les sauvegardes hebdomadaires | `pnpm db:restore:list --kind weekly` |
| Choisir et restaurer uniquement en local | `pnpm db:restore` |
| Contrôler le dernier backup quotidien sur staging | `pnpm db:restore latest --target staging --check-only` |
| Limiter le menu aux backups avant migration | `pnpm db:restore --kind pre-migration --target staging --check-only` |

Sans `--target`, la restauration reste locale. Le menu propose tous les backups
disponibles, sans nombre maximal prédéfini. Un backup sans fichier SHA-256 ne peut
pas être sélectionné, et une saisie vide ne choisit pas de backup.

Un nom de fichier seul et `latest` utilisent la catégorie `daily` par défaut ;
`--kind` permet de choisir une autre catégorie. Un chemin B2 complet désigne sa
propre catégorie. Si le dernier backup est incomplet, `latest` s'arrête : il ne
sélectionne pas automatiquement un fichier plus ancien.

## 6. Maintenance des sauvegardes et des scripts

### Production des backups

Le workflow [Database backup](../.github/workflows/database-backup.yml) appelle
[create.sh](../scripts/database-backup/create.sh) pour exporter les rôles, le schéma
et les données SQL. Il envoie une archive `.tar.gz` et son fichier `.sha256` dans B2.

- Les exécutions sont programmées à **03 h 53 et 15 h 53, Europe/Paris**. GitHub peut
  retarder leur démarrage.
- Le second lancement programmé du dimanche produit aussi une copie `weekly`.
- Pour déclencher un backup : **GitHub → Actions → Database backup → Run workflow**,
  sélectionner `main`, puis `daily` ou `pre-migration`. Vérifier le succès du workflow.

La source est définie par `SUPABASE_PROD_DB_URL` dans l'environnement GitHub
`database-backup-production`. La destination utilise les variables `B2_PROD_BUCKET_NAME`,
`B2_PROD_ENDPOINT`, `B2_PROD_REGION`, `B2_PROD_PREFIX` et les secrets
`B2_PROD_UPLOAD_KEY_ID`, `B2_PROD_UPLOAD_APPLICATION_KEY`.
Lors de la configuration ou d'un changement de projet, vérifier que la source
correspond bien à la production. Ces accès d'envoi ne sont pas récupérés automatiquement
par les commandes de restauration.

La rétention se configure dans **Backblaze → Bucket → Lifecycle Settings**.
La politique prévue masque `daily` après 7 jours et `weekly` après 28 jours,
puis supprime les fichiers un jour plus tard. Vérifier les règles effectives dans B2 :
elles ne sont pas gérées par le dépôt. Définir séparément la rétention des sauvegardes
`pre-migration` selon les besoins de l'équipe.

### Vérifier une modification des scripts

```bash
pnpm db:restore:test
pnpm db:restore:test:int
```

La première commande vérifie les types et exécute les tests unitaires. La seconde
exécute aussi les tests de restauration dans un Docker jetable, sans réseau ni
connexion aux bases staging et production.

Les tests couvrent notamment le remplacement transactionnel, l'annulation après
erreur SQL, les dépendances externes, les droits/RLS, les migrations, les séquences,
les déclencheurs Supabase, la conservation d'Auth et PostGIS et un import supérieur
à 64 Mio. Après une modification du parcours de restauration, effectuer également
un essai sur staging et consigner le résultat dans la PR.

### Références

- [Connexion PostgreSQL et certificat Supabase](https://supabase.com/docs/guides/database/psql)
- [Export et restauration Supabase](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Archives PostgreSQL et pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html)
- [Clés d'application Backblaze](https://www.backblaze.com/docs/en/cloud-storage-application-keys)

La procédure de remplacement de `public` décrite ici est propre aux scripts Cityborn.
La procédure Supabase citée en référence décrit notamment la restauration dans un
nouveau projet.
