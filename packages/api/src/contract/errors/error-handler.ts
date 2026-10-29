import { UserFacingError } from '../../errors/user-facing-error';
import { ApiResponseError } from '../api-response';
import { type ApiError, isApiError } from './api-error.schema';
import { ErrorCode } from './error-codes';

const ERROR_MESSAGES: Record<ErrorCode, string> = {
  // User
  [ErrorCode.USER_NOT_FOUND]: "L'utilisateur n'existe pas.",
  [ErrorCode.USER_INVALID_CREDENTIALS]: 'Identifiant ou mot de passe incorrect',
  [ErrorCode.USER_CURRENT_PASSWORD_INCORRECT]:
    'Le mot de passe actuel est incorrect.',
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
  [ErrorCode.USER_NOT_ADMIN]: 'Accès réservé aux administrateurs.',

  // Player
  [ErrorCode.PLAYER_NOT_FOUND]: "Le joueur n'existe pas.",
  [ErrorCode.CONNECTION_NOT_FOUND]: 'Aucune connexion trouvée pour ce socket.',

  // Session
  [ErrorCode.SESSION_NOT_FOUND]: "Cette partie n'existe plus",
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
  [ErrorCode.SESSION_ALREADY_IN_GAME]: 'La partie a déjà commencé',
  [ErrorCode.SESSION_RECONNECT_FORBIDDEN]:
    'Impossible de reprendre la place de ce joueur dans la session.',
  [ErrorCode.SESSION_SOLO_NOT_JOINABLE]:
    'Une session solo ne peut pas être rejointe.',

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

  // Pack
  [ErrorCode.PACK_NOT_FOUND]: 'Aucun pack trouvé pour cet identifiant.',
  [ErrorCode.PACK_HAS_CHILDREN]:
    'Ce pack contient des sous-packs et ne peut pas être supprimé.',
  [ErrorCode.CATEGORY_NOT_FOUND]:
    'Aucune catégorie trouvée pour cet identifiant.',

  // Theme
  [ErrorCode.THEME_NAME_ALREADY_EXISTS]: 'Ce thème existe déjà',
  [ErrorCode.THEME_HAS_PACKS]: 'Des packs sont encore rattachés à ce thème.',
  [ErrorCode.THEME_DEFAULT_NOT_DELETABLE]:
    'Le thème par défaut ne peut pas être supprimé.',
  [ErrorCode.THEME_NOT_FOUND]: 'Aucun thème trouvé pour cet identifiant.',

  // Rate limiting
  [ErrorCode.RATE_LIMIT_EXCEEDED]:
    'Trop de requêtes. Veuillez patienter avant de réessayer.',

  // Redis
  [ErrorCode.REDIS_GET_FAILED]: 'Erreur interne. Veuillez réessayer.',
  [ErrorCode.REDIS_SET_FAILED]: 'Erreur interne. Veuillez réessayer.',
  [ErrorCode.REDIS_DELETE_FAILED]: 'Erreur interne. Veuillez réessayer.',
  [ErrorCode.REDIS_EXPIRE_FAILED]: 'Erreur interne. Veuillez réessayer.',

  // Email
  [ErrorCode.EMAIL_SEND_FAILED]:
    "Erreur lors de l'envoi de l'email. Veuillez réessayer.",

  // Prisma
  [ErrorCode.RESOURCE_ALREADY_EXISTS]: 'Cette ressource existe déjà.',
  [ErrorCode.RESOURCE_NOT_FOUND]:
    "Cette ressource n'existe pas ou a déjà été supprimée.",

  // Websocket transport
  [ErrorCode.WS_NOT_CONNECTED]:
    'La connexion temps réel est fermée. Veuillez réessayer.',
  [ErrorCode.WS_ACK_TIMEOUT]:
    "Le serveur n'a pas répondu à temps. Veuillez réessayer.",

  // Classic
  [ErrorCode.BAD_REQUEST]: 'Requête invalide.',
  [ErrorCode.TOKEN_EXPIRED]: 'Session expirée. Veuillez vous reconnecter.',
  [ErrorCode.CSRF_ORIGIN_FORBIDDEN]: 'Origine de la requête refusée.',
  [ErrorCode.UNKNOWN_ERROR]:
    'Une erreur inconnue est survenue, veuillez réessayer.',
};

export const getFriendlyErrorMessage = (
  error: Pick<ApiError, 'code'>,
): string => {
  return ERROR_MESSAGES[error.code];
};

const genericErrorMessage: string = "Quelque chose s'est mal passé.";

export function resolveErrorMessage(
  error: unknown,
  fallbackMessage?: string,
): string {
  if (error instanceof UserFacingError) {
    return error.message;
  }
  if (error instanceof ApiResponseError) {
    return getFriendlyErrorMessage(error.apiError);
  }
  if (isApiError(error)) {
    return getFriendlyErrorMessage(error);
  }
  return fallbackMessage ?? genericErrorMessage;
}
