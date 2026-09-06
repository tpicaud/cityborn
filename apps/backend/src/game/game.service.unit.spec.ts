import {
  buildFullGuessObject,
  buildGame,
  buildGameConfig,
  buildPlayer,
  GameStatus,
  SessionMode,
} from '@cityborn/api';
import { createMock } from '../../test/support/createMock';
import { buildPrismaGameRecord } from '../../test/support/fixtures';
import type { EventService } from '../event/event.service';
import type { GuessObjectService } from '../guess-object/guess-object.service';
import type { IdService } from '../id/id.service';
import type { PrismaService } from '../prisma/prisma.service';
import { GameService } from './game.service';

function buildGameService() {
  const guessObjectService = createMock<GuessObjectService>();
  const prismaService = createMock<PrismaService>();
  const eventService = createMock<EventService>();
  const idService = createMock<IdService>();
  const gameService = new GameService(
    guessObjectService,
    prismaService,
    eventService,
    idService,
  );

  return {
    gameService,
    guessObjectService,
    prismaService,
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
    guessObjectService.findShuffledGuessObjectsByGameConfig.mockResolvedValue([
      guessObject,
    ]);
    idService.generateUniqueNamesId.mockReturnValue('game-readable-id');

    const game = await gameService.createGame({
      gameConfig: buildGameConfig(),
      players,
      mode: SessionMode.MULTI,
      visitorId: 'visitor-1',
    });

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

    await gameService.createGame({
      gameConfig: buildGameConfig(),
      players: [buildPlayer()],
      mode: SessionMode.SOLO,
    });

    expect(eventService.trackEvent).not.toHaveBeenCalled();
  });
});

describe('GameService.endGame', () => {
  it('persists only registered users and tracks the average score', async () => {
    const { gameService, prismaService, eventService } = buildGameService();
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
    prismaService.gameRecord.create.mockResolvedValue(buildPrismaGameRecord());

    await gameService.endGame(game, players, SessionMode.MULTI, 'visitor-1');

    expect(prismaService.gameRecord.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          users: { connect: [{ id: 'user-1' }] },
        }),
      }),
    );
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({ average_score: 60 }),
      }),
    );
  });

  it('tracks a zero average when no round result exists', async () => {
    const { gameService, prismaService, eventService } = buildGameService();
    const game = buildGame({
      state: {
        guessObjectsIds: [],
        results: { host: { results: [] } },
      },
    });
    prismaService.gameRecord.create.mockResolvedValue(buildPrismaGameRecord());

    await gameService.endGame(
      game,
      [buildPlayer()],
      SessionMode.SOLO,
      'visitor-1',
    );

    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: expect.objectContaining({ average_score: 0 }),
      }),
    );
  });

  it('does not track an anonymous finished game', async () => {
    const { gameService, prismaService, eventService } = buildGameService();
    prismaService.gameRecord.create.mockResolvedValue(buildPrismaGameRecord());

    await gameService.endGame(buildGame(), [buildPlayer()], SessionMode.SOLO);

    expect(eventService.trackEvent).not.toHaveBeenCalled();
  });
});

describe('GameService core transitions', () => {
  it('begins and lightens a game through core rules', () => {
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
    const light = gameService.toLightGame(started);

    expect(started.status).toBe(GameStatus.IN_GAME);
    expect(light.state.guessObjects).toBeUndefined();
  });
});
