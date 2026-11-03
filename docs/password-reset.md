# Réinitialisation du mot de passe

Le web et le mobile demandent un lien via `POST /auth/request-password-reset` ; le mot de passe se change sur la page web `/reset-password#token=…`. Le jeton reste dans le fragment pour n’apparaître ni dans les logs HTTP ni dans le Referer.

Valider un nouveau mot de passe vérifie un compte non vérifié et incrémente `User.authVersion` : toutes les sessions antérieures, HTTP comme WebSocket, sont révoquées.

## Exploitation

- **Quotas** : un lien par adresse toutes les 3 minutes, 5 demandes par IP sur 15 minutes.
- **IP client** : le backend lit `X-Forwarded-For` avec `trust proxy = 1`. Le proxy d’entrée doit y placer l’adresse réelle du client, sinon le quota par IP vise le proxy.
- **E-mails** : aucune file durable. Un échec d’envoi est seulement tracé (`send_password_reset_email`, `send_password_changed_email`) ; l’utilisateur redemande un lien.

## Test mobile en local

Garder `FRONTEND_URL=http://localhost:3000` dans `apps/backend/.env` et lancer `pnpm frontend:dev` à côté de `pnpm dev:mobile`. Le lien reçu s’ouvre sur l’ordinateur de développement ; la reconnexion se teste ensuite dans l’app. Après un changement de `FRONTEND_URL`, redémarrer le backend et redemander un lien.
