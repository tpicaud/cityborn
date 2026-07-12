import type { ApiError } from '../schemas/api-error.schema.js';
import { ErrorCode } from './error-codes.js';

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // User
  [ErrorCode.USER_NOT_FOUND]: "L'utilisateur n'existe pas.",
  [ErrorCode.USER_INVALID_CREDENTIALS]: 'Identifiant ou mot de passe incorrect',
  [ErrorCode.USER_USERNAME_ALREADY_EXISTS]:
    "Le nom d'utilisateur est déjà pris.",
  [ErrorCode.USER_EMAIL_ALREADY_TAKEN]:
    "L'adresse mail est déjà utilisée pour un autre compte.",
  [ErrorCode.USER_NOT_VANILLA_ACCOUNT]:
    "Vous n'avez pas de compte Cityborn. Êtes-vous sûr que ce n'est pas un compte d'un autre fournisseur ? (e.g. Google)",
  [ErrorCode.USER_GOOGLE_EMAIL_NOT_VERIFIED]:
    "Le compte Google n'est pas vérifié.",
  [ErrorCode.USER_REFRESH_FAILED]:
    'Session expirée. Veuillez vous reconnecter.',
  [ErrorCode.USER_NOT_VERIFIED]:
    "Le compte n'est pas vérifié. Veuillez faire vérifier votre adresse mail.",
  [ErrorCode.USER_TOKEN_MISSING]: 'Token manquant. Veuillez vous reconnecter.',
  [ErrorCode.USER_INVALID_TOKEN]: 'Token invalide. Veuillez vous reconnecter.',
  [ErrorCode.USER_VERIFICATION_EMAIL_INVALID_TOKEN]:
    'Le lien de vérification a expiré ou est invalide.',
  [ErrorCode.USER_NO_ACCOUNT_OR_NOT_VERIFIED]:
    'Vous devez posséder un compte utilisateur vérifié.',
  [ErrorCode.USER_VERIFICATION_EMAIL_RESEND_TOO_SOON]:
    'Veuillez patienter 3 minutes avant de demander un nouveau mail de vérification.',

  // Player
  [ErrorCode.PLAYER_NOT_FOUND]: "Le joueur n'existe pas.",

  // Session
  [ErrorCode.SESSION_NOT_FOUND]: "La session n'existe pas.",
  [ErrorCode.SESSION_PLAYER_NOT_FOUND]:
    "Le joueur n'existe pas dans la session.",
  [ErrorCode.SESSION_PLAYER_NOT_CONNECTED]: "Le joueur n'est pas connecté.",
  [ErrorCode.SESSION_PLAYER_ALREADY_EXISTS]:
    'Le joueur existe déjà dans la session.',
  [ErrorCode.SESSION_CREATION_FAILED]:
    'Erreur lors de la création de la session. Veuillez réessayer.',
  [ErrorCode.SESSION_FORBIDDEN_HOST]:
    "Le joueur n'est pas le host de la session.",
  [ErrorCode.SESSION_NO_CURRENT_GAME]:
    'Aucune partie en cours pour la session.',
  [ErrorCode.SESSION_ALREADY_IN_GAME]: 'La session a déjà une partie en cours.',

  // Game
  [ErrorCode.GAME_END_SENTENCE_NOT_FOUND]:
    'Erreur lors de la récupération de la phrase de fin.',
  [ErrorCode.GAME_NO_ACTIVE_ROUND]: 'Aucun round actif dans la partie.',
  [ErrorCode.GAME_CREATION_FAILED]: 'Erreur lors de la création de la partie.',

  // Guess objects
  [ErrorCode.GUESS_OBJECTS_NOT_FOUND]: 'Aucun objet trouvé.',
  [ErrorCode.GUESS_OBJECTS_GET_FAILED]:
    'Erreur lors de la récupération des objets.',
  [ErrorCode.GUESS_OBJECTS_SEARCH_FAILED]:
    'Erreur lors de la recherche des objets.',

  // World location
  [ErrorCode.WORLD_LOCATION_SEARCH_FAILED]:
    'Erreur lors de la recherche du lieu.',
  [ErrorCode.WORLD_LOCATION_NOT_FOUND]:
    'Aucun lieu trouvé pour cet identifiant.',

  // Category
  [ErrorCode.CATEGORY_NOT_FOUND]:
    'Aucune catégorie trouvée pour cet identifiant.',

  // Redis
  [ErrorCode.REDIS_GET_FAILED]: 'Erreur interne. Veuillez réessayer.',
  [ErrorCode.REDIS_SET_FAILED]: 'Erreur interne. Veuillez réessayer.',
  [ErrorCode.REDIS_DELETE_FAILED]: 'Erreur interne. Veuillez réessayer.',

  // Email
  [ErrorCode.EMAIL_SEND_FAILED]:
    "Erreur lors de l'envoi de l'email. Veuillez réessayer.",

  // Classic
  [ErrorCode.BAD_REQUEST]: 'Requête invalide.',
  [ErrorCode.TOKEN_EXPIRED]: 'Session expirée. Veuillez vous reconnecter.',
  [ErrorCode.UNKNOWN_ERROR]:
    'Une erreur inconnue est survenue, veuillez réessayer.',
};

export const getFriendlyErrorMessage = (error: ApiError): string => {
  return ERROR_MESSAGES[error.code];
};
