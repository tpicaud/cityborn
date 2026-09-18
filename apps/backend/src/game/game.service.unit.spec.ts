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
  buildPlayer,
  GameRecordIdSchema,
  GameStatus,
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
      buildPlayer('host'),
      buildPlayer('bob', false),
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
        categories: [],
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
      buildPlayer('host', true, { id: 'user-1' }),
      buildPlayer('guest', true, { isGuest: true }),
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
    it('begins a game through core rules', () => {
      const { gameService }: ReturnType<typeof buildGameService> =
        buildGameService();
      const game: Game = buildGame({
        status: GameStatus.STARTING,
        state: {
          guessObjectsIds: [],
          results: {},
          guessObjects: [],
        },
      });

      const started: Game = gameService.beginGame(game);

      expect(started.status).toBe(GameStatus.IN_GAME);
    });
  });

  describe('toLightGame', () => {
    it('lightens a game through core rules', () => {
      const { gameService }: ReturnType<typeof buildGameService> =
        buildGameService();
      const game: Game = buildGame({
        status: GameStatus.IN_GAME,
        state: {
          guessObjectsIds: [],
          results: {},
          guessObjects: [],
        },
      });

      const light: Game = gameService.toLightGame(game);

      expect(light.state.guessObjects).toBeUndefined();
    });
  });
});
