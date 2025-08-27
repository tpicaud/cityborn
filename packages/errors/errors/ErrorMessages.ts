import { ErrorCode } from "./ErrorCodes.js";

export const ERROR_MESSAGES = {
    fr: {
        [ErrorCode.USER_NOT_FOUND]: "L'utilisateur n'existe pas.",
        [ErrorCode.INVALID_PASSWORD]: "Le mot de passe est incorrect.",
        [ErrorCode.UNKNOWN_ERROR]: "Une erreur inconnue est survenue, veuillez réessayer.",
    },
};
