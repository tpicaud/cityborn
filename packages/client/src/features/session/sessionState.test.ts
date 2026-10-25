import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFullGuessObject,
  buildGame,
  buildGameState,
  buildSession,
  type FullGuessObject,
  type Game,
  type GuessObjectId,
  GuessObjectIdSchema,
  type PlayerId,
  PlayerIdSchema,
  type Session,
  SessionStatus,
} from '@cityborn/api';
import { isHostOf, mergeSessionUpdate, withStatus } from './sessionState';

const citizen: PlayerId = PlayerIdSchema.parse('citizen');
const otherPlayer: PlayerId = PlayerIdSchema.parse('other');
const firstObjectId: GuessObjectId = GuessObjectIdSchema.parse('object-1');

const game: Game = buildGame({
  state: buildGameState({ guessObjectsIds: [firstObjectId] }),
});

const session: Session = buildSession({
  hostID: citizen,
  status: SessionStatus.IN_LOBBY,
  players: [],
});

describe('withStatus', () => {
  it('replaces the status without mutating the given session', () => {
    const updated: Session = withStatus(session, SessionStatus.IN_GAME);

    assert.equal(updated.status, SessionStatus.IN_GAME);
    assert.equal(session.status, SessionStatus.IN_LOBBY);
  });
});

describe('isHostOf', () => {
  it('recognizes the host of the session', () => {
    const isHost: boolean = isHostOf(session, citizen);

    assert.equal(isHost, true);
  });

  it('rejects another player', () => {
    const isHost: boolean = isHostOf(session, otherPlayer);

    assert.equal(isHost, false);
  });

  it('rejects a missing player', () => {
    const isHost: boolean = isHostOf(session, undefined);

    assert.equal(isHost, false);
  });

  it('rejects a missing session', () => {
    const isHost: boolean = isHostOf(undefined, citizen);

    assert.equal(isHost, false);
  });
});

describe('mergeSessionUpdate', () => {
  it('keeps local guessObjects missing from the server', () => {
    const guessObjects: FullGuessObject[] = [
      buildFullGuessObject({ id: firstObjectId, name: 'Ada Lovelace' }),
    ];
    const local: Session = {
      ...session,
      currentGame: { ...game, state: { ...game.state, guessObjects } },
    };
    const incoming: Session = { ...session, currentGame: game };

    const merged: Session = mergeSessionUpdate(local, incoming);

    assert.deepEqual(merged.currentGame?.state.guessObjects, guessObjects);
  });

  it('adopts the server game without a local session', () => {
    const incoming: Session = { ...session, currentGame: game };

    const merged: Session = mergeSessionUpdate(undefined, incoming);

    assert.equal(merged.currentGame?.state.guessObjects, undefined);
    assert.equal(merged.id, 'session-1');
  });
});
