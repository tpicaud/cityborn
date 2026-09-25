# Réinitialisation du mot de passe

Le web et le mobile demandent le lien via `POST /auth/request-password-reset`. La finalisation se fait sur la page publique web `/reset-password`. Le jeton arrive dans le fragment `#token=…` : il ne figure ni dans l’URL HTTP de la page, ni dans le Referer. La page le transmet uniquement dans le corps des appels de validation et de réinitialisation.

La réponse de demande est identique pour une adresse inconnue, un compte social sans mot de passe et un compte éligible. La recherche et l’envoi sont asynchrones, après la réservation Redis commune à toutes les adresses. Les échecs produisent les événements `send_password_reset_email` ou `send_password_changed_email`, sans reprendre le contenu du fournisseur susceptible de contenir le jeton. Ces envois utilisent le même service d’e-mail que la vérification d’adresse ; ils ne disposent pas d’une file durable.

La réservation par adresse dure 180 secondes et ne prolonge pas son délai en cas de nouvelle demande refusée. Le compteur IP autorise cinq demandes dans une fenêtre de 900 secondes. Les adresses sont hachées dans les clés Redis. Le frontend relaie le dernier saut de confiance de `X-Forwarded-For` pour les appels serveur. En déploiement, le proxy d’entrée doit remplacer ou compléter cet en-tête et `REST_BACKEND_URL` doit conserver ce saut de confiance jusqu’au backend, configuré avec `trust proxy = 1`. Une chaîne de proxies différente doit adapter sa configuration avant déploiement, faute de quoi les utilisateurs web pourraient partager le quota de l’IP du serveur.

## Données et sessions

La migration `20260925091548_password_reset` ajoute `User.sessionVersion` et `PasswordResetToken`. Un compte possède au plus un jeton de réinitialisation, stocké en SHA-256 et valable 30 minutes. Le jeton de vérification d’adresse est indépendant.

La suppression conditionnelle du jeton, le changement du hash bcrypt et l’incrément de la version des sessions partagent une transaction. Une validation concurrente perdante ne peut ni modifier le mot de passe, ni réutiliser le lien. L’état de vérification d’adresse est conservé.

Les JWT d’accès et de renouvellement transportent la version observée lors de l’authentification. Les JWT antérieurs à la migration correspondent à la version zéro, ce qui conserve les sessions existantes jusqu’à une réinitialisation. Les guards HTTP, le handshake et les messages WebSocket vérifient la version persistée. La réinitialisation déconnecte aussi les sockets des anciennes versions, y compris via l’adaptateur Redis. Une socket entre dans la room utilisateur avant sa dernière validation pour couvrir une réinitialisation concurrente avec sa connexion. Les messages attendent la fin de l’authentification initiale.

## Recette manuelle web et mobile

Utiliser une boîte e-mail de test et un compte avec mot de passe. Pour le mobile, rendre le frontend configuré par `FRONTEND_URL` accessible depuis le téléphone, et garder une session authentifiée ouverte dans une autre fenêtre ou sur un autre appareil.

1. Sur chaque formulaire de connexion, ouvrir « Mot de passe oublié ? ». Vérifier le champ e-mail, les erreurs de saisie, le chargement, la désactivation pendant l’envoi et la fermeture de la modale, y compris avec le clavier mobile ouvert.
2. Demander un lien pour un compte avec mot de passe, puis une adresse inconnue et un compte exclusivement Google/Apple. Vérifier le même message public. Seul le compte avec mot de passe reçoit le lien.
3. Ouvrir l’e-mail sur ordinateur et téléphone. Vérifier la mise en page et les libellés, puis recharger la page : le lien reste utilisable tant qu’aucun mot de passe n’a été validé.
4. Vérifier les erreurs pour un mot de passe trop court, trop long, sans majuscule ou chiffre, et pour deux champs différents. Couper le réseau puis réessayer après rétablissement.
5. Valider : vérifier le message de succès, l’e-mail de confirmation sans mot de passe, le retour à la connexion web et la mention de reconnexion mobile. L’ancien mot de passe et les anciennes sessions doivent être refusés ; le nouveau doit fonctionner. Un compte non vérifié reste non vérifié.
6. Réouvrir le lien consommé, un lien expiré ou `/reset-password` sans fragment. Vérifier le message explicite et la possibilité de redemander un lien.
7. Demander deux liens à moins de trois minutes d’intervalle : un seul e-mail est envoyé et le premier lien reste valide. Après trois minutes, demander un nouveau lien : le précédent devient invalide. Une sixième demande sur la même IP en quinze minutes renvoie la limite, quelle que soit l’adresse.

Les tests automatiques couvrent les règles métier, les limites Redis, la concurrence et le rollback PostgreSQL, les validations serveur, ainsi que le parcours HTTP et la déconnexion d’une socket réelle. Les interfaces et la livraison réelle via le fournisseur d’e-mail nécessitent cette recette manuelle.
