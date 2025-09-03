import { ErrorCode } from "./ErrorCodes.js";

export const ERROR_MESSAGES = {
    fr: {

        // User
        [ErrorCode.USER_NOT_FOUND]: "L'utilisateur n'existe pas.",
        [ErrorCode.USER_INVALID_CREDENTIALS]: "Identifiant ou mot de passe incorrect",
        [ErrorCode.USER_USERNAME_ALREADY_EXISTS]: "Le nom d'utilisateur est déjà pris.",
        [ErrorCode.USER_EMAIL_ALREADY_TAKEN]: "L'adresse mail est déjà utilisé pour un autre compte.",
        [ErrorCode.USER_NOT_VANILLA_ACCOUNT]: "Vous n'avez pas de compte Cityborn. Êtes-vous sûr sur ce n'est pas un compte d'un autre fournisseur ? (e.g. Google)",
        [ErrorCode.USER_GOOGLE_EMAIL_NOT_VERIFIED]: "Le compte Google n'est pas vérifié.",
        [ErrorCode.USER_REFRESH_FAILED]: "Erreur lors du rafraîchissement de la session. Veuillez vous reconnecter.",
        [ErrorCode.USER_NOT_VERIFIED]: "Le compte n'est pas vérifié. Veuillez faire vérifier votre adresse mail.",
        [ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN]: "Le lien de vérification a expiré ou est invalide.",
        [ErrorCode.USER_NO_ACCOUNT]: "L'action nécessite un compte utilisateur",

        // Player
        [ErrorCode.PLAYER_NOT_FOUND]: "Le joueur n'existe pas.",

        // Session
        [ErrorCode.SESSION_NOT_FOUND]: "La session n'existe pas",
        [ErrorCode.SESSION_PLAYER_NOT_FOUND]: "Le joueur n'existe pas dans la session.",
        [ErrorCode.SESSION_PLAYER_NOT_CONNECTED]: "Le joueur n'est pas connecté",
        [ErrorCode.SESSION_PLAYER_ALREADY_EXISTS]: "Le joueur existe déjà dans la session.",
        [ErrorCode.SESSION_CREATION_FAILED]: "Erreur lors de la création de la session. Veuillez réessayer.",
        [ErrorCode.SESSION_FORBIDDEN_HOST]: "Le joueur n'est pas le host de la session.",
        [ErrorCode.SESSION_NO_CURRENT_GAME]: "Aucune partie en cours pour la session.",
        [ErrorCode.SESSION_ALREADY_IN_GAME]: "La session a déjà une partie en cours.",

        // Game
        [ErrorCode.GAME_END_SENTENCE_NOT_FOUND]: "Erreur lors de la récupération de la phrase de fin",
        [ErrorCode.GAME_NO_ACTIVE_ROUND]: "Aucun round actif dans la game",
        [ErrorCode.GAME_CREATION_FAILED]: "Erreur lors de la création de la partie",

        // Default
        [ErrorCode.UNKNOWN_ERROR]: "Une erreur inconnue est survenue, veuillez réessayer.",
    },
};
