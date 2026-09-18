import {
  buildFullGuessObject,
  buildGame,
  buildGameConfig,
  buildPlayer,
  GameRecordIdSchema,
  GameStatus,
  SessionMode,
} from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import type { EventService } from '../event/event.service';
import type { GameRecordService } from '../game-record/game-record.service';
import type { GuessObjectService } from '../guess-object/guess-object.service';
import type { IdService } from '../id/id.service';
import { GameService } from './game.service';

function buildGameService() {
  const guessObjectService = createMock<GuessObjectService>();
  const gameRecordService = createMock<GameRecordService>();
  const eventService = createMock<EventService>();
  const idService = createMock<IdService>();
  const gameService = new GameService(
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
    const { gameService, guessObjectService, eventService, idService } =
      buildGameService();
    const guessObject = buildFullGuessObject();
    const players = [buildPlayer('host'), buildPlayer('bob', false)];
    const gameConfig = buildGameConfig();
    const createGameData = {
      gameConfig,
      players,
      mode: SessionMode.MULTI,
      visitorId: 'visitor-1',
    };
    guessObjectService.findShuffledGuessObjectsByGameConfig.mockResolvedValue([
      guessObject,
    ]);
    idService.generateUniqueNamesId.mockReturnValue('game-readable-id');

    const game = await gameService.createGame(createGameData);

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
    const { gameService, guessObjectService, eventService, idService } =
      buildGameService();
    guessObjectService.findShuffledGuessObjectsByGameConfig.mockResolvedValue(
      [],
    );
    idService.generateUniqueNamesId.mockReturnValue('game-id');
    const gameConfig = buildGameConfig();
    const player = buildPlayer();
    const createGameData = {
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
    const { gameService, gameRecordService, eventService } = buildGameService();
    const game = buildGame({
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
    const players = [
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
    const { gameService, gameRecordService, eventService } = buildGameService();
    const game = buildGame({
      state: {
        guessObjectsIds: [],
        results: { host: { results: [] } },
      },
    });
    const player = buildPlayer();
    const players = [player];
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
    const { gameService, gameRecordService, eventService } = buildGameService();
    const game = buildGame();
    const player = buildPlayer();
    const players = [player];
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
      const { gameService } = buildGameService();
      const game = buildGame({
        status: GameStatus.STARTING,
        state: {
          guessObjectsIds: [],
          results: {},
          guessObjects: [],
        },
      });

      const started = gameService.beginGame(game);

      expect(started.status).toBe(GameStatus.IN_GAME);
    });
  });

  describe('toLightGame', () => {
    it('lightens a game through core rules', () => {
      const { gameService } = buildGameService();
      const game = buildGame({
        status: GameStatus.IN_GAME,
        state: {
          guessObjectsIds: [],
          results: {},
          guessObjects: [],
        },
      });

      const light = gameService.toLightGame(game);

      expect(light.state.guessObjects).toBeUndefined();
    });
  });
});
