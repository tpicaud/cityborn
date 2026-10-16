import { CategoryErrorCode } from '../category/category.error-codes';
import { GameErrorCode } from '../game/game.error-codes';
import { GuessObjectErrorCode } from '../guess-object/guess-object.error-codes';
import { PlayerErrorCode } from '../player/player.error-codes';
import { SentenceErrorCode } from '../sentence/sentence.error-codes';
import { SessionErrorCode } from '../session/session.error-codes';
import { UserErrorCode } from '../user/user.error-codes';
import { WorldLocationErrorCode } from '../world-location/world-location.error-codes';

enum TechnicalErrorCode {
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  REDIS_GET_FAILED = 'REDIS_GET_FAILED',
  REDIS_SET_FAILED = 'REDIS_SET_FAILED',
  REDIS_DELETE_FAILED = 'REDIS_DELETE_FAILED',
  REDIS_EXPIRE_FAILED = 'REDIS_EXPIRE_FAILED',
  EMAIL_SEND_FAILED = 'EMAIL_SEND_FAILED',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  BAD_REQUEST = 'BAD_REQUEST',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  CSRF_ORIGIN_FORBIDDEN = 'CSRF_ORIGIN_FORBIDDEN',
  WS_NOT_CONNECTED = 'WS_NOT_CONNECTED',
  WS_ACK_TIMEOUT = 'WS_ACK_TIMEOUT',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export const ErrorCode = Object.freeze({
  ...UserErrorCode,
  ...PlayerErrorCode,
  ...SessionErrorCode,
  ...SentenceErrorCode,
  ...GameErrorCode,
  ...GuessObjectErrorCode,
  ...WorldLocationErrorCode,
  ...CategoryErrorCode,
  ...TechnicalErrorCode,
});

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
