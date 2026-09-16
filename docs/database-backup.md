# Restaurer la base Cityborn

Cette procédure s'adresse à l'opérateur chargé d'un retour à une sauvegarde. Les archives sont produites par le workflow GitHub `database-backup.yml` et conservées dans Backblaze B2.

## Périmètre

Le script remplace les tables, séquences et enums applicatifs de `public`, leur schéma, leurs données et leurs droits issus du backup, y compris `_prisma_migrations`. Il conserve le schéma `public` et ses droits, les objets d'extension et les autres schémas Supabase. Les droits par défaut de la cible restent inchangés ; ils ne doivent pas élargir les droits des tables restaurées.

Il ne restaure pas Supabase Auth, Storage, les fichiers stockés, la configuration du projet ni les rôles globaux. Une archive contenant des données Auth/Storage non vides est refusée. Les rôles utilisés dans les droits doivent déjà exister sur la cible ; les objets applicatifs doivent appartenir à `postgres`. Les vues, fonctions, partitions et types complexes applicatifs de `public` nécessitent une adaptation du script. Une dépendance extérieure empêchant la suppression d'une table provoque l'annulation de la transaction.

**Les données postérieures au backup seront perdues.** Préparer une version du backend compatible avec le schéma sauvegardé : son démarrage en production exécute `prisma migrate deploy`. Une version inadaptée pourrait immédiatement réappliquer la migration à annuler.

## 1. Préparer le poste et les accès

- Disposer du dépôt, de Node.js 24, de la version de pnpm indiquée dans `package.json`, de `tar` et de Docker Desktop démarré.
- Disposer d'une clé d'application Backblaze autorisant la lecture des fichiers et le listing des buckets (`readFiles`, `listBuckets`), limitée au bucket `cityborn-backups` et au préfixe `cityborn/`. Un accès au site web seul ne suffit pas pour les commandes de téléchargement.
- Pour une restauration distante : obtenir l'URL PostgreSQL, la référence du projet et le certificat CA Supabase de l'environnement concerné auprès du responsable des accès.

Les images `postgis/postgis:16-3.4` (validation locale) et `public.ecr.aws/supabase/postgres:17.6.1.158` (client distant) sont téléchargées par Docker au premier usage. Ce parcours couvre les sauvegardes Cityborn compatibles PostgreSQL 16 et une cible PostgreSQL 16 ou 17.

### macOS

Ouvrir Terminal et installer l'outil officiel Backblaze avec [Homebrew](https://www.backblaze.com/docs/cloud-storage-command-line-tools) :

```bash
brew install b2-tools
```

Utiliser ce terminal pour toute la suite de la procédure.

### Windows — Ubuntu sous WSL2

Le parcours Windows utilise **WSL2**, qui fournit un terminal Linux Ubuntu sur le PC, et Docker Desktop en mode conteneurs Linux.

1. Si Ubuntu n'est pas installé, ouvrir **PowerShell en administrateur**, exécuter la commande suivante, redémarrer si demandé, puis ouvrir Ubuntu et terminer la création de son utilisateur :

   ```powershell
   wsl --install -d Ubuntu
   ```

2. Vérifier avec `wsl --list --verbose` dans PowerShell qu'Ubuntu utilise la version **2**. Au besoin, exécuter `wsl --set-version Ubuntu 2`. Voir le [guide Microsoft WSL](https://learn.microsoft.com/en-us/windows/wsl/install).
3. Dans Docker Desktop, activer **Use WSL 2 based engine**, puis **Settings → Resources → WSL Integration → Ubuntu → Apply**. Utiliser les conteneurs Linux. Voir le [guide Docker Desktop](https://docs.docker.com/desktop/features/wsl/).
4. Dans le **terminal Ubuntu**, disposer de Node.js 24 et de pnpm installés côté Linux, puis cloner le dépôt dans le dossier personnel Linux, par exemple `~/cityborn`. Installer l'outil Backblaze dans ce même terminal :

   ```bash
   sudo apt update
   sudo apt install pipx
   pipx install b2
   pipx ensurepath
   ```

Fermer puis rouvrir le terminal Ubuntu pour prendre en compte le chemin de l'outil. Toutes les commandes suivantes sont à exécuter **dans Ubuntu**, y compris `b2` et `pnpm`. La commande `pipx` installe l'outil Python dans un environnement isolé ([documentation Ubuntu](https://manpages.ubuntu.com/manpages/noble/man1/pipx.1.html)).

### Vérifier les outils et configurer la cible

Depuis le terminal choisi, se placer à la racine du dépôt et vérifier les outils :

```bash
node --version
pnpm --version
b2 --version
tar --version
docker info
```

Attendre Node.js **24.x** et un serveur Docker joignable. Pour configurer la production, copier le modèle **si le fichier local n'existe pas déjà** :

```bash
cp -n apps/backend/.env.restore.example apps/backend/.env.restore
```

Renseigner les trois variables dans `apps/backend/.env.restore` :

```dotenv
RESTORE_PRODUCTION_PROJECT_REF=reference_du_projet_production
RESTORE_PRODUCTION_DB_URL="postgresql://postgres.reference_du_projet_production:MOT_DE_PASSE_ENCODE@aws-REGION.pooler.supabase.com:5432/postgres"
RESTORE_PRODUCTION_SSL_ROOT_CERT=/chemin/absolu/prod-ca-2021.crt
```

Copier l'URL réelle depuis Supabase : connexion directe ou pooler **Session, port 5432**. Encoder les caractères spéciaux du mot de passe dans l'URL et ne pas ajouter de paramètres SSL : le script impose `verify-full` et le certificat indiqué. Télécharger le certificat depuis les paramètres SSL de la base.

Le chemin du certificat doit être absolu et accessible depuis le terminal utilisé : `/Users/nom/certificats/prod-ca-2021.crt` sur macOS ou `/home/nom/certificats/prod-ca-2021.crt` sous Ubuntu. Depuis WSL, un fichier Windows situé dans `C:\Users\nom\Downloads` est accessible sous `/mnt/c/Users/nom/Downloads` ; on peut le copier dans le dossier personnel Linux. Renseigner le chemin complet dans `.env.restore`, sans `~` ni `$HOME`.

Le fichier `.env.restore` est ignoré par Git. Les anciens paramètres `RESTORE_B2_*` ne sont plus utilisés par le script ; l'outil `b2` possède sa propre authentification. Pour un contrôle à blanc uniquement, les accès Supabase ne sont pas nécessaires.

## 2. Télécharger et contrôler la sauvegarde

### Choisir l'archive

Dans **Browse Files → cityborn-backups**, choisir la date voulue sous `cityborn/daily/`, `cityborn/weekly/` ou `cityborn/pre-migration/`. Pour prendre le dernier backup, comparer les horodatages des noms d'archives dans ces catégories ; le suffixe `Z` indique une heure UTC. Relever le chemin complet de l'archive dans le bucket, par exemple `cityborn/daily/2026/09/16/cityborn-postgres-20260916T065536Z.tar.gz`, et vérifier la présence du fichier `.tar.gz.sha256` associé.

**Télécharger avec l'outil `b2`.** Lors du test Cityborn, le bouton web refusait les fichiers chiffrés SSE-B2, même un par un, avec le message « les fichiers chiffrés ne sont pas téléchargés via l'interface utilisateur sur le web ». L'outil accède à ces fichiers avec la clé d'application autorisée ; Backblaze gère leur déchiffrement. Le bucket reste privé et chiffré ([documentation Backblaze](https://www.backblaze.com/docs/cloud-storage-server-side-encryption)).

### S'authentifier et télécharger les deux fichiers

Les commandes sont identiques dans Terminal sur macOS et dans Ubuntu sous Windows. Depuis la racine du dépôt :

```bash
b2 account authorize
```

Saisir successivement **Application Key ID** et **Application Key**, uniquement leurs valeurs. Utiliser la clé de lecture obtenue auprès du responsable des accès. Les anciennes valeurs `RESTORE_B2_KEY_ID` et `RESTORE_B2_APPLICATION_KEY`, si elles sont encore présentes et valides dans le fichier local, peuvent servir à cette saisie. La sortie de l'outil peut afficher la clé et le jeton : ne pas la partager ni la joindre à une PR ([authentification B2](https://b2-command-line-tool.readthedocs.io/en/stable/subcommands/account_authorize.html)).

Dans le bloc suivant, **remplacer la valeur de `backup_key` par le chemin exact retenu**, puis exécuter les commandes une par une. Le dossier `backups/` est ignoré par Git :

```bash
backup_key='cityborn/daily/YYYY/MM/DD/cityborn-postgres-YYYYMMDDTHHMMSSZ.tar.gz'
archive="./backups/$(basename "$backup_key")"
mkdir -p backups
b2 file download "b2://cityborn-backups/$backup_key" "$archive"
b2 file download "b2://cityborn-backups/$backup_key.sha256" "$archive.sha256"
```

Attendre la réussite de **chaque** téléchargement avant de continuer. Conserver les noms et les deux fichiers dans le même dossier, sans décompresser l'archive. Utiliser uniquement les sauvegardes issues du workflow Cityborn : une archive SQL contient du code exécuté lors de sa restauration. Voir la [commande de téléchargement B2](https://b2-command-line-tool.readthedocs.io/en/stable/subcommands/file_download.html).

### Contrôler localement

Dans le même terminal, lancer le contrôle à blanc, sans cible :

```bash
pnpm db:restore "$archive"
```

La variable `archive` sera réutilisée pour la restauration distante. Si le terminal a été fermé, la redéfinir avec le chemin du fichier téléchargé, par exemple `archive='./backups/cityborn-postgres-20260916T065536Z.tar.gz'`, depuis la racine du dépôt.

Le script contrôle le SHA-256 et le contenu de l'archive, crée un PostgreSQL jetable isolé, restaure les fichiers, vérifie les migrations et les clés étrangères, puis affiche le nombre de lignes de chaque table. La réussite se termine par **« Contrôle à blanc réussi. Aucune connexion distante. »**. Le conteneur et les fichiers temporaires sont supprimés.

Comparer la date et les comptages au point de restauration attendu. Un contrôle réussi confirme la restauration locale ; il ne valide pas encore les droits, extensions et dépendances spécifiques de la cible distante.

## 3. Mettre la production en maintenance

Le responsable de l'environnement arrête les accès en écriture : backend, workers, tâches planifiées, migrations et déploiements automatiques. Aucun de ces services ne doit écrire entre la sauvegarde de sécurité et la fin des vérifications. Préparer le code compatible avant de continuer.

## 4. Remplacer la base

```bash
pnpm db:restore "$archive" --target production
```

La commande refait la validation locale, vérifie que l'URL correspond à la référence de projet configurée, puis affiche le projet, l'hôte, la base et le rôle réellement connectés. Elle sauvegarde l'état courant de `public` dans `.restore-safety/<date-identifiant>/before.dump`, accompagné d'un checksum et d'un fichier d'identité.

Vérifier la cible et la date du backup, puis saisir **exactement la phrase affichée** pour autoriser le remplacement. Toute autre réponse annule l'opération. La sauvegarde de sécurité est conservée, même en cas d'annulation.

Les suppressions, la restauration, les droits et les vérifications de comptage s'exécutent dans une seule transaction. Une erreur SQL avant le commit annule ces modifications. Attendre **« Restauration validée et transaction commitée »** avant de passer aux vérifications applicatives.

En cas d'erreur, consulter le chemin local `error.log` affiché. Il peut contenir des informations confidentielles : ne pas le publier. Si la connexion est perdue au moment du commit, faire vérifier l'état effectif de la base avant de relancer. Garder les services arrêtés et conserver `before.dump` ; ce fichier est un dump PostgreSQL de secours, pas une archive acceptée par `db:restore`. Son utilisation exige une intervention du responsable de la base, après analyse de l'incident.

## 5. Vérifier et reprendre

Redémarrer la version compatible du backend pour les vérifications, en gardant l'accès des utilisateurs et les workers suspendus. Vérifier la connexion avec un compte existant, le chargement des catégories et lieux, puis le déroulement et l'enregistrement d'une partie de test. Contrôler les logs du backend.

Si les vérifications réussissent, rouvrir les accès et reprendre les workers. Consigner la date, la cible, le nom et le SHA-256 du backup, le résultat des contrôles et l'emplacement de la sauvegarde de sécurité. Conserver cette dernière selon la politique de rétention de l'équipe ; le script ne la supprime jamais.

## Exercice sur staging

Renseigner `RESTORE_STAGING_PROJECT_REF`, `RESTORE_STAGING_DB_URL` et `RESTORE_STAGING_SSL_ROOT_CERT` dans le même fichier `.env.restore`, avec les accès propres au projet staging. Suivre les mêmes étapes de téléchargement, de contrôle local et d'arrêt des écritures, puis lancer :

```bash
pnpm db:restore "$archive" --target staging
```

Vérifier que l'identité et la phrase de confirmation affichent `staging` et la référence du projet attendu. Cette commande remplace les données applicatives de staging et conserve sa sauvegarde de sécurité. Effectuer les vérifications applicatives avant de reprendre les écritures.

## Tests du script

```bash
pnpm db:test:start
pnpm db:restore:test
```

La suite `apps/backend/test/integration/database-restore.integration.spec.ts` utilise Jest et le harnais d'intégration du backend, dont PostgreSQL et Redis doivent être démarrés avec `db:test:start`. `db:restore:test` sélectionne cette suite ; `pnpm test:int` exécute l'ensemble des tests d'intégration.

Les opérations destructives utilisent un PostgreSQL Docker jetable supplémentaire, sans port exposé, distinct de la base partagée du harnais. La suite couvre le remplacement, la conservation des objets d'extension et des droits, le rollback sur erreur SQL ou de comptage, le refus d'une dépendance externe, le rôle sans privilèges superutilisateur, le contrôle local d'une archive et le rejet d'un checksum incorrect. Le conteneur supplémentaire est supprimé après les tests ; `pnpm db:test:stop` arrête les services du harnais quand ils ne sont plus nécessaires.

Avant de livrer une évolution de ce script, suivre l'étape 2 avec une véritable sauvegarde de production et consigner son nom, son SHA-256 et les comptages obtenus. Un ancien test de restauration effectué avec un autre script ne valide pas cette version.

### Validation manuelle du 16 septembre 2026

- Poste : macOS ; cible : Supabase staging, PostgreSQL 17.4.
- Archive : `cityborn/daily/2026/09/16/cityborn-postgres-20260916T065536Z.tar.gz`.
- SHA-256 : `327b911cce16c8abdb1d160b776cde22c4e041c0b94cf75a3a43cfcd01907ac8`.
- Téléchargement par `b2`, contrôle à blanc, sauvegarde de sécurité et remplacement distant : réussis. Comptages de référence : 83 utilisateurs, 590 parties, 33 migrations.
- Tests fonctionnels de l'application staging : réussite confirmée par l'opérateur après restauration.
- Parcours Windows/WSL2 documenté, à valider sur un poste Windows avant de le considérer comme testé.

Références : [pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html), [vérification TLS PostgreSQL](https://www.postgresql.org/docs/17/libpq-ssl.html).
