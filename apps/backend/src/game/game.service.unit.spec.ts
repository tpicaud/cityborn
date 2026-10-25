import type {
  FullGuessObject,
  Game,
  GameConfig,
  OnlinePlayer,
} from '@cityborn/api';
import {
  buildFullGuessObject,
  buildGame,
  buildGameConfig,
  buildGuess,
  buildPlayer,
  defaultGuess,
  GameRecordIdSchema,
  GameStatus,
  PlayerIdSchema,
  RoundStatus,
  SessionMode,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { EventService } from '../event/event.service';
import type { GameRecordService } from '../game-record/game-record.service';
import type { GuessObjectService } from '../guess-object/guess-object.service';
import type { IdService } from '../id/id.service';
import type { CreateGameParams } from './game.service';
import { GameService } from './game.service';

function buildGameService() {
  const guessObjectService: DeepMocked<GuessObjectService> =
    createMock<GuessObjectService>();
  const gameRecordService: DeepMocked<GameRecordService> =
    createMock<GameRecordService>();
  const eventService: DeepMocked<EventService> = createMock<EventService>();
  const idService: DeepMocked<IdService> = createMock<IdService>();
  const gameService: GameService = new GameService(
    guessObjectService,
    gameRecordService,
    eventService,
    idService,
  );

  return {
    gameService,
    guessObjectService,
    gameRecordService,
    eventService,
    idService,
  };
}

describe('GameService.createGame', () => {
  it('creates a game and tracks connected multiplayer participants', async () => {
    const {
      gameService,
      guessObjectService,
      eventService,
      idService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    const guessObject: FullGuessObject = buildFullGuessObject();
    const players: OnlinePlayer[] = [
      buildPlayer({ username: 'host' }),
      buildPlayer({ username: 'bob', connected: false }),
    ];
    const gameConfig: GameConfig = buildGameConfig();
    const createGameData: CreateGameParams = {
      gameConfig,
      players,
      mode: SessionMode.MULTI,
      visitorId: 'visitor-1',
    };
    guessObjectService.findShuffledGuessObjectsByGameConfig.mockResolvedValue([
      guessObject,
    ]);
    idService.generateUniqueNamesId.mockReturnValue('game-readable-id');

    const game: Game = await gameService.createGame(createGameData);

    expect(game).toMatchObject({
      id: 'game-readable-id',
      status: GameStatus.STARTING,
      state: {
        guessObjectsIds: [guessObject.id],
        results: { host: { results: [] }, bob: { results: [] } },
      },
    });
    expect(eventService.trackEvent).toHaveBeenCalledWith({
      name: 'game_started',
      visitorId: 'visitor-1',
      properties: {
        mode: SessionMode.MULTI,
        packs: [],
        numberOfPlayers: 1,
      },
    });
  });

  it('does not track an anonymous game', async () => {
    const {
      gameService,
      guessObjectService,
      eventService,
      idService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    guessObjectService.findShuffledGuessObjectsByGameConfig.mockResolvedValue(
      [],
    );
    idService.generateUniqueNamesId.mockReturnValue('game-id');
    const gameConfig: GameConfig = buildGameConfig();
    const player: OnlinePlayer = buildPlayer();
    const createGameData: CreateGameParams = {
      gameConfig,
      players: [player],
      mode: SessionMode.SOLO,
    };

    await gameService.createGame(createGameData);

    expect(eventService.trackEvent).not.toHaveBeenCalled();
  });
});

describe('GameService.endGame', () => {
  it('persists only registered users and tracks the average score', async () => {
    const {
      gameService,
      gameRecordService,
      eventService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    const game: Game = buildGame({
      state: {
        guessObjectsIds: ['guess-1'],
        results: {
          host: {
            results: [{ guessObjectId: 'guess-1', distance: 10, points: 80 }],
          },
          guest: {
            results: [{ guessObjectId: 'guess-1', distance: 20, points: 40 }],
          },
        },
      },
    });
    const players: OnlinePlayer[] = [
      buildPlayer({ username: 'host', id: 'user-1' }),
      buildPlayer({ username: 'guest', isGuest: true }),
    ];
    gameRecordService.create.mockResolvedValue({
      id: GameRecordIdSchema.parse('game-record-1'),
    });

    await gameService.endGame(game, players, SessionMode.MULTI, 'visitor-1');

    expect(gameRecordService.create).toHaveBeenCalledWith(
      expect.objectContaining({ mode: SessionMode.MULTI }),
      [{ id: 'user-1' }],
    );
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({ average_score: 60 }),
      }),
    );
  });

  it('tracks a zero average when no round result exists', async () => {
    const {
      gameService,
      gameRecordService,
      eventService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    const game: Game = buildGame({
      state: {
        guessObjectsIds: [],
        results: { host: { results: [] } },
      },
    });
    const player: OnlinePlayer = buildPlayer();
    const players: OnlinePlayer[] = [player];
    gameRecordService.create.mockResolvedValue({
      id: GameRecordIdSchema.parse('game-record-1'),
    });

    await gameService.endGame(game, players, SessionMode.SOLO, 'visitor-1');

    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({ average_score: 0 }),
      }),
    );
  });

  it('does not track an anonymous finished game', async () => {
    const {
      gameService,
      gameRecordService,
      eventService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    const game: Game = buildGame();
    const player: OnlinePlayer = buildPlayer();
    const players: OnlinePlayer[] = [player];
    gameRecordService.create.mockResolvedValue({
      id: GameRecordIdSchema.parse('game-record-1'),
    });

    await gameService.endGame(game, players, SessionMode.SOLO);

    expect(eventService.trackEvent).not.toHaveBeenCalled();
  });
});

describe('GameService core transitions', () => {
  describe('beginGame', () => {
    it('begins a game with an absolute deadline including the countdown', () => {
      const { gameService }: ReturnType<typeof buildGameService> =
        buildGameService();
      const game: Game = buildGame({
        status: GameStatus.STARTING,
        state: {
          guessObjectsIds: ['first'],
          results: {},
          guessObjects: [],
        },
      });

      jest.spyOn(Date, 'now').mockReturnValue(1000);

      const started: Game = gameService.beginGame(game);

      expect(started.status).toBe(GameStatus.IN_GAME);
      expect(started.state.currentRound?.deadline).toBe(29000);
    });
  });
});

describe('GameService.applyGuess', () => {
  it('calculates the score from the private answer and submitted coordinates', () => {
    const { gameService }: ReturnType<typeof buildGameService> =
      buildGameService();
    const answer: FullGuessObject = buildFullGuessObject();
    const game: Game = buildGame({
      state: {
        guessObjectsIds: [answer.id],
        guessObjects: [answer],
        results: { host: { results: [] } },
        currentRound: {
          status: RoundStatus.GUESSING,
          guessObjectId: answer.id,
          deadline: 10000,
        },
      },
    });

    const result: Game = gameService.applyGuess({
      game,
      playerID: PlayerIdSchema.parse('host'),
      submission: {
        coordinates: {
          lat: answer.world_location.centroid[0],
          lng: answer.world_location.centroid[1],
        },
      },
      connectedPlayerIds: [PlayerIdSchema.parse('host')],
      receivedAt: 9000,
    });

    expect(result.state.currentRound).toMatchObject({
      status: RoundStatus.SHOWING_RESULTS,
      playersGuesses: { host: { distance: 0, points: 1000 } },
    });
  });

  it.each([
    {
      label: 'after the network tolerance',
      receivedAt: 11001,
      submission: { coordinates: { lat: 48.85, lng: 2.35 } },
      deadline: 10000,
    },
    {
      label: 'without clicked coordinates',
      receivedAt: 9000,
      submission: {},
      deadline: 10000,
    },
    {
      label: 'without a persisted deadline',
      receivedAt: 9000,
      submission: { coordinates: { lat: 48.85, lng: 2.35 } },
      deadline: undefined,
    },
  ])(
    'records an empty guess $label',
    ({ receivedAt, submission, deadline }) => {
      const { gameService }: ReturnType<typeof buildGameService> =
        buildGameService();
      const answer: FullGuessObject = buildFullGuessObject();
      const game: Game = buildGame({
        state: {
          guessObjectsIds: [answer.id],
          guessObjects: [answer],
          results: { host: { results: [] } },
          currentRound: {
            status: RoundStatus.GUESSING,
            guessObjectId: answer.id,
            deadline,
          },
        },
      });

      const result: Game = gameService.applyGuess({
        game,
        playerID: PlayerIdSchema.parse('host'),
        submission,
        connectedPlayerIds: [PlayerIdSchema.parse('host')],
        receivedAt,
      });

      expect(result.state.currentRound?.playersGuesses).toEqual({
        host: defaultGuess,
      });
    },
  );

  it('accepts the network tolerance at its inclusive boundary', () => {
    const { gameService }: ReturnType<typeof buildGameService> =
      buildGameService();
    const answer: FullGuessObject = buildFullGuessObject();
    const game: Game = buildGame({
      state: {
        guessObjectsIds: [answer.id],
        guessObjects: [answer],
        results: { host: { results: [] } },
        currentRound: {
          status: RoundStatus.GUESSING,
          guessObjectId: answer.id,
          deadline: 10000,
        },
      },
    });

    const result: Game = gameService.applyGuess({
      game,
      playerID: PlayerIdSchema.parse('host'),
      submission: {
        coordinates: {
          lat: answer.world_location.centroid[0],
          lng: answer.world_location.centroid[1],
        },
      },
      connectedPlayerIds: [PlayerIdSchema.parse('host')],
      receivedAt: 11000,
    });

    expect(
      result.state.currentRound?.playersGuesses?.[PlayerIdSchema.parse('host')]
        .points,
    ).toBe(1000);
  });

  it('keeps the first guess when a player submits again', () => {
    const { gameService }: ReturnType<typeof buildGameService> =
      buildGameService();
    const game: Game = buildGame({
      state: {
        guessObjectsIds: ['object-1'],
        results: { host: { results: [] }, bob: { results: [] } },
        currentRound: {
          status: RoundStatus.GUESSING,
          guessObjectId: 'object-1',
          deadline: 10000,
          playersGuesses: { host: defaultGuess },
        },
      },
    });

    const result: Game = gameService.applyGuess({
      game,
      playerID: PlayerIdSchema.parse('host'),
      submission: {},
      connectedPlayerIds: [
        PlayerIdSchema.parse('host'),
        PlayerIdSchema.parse('bob'),
      ],
      receivedAt: 100,
    });

    expect(result).toBe(game);
  });
});

describe('GameService.toClientGame', () => {
  it.each([
    { roundIndex: 0, status: RoundStatus.GUESSING, revealed: 0 },
    { roundIndex: 0, status: RoundStatus.SHOWING_RESULTS, revealed: 1 },
    { roundIndex: 1, status: RoundStatus.GUESSING, revealed: 1 },
    { roundIndex: 1, status: RoundStatus.SHOWING_RESULTS, revealed: 2 },
  ])(
    'reveals $revealed answers at round $roundIndex with status $status',
    ({ roundIndex, status, revealed }) => {
      const { gameService }: ReturnType<typeof buildGameService> =
        buildGameService();
      const answers: FullGuessObject[] = [
        buildFullGuessObject({ id: 'first' }),
        buildFullGuessObject({ id: 'second' }),
      ];
      const game: Game = buildGame({
        state: {
          guessObjectsIds: answers.map(({ id }) => id),
          guessObjects: answers,
          results: {},
          currentRound: { status, guessObjectId: answers[roundIndex].id },
        },
      });

      const publicGame: Game = gameService.toClientGame(game);

      expect(publicGame.state.guessObjects).toEqual(answers.slice(0, revealed));
      expect(publicGame.state.guessObjectPreviews).toHaveLength(2);
      expect(
        JSON.stringify(publicGame.state.guessObjectPreviews),
      ).not.toContain('world_location');
      expect(game.state.guessObjects).toHaveLength(2);
    },
  );

  it('withholds calculated distances and scores while other players are guessing', () => {
    const { gameService }: ReturnType<typeof buildGameService> =
      buildGameService();
    const game: Game = buildGame({
      state: {
        guessObjectsIds: ['object-1'],
        results: {},
        currentRound: {
          status: RoundStatus.GUESSING,
          guessObjectId: 'object-1',
          playersGuesses: { host: buildGuess({ points: 987, distance: 12 }) },
        },
      },
    });

    const publicGame: Game = gameService.toClientGame(game);

    expect(publicGame.state.currentRound?.playersGuesses).toEqual({
      host: defaultGuess,
    });
    expect(
      game.state.currentRound?.playersGuesses?.[PlayerIdSchema.parse('host')]
        .points,
    ).toBe(987);
  });
});

describe('GameService.resolveNextRound', () => {
  it('refuses to skip a round while players are guessing', () => {
    const { gameService }: ReturnType<typeof buildGameService> =
      buildGameService();
    const game: Game = buildGame({
      state: {
        guessObjectsIds: ['first', 'second'],
        results: {},
        currentRound: { status: RoundStatus.GUESSING, guessObjectId: 'first' },
      },
    });

    const next: ReturnType<GameService['resolveNextRound']> =
      gameService.resolveNextRound(game);

    expect(next).toEqual({ game, isGameOver: false });
  });

  it('assigns a fresh deadline when the next round begins', () => {
    const { gameService }: ReturnType<typeof buildGameService> =
      buildGameService();
    const game: Game = buildGame({
      config: buildGameConfig({ timer: 25 }),
      state: {
        guessObjectsIds: ['first', 'second'],
        results: {},
        currentRound: {
          status: RoundStatus.SHOWING_RESULTS,
          guessObjectId: 'first',
          deadline: 0,
        },
      },
    });
    jest.spyOn(Date, 'now').mockReturnValue(1000);

    const next: ReturnType<GameService['resolveNextRound']> =
      gameService.resolveNextRound(game);

    expect(next.game.state.currentRound).toMatchObject({
      status: RoundStatus.GUESSING,
      guessObjectId: 'second',
      deadline: 29000,
    });
  });
});
