import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildFullGuessObject,
  buildGame,
  buildGameConfig,
  buildGameState,
  buildGuess,
  buildSession,
  type FullGuessObject,
  type Game,
  GameStatus,
  type Guess,
  type GuessObjectId,
  GuessObjectIdSchema,
  type PlayerId,
  PlayerIdSchema,
  type Round,
  RoundStatus,
  type Session,
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

type SoloRoundAdvance = ReturnType<typeof advanceSoloRound>;

const citizen: PlayerId = PlayerIdSchema.parse('citizen');
const otherPlayer: PlayerId = PlayerIdSchema.parse('other');
const firstObjectId: GuessObjectId = GuessObjectIdSchema.parse('object-1');
const secondObjectId: GuessObjectId = GuessObjectIdSchema.parse('object-2');

const guess: Guess = buildGuess();

const startingGame: Game = buildGame({
  config: buildGameConfig({ nbOfObjects: 2 }),
  status: GameStatus.STARTING,
  state: buildGameState({
    guessObjectsIds: [firstObjectId, secondObjectId],
    results: { [citizen]: { results: [] } },
  }),
});

const soloSession: Session = buildSession({
  hostID: citizen,
  mode: SessionMode.SOLO,
  status: SessionStatus.IN_LOBBY,
  gameConfig: buildGameConfig({ timer: 25, nbOfObjects: 6 }),
  players: [],
});

describe('withHost', () => {
  it('replaces the host without mutating the given session', () => {
    const updated: Session = withHost(soloSession, otherPlayer);

    assert.equal(updated.hostID, 'other');
    assert.equal(soloSession.hostID, 'citizen');
  });
});

describe('withStatus', () => {
  it('replaces the status without mutating the given session', () => {
    const updated: Session = withStatus(soloSession, SessionStatus.IN_GAME);

    assert.equal(updated.status, SessionStatus.IN_GAME);
    assert.equal(soloSession.status, SessionStatus.IN_LOBBY);
  });
});

describe('withGameConfig', () => {
  it('merges the partial configuration without mutating the given session', () => {
    const updated: Session = withGameConfig(soloSession, { timer: 10 });

    assert.equal(updated.gameConfig.timer, 10);
    assert.equal(updated.gameConfig.nbOfObjects, 6);
    assert.equal(soloSession.gameConfig.timer, 25);
  });
});

describe('withGame', () => {
  it('opens the game', () => {
    const inGame: Session = withGame(soloSession, startingGame);

    assert.equal(inGame.currentGame, startingGame);
  });
});

describe('withoutGame', () => {
  it('closes the game', () => {
    const inGame: Session = withGame(soloSession, startingGame);

    const closed: Session = withoutGame(inGame);

    assert.equal(closed.currentGame, undefined);
  });
});

describe('isHostOf', () => {
  it('recognizes the host of the session', () => {
    const isHost: boolean = isHostOf(soloSession, citizen);

    assert.equal(isHost, true);
  });

  it('rejects another player', () => {
    const isHost: boolean = isHostOf(soloSession, otherPlayer);

    assert.equal(isHost, false);
  });

  it('rejects a missing player', () => {
    const isHost: boolean = isHostOf(soloSession, undefined);

    assert.equal(isHost, false);
  });

  it('rejects a missing session', () => {
    const isHost: boolean = isHostOf(undefined, citizen);

    assert.equal(isHost, false);
  });
});

describe('startSoloGame', () => {
  it('puts the session in game and starts the first round', () => {
    const session: Session = startSoloGame(soloSession, startingGame);

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
});

describe('applySoloGuess', () => {
  it('ends the round of the solo player', () => {
    const started: Session = startSoloGame(soloSession, startingGame);

    const guessed: Session = applySoloGuess(started, citizen, guess);

    const round: Round | undefined = guessed.currentGame?.state.currentRound;
    assert.equal(round?.status, RoundStatus.SHOWING_RESULTS);
    assert.deepEqual(round?.playersGuesses?.[citizen], guess);
  });

  it('leaves a session without ongoing round unchanged', () => {
    const session: Session = withGame(soloSession, startingGame);

    const guessed: Session = applySoloGuess(session, citizen, guess);

    assert.equal(guessed, session);
  });

  it('leaves a session without game unchanged', () => {
    const guessed: Session = applySoloGuess(soloSession, citizen, guess);

    assert.equal(guessed, soloSession);
  });
});

describe('advanceSoloRound', () => {
  it('moves to the next round', () => {
    const firstRoundGuessed: Session = applySoloGuess(
      startSoloGame(soloSession, startingGame),
      citizen,
      guess,
    );

    const advance: SoloRoundAdvance = advanceSoloRound(firstRoundGuessed);

    assert.equal(advance.isGameOver, false);
    assert.equal(
      advance.session.currentGame?.state.currentRound?.guessObjectId,
      'object-2',
    );
  });

  it('reports the end of the game after the last round', () => {
    const secondRound: Session = advanceSoloRound(
      applySoloGuess(startSoloGame(soloSession, startingGame), citizen, guess),
    ).session;
    const lastRoundGuessed: Session = applySoloGuess(
      secondRound,
      citizen,
      guess,
    );

    const advance: SoloRoundAdvance = advanceSoloRound(lastRoundGuessed);

    assert.equal(advance.isGameOver, true);
    assert.equal(advance.session.currentGame?.status, GameStatus.IN_RESULTS);
    assert.equal(
      advance.session.currentGame?.state.results[citizen].results.length,
      2,
    );
  });

  it('does not report the end of the game without a game', () => {
    const advance: SoloRoundAdvance = advanceSoloRound(soloSession);

    assert.deepEqual(advance, { session: soloSession, isGameOver: false });
  });
});

describe('mergeSessionUpdate', () => {
  it('keeps local guessObjects missing from the server', () => {
    const guessObjects: FullGuessObject[] = [
      buildFullGuessObject({ id: firstObjectId, name: 'Ada Lovelace' }),
    ];
    const local: Session = withGame(soloSession, {
      ...startingGame,
      state: { ...startingGame.state, guessObjects },
    });
    const incoming: Session = withGame(soloSession, startingGame);

    const merged: Session = mergeSessionUpdate(local, incoming);

    assert.deepEqual(merged.currentGame?.state.guessObjects, guessObjects);
  });

  it('adopts the server game without a local session', () => {
    const incoming: Session = withGame(soloSession, startingGame);

    const merged: Session = mergeSessionUpdate(undefined, incoming);

    assert.equal(merged.currentGame?.state.guessObjects, undefined);
    assert.equal(merged.id, 'session-1');
  });
});
