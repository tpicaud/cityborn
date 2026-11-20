import {
  type Coord,
  defaultGuess,
  ErrorCode,
  type FullGuessObject,
  type Game,
  type GameConfig,
  type GameConfigPack,
  type GameId,
  GameIdSchema,
  GameStatus,
  type Guess,
  type GuessObjectId,
  type Pack,
  type PlayerId,
  type PlayerResults,
  type Round,
  RoundStatus,
  SessionMode,
  type SessionPlayer,
} from '@cityborn/api';
import {
  applyGuess,
  beginGame,
  createGuess,
  currentRoundIndex,
  hideGuessingRoundGuesses,
  playerScore,
  removePlayer,
  resolveNextRound,
  revealGuessObject,
  roundGuessObjectIds,
  toLightGame,
} from '@cityborn/core';
import { Injectable, NotFoundException } from '@nestjs/common';
import { EventService } from '../event/event.service';
import { createEvent } from '../event/event.types';
import { GameRecordService } from '../game-record/game-record.service';
import { GuessObjectService } from '../guess-object/guess-object.service';
import { IdService } from '../id/id.service';
import { PackService } from '../pack/pack.service';

export type CreateGameParams = {
  gameConfig: GameConfig;
  players: SessionPlayer[];
  mode: SessionMode;
  quickPlay: boolean;
  visitorId?: string;
};

function isRoundRevealed({
  previousGame,
  game,
}: {
  previousGame: Game;
  game: Game;
}): boolean {
  return (
    previousGame.state.currentRound?.status === RoundStatus.GUESSING &&
    game.state.currentRound?.status === RoundStatus.SHOWING_RESULTS
  );
}

@Injectable()
export class GameService {
  constructor(
    private readonly guessObjectService: GuessObjectService,
    private readonly gameRecordService: GameRecordService,
    private readonly eventService: EventService,
    private readonly idService: IdService,
    private readonly packService: PackService,
  ) {}

  async createGame({
    gameConfig,
    players,
    mode,
    quickPlay,
    visitorId,
  }: CreateGameParams): Promise<Game> {
    const playedConfig: GameConfig = await this.resolvePlayedPacks(gameConfig);
    const guessObjects =
      await this.guessObjectService.findShuffledGuessObjectsByGameConfig(
        playedConfig,
      );
    const guessObjectIds = guessObjects.map((obj) => obj.id);

    const game: Game = {
      id: await this.generateUniqueGameID(),
      config: playedConfig,
      status: GameStatus.STARTING,
      state: {
        guessObjectsIds: guessObjectIds,
        results: players.reduce(
          (acc, player) => {
            acc[player.username] = { results: [] };
            return acc;
          },
          {} satisfies Record<PlayerId, PlayerResults>,
        ),
        guessObjects: guessObjects,
        roundGuessObjects: guessObjects.map(
          ({ world_location, source, ...roundGuessObject }) => roundGuessObject,
        ),
      },
    };

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'game_started',
          visitorId,
          properties: {
            mode,
            quickPlay,
            packs: playedConfig.packs,
            numberOfPlayers:
              mode === SessionMode.SOLO
                ? players.length
                : players.filter((player) => player.connected).length,
          },
        }),
      );
    }

    return game;
  }

  async endGame({
    game,
    players,
    mode,
    quickPlay,
    visitorId,
  }: {
    game: Game;
    players: SessionPlayer[];
    mode: SessionMode;
    quickPlay: boolean;
    visitorId?: string;
  }): Promise<void> {
    const gameRecord = await this.gameRecordService.create(
      {
        mode,
        gameConfig: game.config,
        players,
        guessObjectsIds: roundGuessObjectIds(game),
        results: game.state.results,
      },
      players.flatMap((player) =>
        !player.isGuest && player.id ? [{ id: player.id }] : [],
      ),
    );

    if (visitorId) {
      const roundResults = Object.values(game.state.results).flatMap(
        (playerResults) => playerResults.results,
      );
      const averageScore =
        roundResults.length > 0
          ? roundResults.reduce((sum, result) => sum + result.points, 0) /
            roundResults.length
          : 0;

      await this.eventService.trackEvent(
        createEvent({
          name: 'game_finished',
          visitorId,
          properties: {
            gameId: gameRecord.id.toString(),
            mode,
            quickPlay,
            numberOfPlayers: Object.keys(game.state.results).length,
            average_score: averageScore,
          },
        }),
      );
    }
  }

  beginGame(game: Game): Game {
    return beginGame(game);
  }

  async applyGuess({
    game,
    playerID,
    coordinates,
    connectedPlayerIDs,
  }: {
    game: Game;
    playerID: PlayerId;
    coordinates: Coord | undefined;
    connectedPlayerIDs: PlayerId[];
  }): Promise<Game> {
    const currentRound: Round | undefined = game.state.currentRound;
    if (!currentRound) return game;

    const guessObject: FullGuessObject = await this.findRoundGuessObject(
      currentRound.guessObjectId,
    );
    const guess: Guess = coordinates
      ? createGuess(guessObject, coordinates)
      : defaultGuess;
    const guessedGame: Game = applyGuess(
      game,
      playerID,
      guess,
      connectedPlayerIDs,
    );

    return isRoundRevealed({ previousGame: game, game: guessedGame })
      ? revealGuessObject({ game: guessedGame, guessObject })
      : guessedGame;
  }

  async abandonGame({
    game,
    playerID,
    connectedPlayerIDs,
    mode,
    quickPlay,
    visitorId,
  }: {
    game: Game;
    playerID: PlayerId;
    connectedPlayerIDs: PlayerId[];
    mode: SessionMode;
    quickPlay: boolean;
    visitorId?: string;
  }): Promise<Game> {
    const remainingGame: Game = removePlayer({
      game,
      playerID,
      connectedPlayerIDs,
    });
    const currentRound: Round | undefined = remainingGame.state.currentRound;
    const abandonedGame: Game =
      currentRound &&
      isRoundRevealed({ previousGame: game, game: remainingGame })
        ? revealGuessObject({
            game: remainingGame,
            guessObject: await this.findRoundGuessObject(
              currentRound.guessObjectId,
            ),
          })
        : remainingGame;

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'game_abandoned',
          visitorId,
          properties: {
            gameId: game.id,
            mode,
            quickPlay,
            round: currentRoundIndex(game) + 1,
            score: playerScore({ game, playerID }),
          },
        }),
      );
    }

    return abandonedGame;
  }

  hideGuessingRoundGuesses(game: Game): Game {
    return hideGuessingRoundGuesses(game);
  }

  resolveNextRound(game: Game): { game: Game; isGameOver: boolean } {
    return resolveNextRound(game);
  }

  toLightGame(game: Game): Game {
    return toLightGame(game);
  }

  private async resolvePlayedPacks(
    gameConfig: GameConfig,
  ): Promise<GameConfig> {
    if (gameConfig.packs.length > 0) return gameConfig;
    const accessiblePacks: Pack[] = await this.packService.findPublished();
    if (accessiblePacks.length === 0)
      throw new NotFoundException({
        code: ErrorCode.GAME_NO_PUBLISHED_PACK,
        message: 'No published pack to draw the game from',
      });
    const packs: GameConfigPack[] = accessiblePacks.map(
      ({ themeId, image, ...pack }) => pack,
    );
    return { ...gameConfig, packs };
  }

  private async findRoundGuessObject(
    guessObjectId: GuessObjectId,
  ): Promise<FullGuessObject> {
    const [guessObject]: FullGuessObject[] =
      await this.guessObjectService.findFullBy({ ids: [guessObjectId] });
    if (!guessObject) {
      throw new NotFoundException({
        code: ErrorCode.GUESS_OBJECTS_NOT_FOUND,
        message: 'Guess object of the current round not found',
      });
    }
    return guessObject;
  }

  private async generateUniqueGameID(): Promise<GameId> {
    const candidateId = this.idService.generateUniqueNamesId();
    return GameIdSchema.parse(candidateId); // TODO Check in supabase and redis for conflicts
  }
}
