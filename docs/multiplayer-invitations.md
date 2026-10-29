# Invitations à une partie multijoueur

Depuis le lobby, le bouton « Inviter » partage un message contenant le code de la partie et un lien web. Sur le web, si le navigateur ne propose pas le partage, seul le lien est copié dans le presse-papiers. Le code peut aussi être copié séparément. Les liens ouvrent le web ; l’ouverture directe dans l’application native reste à traiter dans l’issue #399.

L’aperçu Open Graph est générique : il présente Cityborn, sans données propres à la partie.

## Configuration et environnements

Sur le web, le lien utilise l’origine courante du navigateur : le développement et les previews partagent ainsi le frontend qui a créé la partie. `NEXT_PUBLIC_WEB_APP_URL` sert à construire l’URL absolue de l’image de l’aperçu Open Graph statique. La renseigner dans chaque environnement Vercel du frontend, production, staging et previews. Si l’URL d’une preview n’est pas connue avant le build, une origine publique stable du même environnement convient pour cette image.

Sur mobile, `EXPO_PUBLIC_WEB_APP_URL` désigne le frontend qui utilise le même backend que l’application : `https://cityborn.app` en production et `https://staging.cityborn.app` en staging. La renseigner dans les variables des environnements GitHub utilisés par les workflows Android et iOS. En développement ou preview, choisir une URL accessible au destinataire et cohérente avec le backend du mobile ; staging ne convient que si l’application utilise aussi le backend staging. Cette correspondance devra également être conservée pour les futurs liens natifs.

En local, `NEXT_PUBLIC_WEB_APP_URL=http://localhost:3000` convient pour une ouverture sur la machine de développement. Pour inviter depuis le mobile, renseigner `EXPO_PUBLIC_WEB_APP_URL=http://<local_ip>:3000` et lancer aussi le frontend avec `pnpm frontend:dev` si seul `pnpm dev:mobile` tourne.

Pour ouvrir le lien sur un autre appareil, utiliser une adresse réseau accessible : son `localhost` ne désigne pas la machine de développement. Autoriser l’origine `http://<local_ip>:3000` dans `CORS_ORIGIN` du backend et configurer les URL REST et WebSocket du frontend avec le même hôte accessible, par exemple `http://<local_ip>:4000` et `ws://<local_ip>:4000`. Le partage et le presse-papiers du navigateur peuvent être bloqués sur une IP en HTTP, car ils requièrent un contexte sécurisé. Pour vérifier l’aperçu dans une messagerie, le frontend et l’image doivent être accessibles publiquement ; une adresse locale ne suffit pas.

## Reconnexion

Un compte déjà participant retrouve sa place à la réouverture du lien, y compris si la partie a commencé. Un nouvel arrivant ne peut plus rejoindre une partie commencée.

Un invité peut se reconnecter après une coupure réseau tant que l’écran reste ouvert. Son jeton de reconnexion reste uniquement en mémoire : il n’est pas conservé après fermeture ou rechargement.

## Recette manuelle web et mobile

Utiliser deux participants et une partie multijoueur en attente. Pour une recette locale sur la même machine, ouvrir le lien dans une autre fenêtre du navigateur. Pour un téléphone ou un autre ordinateur, appliquer la configuration réseau ci-dessus et garder le frontend accessible.

1. Depuis le lobby web puis mobile, utiliser « Inviter ». Vérifier le message, le code et le lien ; annuler le partage puis réessayer. Sur un navigateur sans partage, vérifier la copie du lien, puis tester la copie séparée du code.
2. Ouvrir le lien côté destinataire et rejoindre la bonne partie. Vérifier que le web utilise l’origine courante, y compris en preview, et que le mobile partage le frontend associé à son backend.
3. Avec un compte déjà participant, fermer puis rouvrir le lien : sa place est restaurée. Refaire après le démarrage de la partie et vérifier qu’un nouvel arrivant est refusé.
4. Avec un invité, couper puis rétablir le réseau sans fermer l’écran : sa place est conservée. Recharger ou fermer l’écran, puis rouvrir le lien : sa place n’est plus restaurée par un jeton mémorisé.
5. Partager une URL publique dans une messagerie et vérifier l’aperçu générique Cityborn, son image et l’ouverture du lien dans le web sur ordinateur et téléphone.
