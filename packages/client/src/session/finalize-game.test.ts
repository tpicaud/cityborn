import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFullGuessObject,
  buildGame,
  buildSession,
  SessionMode,
} from '@cityborn/api';
import { buildFinalizeGameBody } from './finalize-game';

describe('buildFinalizeGameBody', () => {
  it('returns null when the session has no current game', () => {
    assert.equal(
      buildFinalizeGameBody(buildSession({ mode: SessionMode.SOLO })),
      null,
    );
  });

  it('strips the guess objects from the finalized game', () => {
    const game = buildGame({});
    game.state.guessObjects = [buildFullGuessObject({})];
    const session = buildSession({ mode: SessionMode.SOLO });
    session.currentGame = game;

    const body = buildFinalizeGameBody(session);

    assert.ok(body);
    assert.equal(body.currentGame.state.guessObjects, undefined);
    assert.deepEqual(
      body.currentGame.state.guessObjectsIds,
      game.state.guessObjectsIds,
    );
  });
});
