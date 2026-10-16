import { AuthErrorCode } from '../auth/auth.error-codes';
import { CategoryErrorCode } from '../category/category.error-codes';
import { GameErrorCode } from '../game/game.error-codes';
import { GuessObjectErrorCode } from '../guess-object/guess-object.error-codes';
import { PlayerErrorCode } from '../player/player.error-codes';
import { SentenceErrorCode } from '../sentence/sentence.error-codes';
import { SessionErrorCode } from '../session/session.error-codes';
import { UserErrorCode } from '../user/user.error-codes';
import { WorldLocationErrorCode } from '../world-location/world-location.error-codes';
import { TechnicalErrorCode } from './technical.error-codes';

export const ErrorCode = Object.freeze({
  ...UserErrorCode,
  ...AuthErrorCode,
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
