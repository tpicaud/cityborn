import { ErrorCode } from "./ErrorCodes.js";

export const ERROR_MESSAGES = {
    fr: {

        // User
        [ErrorCode.USER_NOT_FOUND]: "L'utilisateur n'existe pas.",
        [ErrorCode.USER_USERNAME_ALREADY_EXISTS]: "Le nom d'utilisateur est déjà pris.",
        [ErrorCode.USER_EMAIL_ALREADY_TAKEN]: "L'adresse mail est déjà utilisé pour un autre compte.",
        [ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN]: "Le lien de vérification a expiré ou est invalide.",

        // Player
        [ErrorCode.PLAYER_NOT_FOUND]: "Le joueur n'existe pas.",

        // Session
        [ErrorCode.SESSION_NOT_FOUND]: "La session n'existe pas",
        [ErrorCode.SESSION_PLAYER_NOT_FOUND]: "Le joueur n'existe pas dans la session.",
        [ErrorCode.SESSION_PLAYER_ALREADY_EXISTS]: "Le joueur exite déjà dans la session.",
        [ErrorCode.SESSION_CREATION_FAILED]: "Erreur lors de la création de la session. Veuillez réessayer.",
        [ErrorCode.SESSION_FORBIDDEN_HOST]: "Le joueur n'est pas le host de la session.",
        [ErrorCode.SESSION_NO_CURRENT_GAME]: "Aucune partie en cours pour la session.",
        [ErrorCode.SESSION_ALREADY_IN_GAME]: "La session a déjà une partie en cours.",

        // Default
        [ErrorCode.UNKNOWN_ERROR]: "Une erreur inconnue est survenue, veuillez réessayer.",
    },
};
