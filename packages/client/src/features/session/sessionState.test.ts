import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { FullGuessObject, Game, Guess, Session } from '@cityborn/api';
import {
  GameIdSchema,
  GameStatus,
  GuessObjectIdSchema,
  PlayerIdSchema,
  RoundStatus,
  SessionIdSchema,
  SessionMode,
  SessionStatus,
  WorldLocationIdSchema,
} from '@cityborn/api';
import {
  advanceSoloRound,
  applySoloGuess,
  isHostOf,
  mergeSessionUpdate,
  startSoloGame,
  withGame,
  withGameConfig,
  withHost,
  withoutGame,
  withStatus,
} from './sessionState';

const citizen = PlayerIdSchema.parse('citizen');
const firstObjectId = GuessObjectIdSchema.parse('object-1');
const secondObjectId = GuessObjectIdSchema.parse('object-2');

const guess: Guess = {
  coordinates: { lat: 48.85, lng: 2.35 },
  distance: 120,
  points: 887,
  win: false,
};

function createGame(): Game {
  return {
    id: GameIdSchema.parse('game-1'),
    config: { categories: [], timer: 25, nbOfObjects: 2 },
    status: GameStatus.STARTING,
    state: {
      guessObjectsIds: [firstObjectId, secondObjectId],
      results: { [citizen]: { results: [] } },
    },
  };
}

function createSession(currentGame?: Game): Session {
  return {
    id: SessionIdSchema.parse('session-1'),
    hostID: citizen,
    mode: SessionMode.SOLO,
    status: SessionStatus.IN_LOBBY,
    gameConfig: { categories: [], timer: 25, nbOfObjects: 6 },
    players: [],
    currentGame,
  };
}

test('withHost and withStatus do not mutate the given session', () => {
  const session = createSession();

  assert.equal(
    withHost(session, PlayerIdSchema.parse('other')).hostID,
    'other',
  );
  assert.equal(
    withStatus(session, SessionStatus.IN_GAME).status,
    SessionStatus.IN_GAME,
  );
  assert.equal(session.hostID, 'citizen');
  assert.equal(session.status, SessionStatus.IN_LOBBY);
});

test('withGameConfig merges the partial configuration', () => {
  const session = createSession();

  const updated = withGameConfig(session, { timer: 10 });

  assert.equal(updated.gameConfig.timer, 10);
  assert.equal(updated.gameConfig.nbOfObjects, 6);
  assert.equal(session.gameConfig.timer, 25);
});

test('withGame then withoutGame open and close the game', () => {
  const session = createSession();
  const game = createGame();

  const inGame = withGame(session, game);
  assert.equal(inGame.currentGame, game);
  assert.equal(withoutGame(inGame).currentGame, undefined);
});

test('isHostOf is false without a session or a player', () => {
  const session = createSession();

  assert.equal(isHostOf(session, citizen), true);
  assert.equal(isHostOf(session, PlayerIdSchema.parse('other')), false);
  assert.equal(isHostOf(session, undefined), false);
  assert.equal(isHostOf(undefined, citizen), false);
});

test('startSoloGame puts the session in game and starts the first round', () => {
  const session = startSoloGame(createSession(), createGame());

  assert.equal(session.status, SessionStatus.IN_GAME);
  assert.equal(session.currentGame?.status, GameStatus.IN_GAME);
  assert.equal(
    session.currentGame?.state.currentRound?.guessObjectId,
    firstObjectId,
  );
  assert.equal(
    session.currentGame?.state.currentRound?.status,
    RoundStatus.GUESSING,
  );
});

test('applySoloGuess ends the round of the solo player', () => {
  const started = startSoloGame(createSession(), createGame());

  const guessed = applySoloGuess(started, citizen, guess);

  const round = guessed.currentGame?.state.currentRound;
  assert.equal(round?.status, RoundStatus.SHOWING_RESULTS);
  assert.deepEqual(round?.playersGuesses?.[citizen], guess);
});

test('applySoloGuess has no effect outside an ongoing round', () => {
  const session = createSession(createGame());

  assert.equal(applySoloGuess(session, citizen, guess), session);
  assert.equal(
    applySoloGuess(createSession(), citizen, guess).currentGame,
    undefined,
  );
});

test('advanceSoloRound moves through rounds then reports the end of the game', () => {
  const firstRound = applySoloGuess(
    startSoloGame(createSession(), createGame()),
    citizen,
    guess,
  );

  const second = advanceSoloRound(firstRound);
  assert.equal(second.isGameOver, false);
  assert.equal(
    second.session.currentGame?.state.currentRound?.guessObjectId,
    secondObjectId,
  );

  const last = advanceSoloRound(applySoloGuess(second.session, citizen, guess));
  assert.equal(last.isGameOver, true);
  assert.equal(last.session.currentGame?.status, GameStatus.IN_RESULTS);
  assert.equal(
    last.session.currentGame?.state.results[citizen].results.length,
    2,
  );
});

test('advanceSoloRound without a game does not report the end of the game', () => {
  const session = createSession();

  assert.deepEqual(advanceSoloRound(session), { session, isGameOver: false });
});

test('mergeSessionUpdate keeps local guessObjects missing from the server', () => {
  const guessObjects: FullGuessObject[] = [
    {
      id: firstObjectId,
      name: 'Ada Lovelace',
      world_location: {
        id: WorldLocationIdSchema.parse('location-1'),
        osm_type: 'relation',
        name: 'Londres',
        display_name: 'Londres, Royaume-Uni',
        centroid: [51.5, -0.12],
        source: { provider: 'osm', external_id: '65606' },
        geometry: { type: 'Point', coordinates: [-0.12, 51.5] },
      },
    },
  ];
  const local = withGame(createSession(), {
    ...createGame(),
    state: { ...createGame().state, guessObjects },
  });
  const incoming = withGame(createSession(), createGame());

  const merged = mergeSessionUpdate(local, incoming);

  assert.deepEqual(merged.currentGame?.state.guessObjects, guessObjects);
});

test('mergeSessionUpdate adopts the server game when it is complete', () => {
  const incoming = withGame(createSession(), createGame());

  const merged = mergeSessionUpdate(undefined, incoming);

  assert.equal(merged.currentGame?.state.guessObjects, undefined);
  assert.equal(merged.id, incoming.id);
});
