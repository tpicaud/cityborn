import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { FullGuessObject, Game, Guess, Session } from '@cityborn/api';
import {
  GameStatus,
  RoundStatus,
  SessionMode,
  SessionStatus,
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

const guess: Guess = {
  coordinates: { lat: 48.85, lng: 2.35 },
  distance: 120,
  points: 887,
  win: false,
};

function createGame(): Game {
  return {
    id: 'game-1',
    config: { categories: [], timer: 25, nbOfObjects: 2 },
    status: GameStatus.STARTING,
    state: {
      guessObjectsIds: ['object-1', 'object-2'],
      results: { citizen: { results: [] } },
    },
  };
}

function createSession(currentGame?: Game): Session {
  return {
    id: 'session-1',
    hostID: 'citizen',
    mode: SessionMode.SOLO,
    status: SessionStatus.IN_LOBBY,
    gameConfig: { categories: [], timer: 25, nbOfObjects: 6 },
    players: [],
    currentGame,
  };
}

test('withHost et withStatus ne mutent pas la session reçue', () => {
  const session = createSession();

  assert.equal(withHost(session, 'other').hostID, 'other');
  assert.equal(
    withStatus(session, SessionStatus.IN_GAME).status,
    SessionStatus.IN_GAME,
  );
  assert.equal(session.hostID, 'citizen');
  assert.equal(session.status, SessionStatus.IN_LOBBY);
});

test('withGameConfig fusionne la configuration partielle', () => {
  const session = createSession();

  const updated = withGameConfig(session, { timer: 10 });

  assert.equal(updated.gameConfig.timer, 10);
  assert.equal(updated.gameConfig.nbOfObjects, 6);
  assert.equal(session.gameConfig.timer, 25);
});

test('withGame puis withoutGame ouvrent et referment la partie', () => {
  const session = createSession();
  const game = createGame();

  const inGame = withGame(session, game);
  assert.equal(inGame.currentGame, game);
  assert.equal(withoutGame(inGame).currentGame, undefined);
});

test('isHostOf est faux sans session ou sans joueur', () => {
  const session = createSession();

  assert.equal(isHostOf(session, 'citizen'), true);
  assert.equal(isHostOf(session, 'other'), false);
  assert.equal(isHostOf(session, undefined), false);
  assert.equal(isHostOf(undefined, 'citizen'), false);
});

test('startSoloGame passe la session en jeu et démarre le premier tour', () => {
  const session = startSoloGame(createSession(), createGame());

  assert.equal(session.status, SessionStatus.IN_GAME);
  assert.equal(session.currentGame?.status, GameStatus.IN_GAME);
  assert.equal(
    session.currentGame?.state.currentRound?.guessObjectId,
    'object-1',
  );
  assert.equal(
    session.currentGame?.state.currentRound?.status,
    RoundStatus.GUESSING,
  );
});

test('applySoloGuess clôture le tour du joueur solo', () => {
  const started = startSoloGame(createSession(), createGame());

  const guessed = applySoloGuess(started, 'citizen', guess);

  const round = guessed.currentGame?.state.currentRound;
  assert.equal(round?.status, RoundStatus.SHOWING_RESULTS);
  assert.deepEqual(round?.playersGuesses?.citizen, guess);
});

test('applySoloGuess est sans effet hors tour en cours', () => {
  const session = createSession(createGame());

  assert.equal(applySoloGuess(session, 'citizen', guess), session);
  assert.equal(
    applySoloGuess(createSession(), 'citizen', guess).currentGame,
    undefined,
  );
});

test('advanceSoloRound enchaîne les tours puis signale la fin de partie', () => {
  const firstRound = applySoloGuess(
    startSoloGame(createSession(), createGame()),
    'citizen',
    guess,
  );

  const second = advanceSoloRound(firstRound);
  assert.equal(second.isGameOver, false);
  assert.equal(
    second.session.currentGame?.state.currentRound?.guessObjectId,
    'object-2',
  );

  const last = advanceSoloRound(
    applySoloGuess(second.session, 'citizen', guess),
  );
  assert.equal(last.isGameOver, true);
  assert.equal(last.session.currentGame?.status, GameStatus.IN_RESULTS);
  assert.equal(
    last.session.currentGame?.state.results.citizen.results.length,
    2,
  );
});

test('advanceSoloRound sans partie ne signale pas de fin de partie', () => {
  const session = createSession();

  assert.deepEqual(advanceSoloRound(session), { session, isGameOver: false });
});

test('mergeSessionUpdate conserve les guessObjects locaux absents du serveur', () => {
  const guessObjects: FullGuessObject[] = [
    {
      id: 'object-1',
      name: 'Ada Lovelace',
      world_location: {
        id: 'location-1',
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

test('mergeSessionUpdate adopte la partie du serveur quand elle est complète', () => {
  const incoming = withGame(createSession(), createGame());

  const merged = mergeSessionUpdate(undefined, incoming);

  assert.equal(merged.currentGame?.state.guessObjects, undefined);
  assert.equal(merged.id, incoming.id);
});
