import type {
  FullGuessObject,
  Game,
  GameConfig,
  GameConfigPack,
  OnlinePlayer,
  Pack,
  PlayerId,
} from '@cityborn/api';
import {
  buildFullGuessObject,
  buildGame,
  buildGameConfig,
  buildGameState,
  buildGuess,
  buildPack,
  buildPlayer,
  buildRound,
  buildWorldLocation,
  defaultGuess,
  ErrorCode,
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
import type { PackService } from '../pack/pack.service';
import type { CreateGameParams } from './game.service';
import { GameService } from './game.service';

function buildGameService() {
  const guessObjectService: DeepMocked<GuessObjectService> =
    createMock<GuessObjectService>();
  const gameRecordService: DeepMocked<GameRecordService> =
    createMock<GameRecordService>();
  const eventService: DeepMocked<EventService> = createMock<EventService>();
  const idService: DeepMocked<IdService> = createMock<IdService>();
  const packService: DeepMocked<PackService> = createMock<PackService>();
  const gameService: GameService = new GameService(
    guessObjectService,
    gameRecordService,
    eventService,
    idService,
    packService,
  );

  return {
    gameService,
    guessObjectService,
    gameRecordService,
    eventService,
    idService,
    packService,
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
    const gameConfig: GameConfig = buildGameConfig({ packs: [buildPack()] });
    const createGameData: CreateGameParams = {
      gameConfig,
      players,
      mode: SessionMode.MULTI,
      quickPlay: false,
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
    expect(game.state.roundGuessObjects).toEqual([
      {
        id: guessObject.id,
        name: guessObject.name,
        image: guessObject.image,
        description: guessObject.description,
        short_description: guessObject.short_description,
      },
    ]);
    expect(eventService.trackEvent).toHaveBeenCalledWith({
      name: 'game_started',
      visitorId: 'visitor-1',
      properties: {
        mode: SessionMode.MULTI,
        quickPlay: false,
        packs: gameConfig.packs,
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
    const gameConfig: GameConfig = buildGameConfig({ packs: [buildPack()] });
    const player: OnlinePlayer = buildPlayer();
    const createGameData: CreateGameParams = {
      gameConfig,
      players: [player],
      mode: SessionMode.SOLO,
      quickPlay: false,
    };

    await gameService.createGame(createGameData);

    expect(eventService.trackEvent).not.toHaveBeenCalled();
  });

  it('plays every published pack when the config has no pack', async () => {
    const {
      gameService,
      guessObjectService,
      eventService,
      idService,
      packService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    const publishedPacks: Pack[] = [
      buildPack({ id: 'pack-1', name: 'Monuments' }),
      buildPack({ id: 'pack-2', name: 'Sportifs' }),
    ];
    const playedPacks: GameConfigPack[] = publishedPacks.map(
      ({ id, name, isPublished }: Pack) => ({ id, name, isPublished }),
    );
    packService.findPublished.mockResolvedValue(publishedPacks);
    guessObjectService.findShuffledGuessObjectsByGameConfig.mockResolvedValue(
      [],
    );
    idService.generateUniqueNamesId.mockReturnValue('game-id');
    const createGameData: CreateGameParams = {
      gameConfig: buildGameConfig(),
      players: [buildPlayer()],
      mode: SessionMode.SOLO,
      quickPlay: true,
      visitorId: 'visitor-1',
    };

    const game: Game = await gameService.createGame(createGameData);

    expect(game.config.packs).toEqual(playedPacks);
    expect(
      guessObjectService.findShuffledGuessObjectsByGameConfig,
    ).toHaveBeenCalledWith(expect.objectContaining({ packs: playedPacks }));
    expect(eventService.trackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'game_started',
        properties: expect.objectContaining({
          quickPlay: true,
          packs: playedPacks,
        }),
      }),
    );
  });

  it('rejects a game without pack when no pack is published', async () => {
    const {
      gameService,
      guessObjectService,
      packService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    packService.findPublished.mockResolvedValue([]);
    const createGameData: CreateGameParams = {
      gameConfig: buildGameConfig(),
      players: [buildPlayer()],
      mode: SessionMode.SOLO,
      quickPlay: true,
    };

    const creation: Promise<Game> = gameService.createGame(createGameData);

    await expect(creation).rejects.toMatchObject({
      response: { code: ErrorCode.GAME_NO_PUBLISHED_PACK },
    });
    expect(
      guessObjectService.findShuffledGuessObjectsByGameConfig,
    ).not.toHaveBeenCalled();
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

    await gameService.endGame({
      game,
      players,
      mode: SessionMode.MULTI,
      quickPlay: false,
      visitorId: 'visitor-1',
    });

    expect(gameRecordService.create).toHaveBeenCalledWith(
      expect.objectContaining({ mode: SessionMode.MULTI }),
      [{ id: 'user-1' }],
    );
    expect(eventService.trackEvent).toHaveBeenCalledWith({
      name: 'game_finished',
      visitorId: 'visitor-1',
      properties: {
        gameId: 'game-record-1',
        mode: SessionMode.MULTI,
        quickPlay: false,
        numberOfPlayers: 2,
        average_score: 60,
      },
    });
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

    await gameService.endGame({
      game,
      players,
      mode: SessionMode.SOLO,
      quickPlay: false,
      visitorId: 'visitor-1',
    });

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

    await gameService.endGame({
      game,
      players,
      mode: SessionMode.SOLO,
      quickPlay: false,
    });

    expect(eventService.trackEvent).not.toHaveBeenCalled();
  });
});

describe('GameService.applyGuess', () => {
  const alice: PlayerId = PlayerIdSchema.parse('alice');
  const bob: PlayerId = PlayerIdSchema.parse('bob');
  const guessObjectBornInParis: FullGuessObject = buildFullGuessObject({
    id: 'object-1',
    world_location: buildWorldLocation({
      centroid: [48.85, 2.35],
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [2.2, 48.8],
            [2.5, 48.8],
            [2.5, 48.9],
            [2.2, 48.9],
            [2.2, 48.8],
          ],
        ],
      },
    }),
  });

  const {
    world_location,
    source,
    ...hiddenGuessObjectBornInParis
  }: FullGuessObject = guessObjectBornInParis;

  function buildGuessingGame(): Game {
    return buildGame({
      state: buildGameState({
        guessObjectsIds: ['object-1'],
        results: { alice: { results: [] }, bob: { results: [] } },
        roundGuessObjects: [hiddenGuessObjectBornInParis],
        currentRound: buildRound({
          guessObjectId: 'object-1',
          playersGuesses: {},
        }),
      }),
    });
  }

  it('scores the coordinates against the guess object of the current round', async () => {
    const {
      gameService,
      guessObjectService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    guessObjectService.findFullBy.mockResolvedValue([guessObjectBornInParis]);

    const game: Game = await gameService.applyGuess({
      game: buildGuessingGame(),
      playerID: alice,
      coordinates: { lat: 48.86, lng: 2.3 },
      connectedPlayerIDs: [alice, bob],
    });

    expect(guessObjectService.findFullBy).toHaveBeenCalledWith({
      ids: ['object-1'],
    });
    expect(game.state.currentRound?.playersGuesses).toEqual({
      alice: {
        coordinates: { lat: 48.86, lng: 2.3 },
        distance: 0,
        points: 1000,
        win: true,
      },
    });
    expect(game.state.roundGuessObjects).toEqual([
      hiddenGuessObjectBornInParis,
    ]);
  });

  it('records a guess without coordinates as the default guess', async () => {
    const {
      gameService,
      guessObjectService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    guessObjectService.findFullBy.mockResolvedValue([guessObjectBornInParis]);

    const game: Game = await gameService.applyGuess({
      game: buildGuessingGame(),
      playerID: alice,
      coordinates: undefined,
      connectedPlayerIDs: [alice, bob],
    });

    expect(game.state.currentRound?.playersGuesses).toEqual({
      alice: defaultGuess,
    });
  });

  it('reveals the guess object when the last connected player guesses', async () => {
    const {
      gameService,
      guessObjectService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    guessObjectService.findFullBy.mockResolvedValue([guessObjectBornInParis]);
    const guessingGame: Game = buildGuessingGame();
    const gameWithAliceGuess: Game = buildGame({
      ...guessingGame,
      state: buildGameState({
        ...guessingGame.state,
        currentRound: buildRound({
          guessObjectId: 'object-1',
          playersGuesses: { alice: buildGuess() },
        }),
      }),
    });

    const game: Game = await gameService.applyGuess({
      game: gameWithAliceGuess,
      playerID: bob,
      coordinates: undefined,
      connectedPlayerIDs: [alice, bob],
    });

    expect(game.state.currentRound?.status).toBe(RoundStatus.SHOWING_RESULTS);
    expect(game.state.roundGuessObjects).toEqual([guessObjectBornInParis]);
  });

  it('rejects a guess when the guess object of the round no longer exists', async () => {
    const {
      gameService,
      guessObjectService,
    }: ReturnType<typeof buildGameService> = buildGameService();
    guessObjectService.findFullBy.mockResolvedValue([]);

    await expect(
      gameService.applyGuess({
        game: buildGuessingGame(),
        playerID: alice,
        coordinates: { lat: 48.86, lng: 2.3 },
        connectedPlayerIDs: [alice, bob],
      }),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.GUESS_OBJECTS_NOT_FOUND },
    });
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
