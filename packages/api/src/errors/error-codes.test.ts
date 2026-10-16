import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { AuthErrorCode } from '../auth/auth.error-codes';
import { CategoryErrorCode } from '../category/category.error-codes';
import { GameErrorCode } from '../game/game.error-codes';
import { GuessObjectErrorCode } from '../guess-object/guess-object.error-codes';
import { PlayerErrorCode } from '../player/player.error-codes';
import { SentenceErrorCode } from '../sentence/sentence.error-codes';
import { SessionErrorCode } from '../session/session.error-codes';
import { UserErrorCode } from '../user/user.error-codes';
import { WorldLocationErrorCode } from '../world-location/world-location.error-codes';
import { ErrorCode } from './error-codes';
import { TechnicalErrorCode } from './technical.error-codes';

const errorCodeEnums: Record<string, string>[] = [
  UserErrorCode,
  AuthErrorCode,
  PlayerErrorCode,
  SessionErrorCode,
  SentenceErrorCode,
  GameErrorCode,
  GuessObjectErrorCode,
  WorldLocationErrorCode,
  CategoryErrorCode,
  TechnicalErrorCode,
];

describe('ErrorCode', () => {
  it('keeps every code of every enum without key collision', () => {
    const enumKeyCount: number = errorCodeEnums.reduce(
      (count: number, errorCodeEnum: Record<string, string>): number =>
        count + Object.keys(errorCodeEnum).length,
      0,
    );

    const errorCodeKeyCount: number = Object.keys(ErrorCode).length;

    assert.equal(errorCodeKeyCount, enumKeyCount);
  });

  it('names every code after its value', () => {
    const mismatchedEntries: [string, string][] = Object.entries(
      ErrorCode,
    ).filter(([key, value]: [string, string]): boolean => key !== value);

    assert.deepEqual(mismatchedEntries, []);
  });
});
