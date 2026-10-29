import {
  type Coord,
  defaultGuess,
  ErrorCode,
  type FullGuessObject,
  type Game,
  type GameConfig,
  type GameId,
  GameIdSchema,
  GameStatus,
  type Guess,
  type GuessObjectId,
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
  hideGuessingRoundGuesses,
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

export type CreateGameParams = {
  gameConfig: GameConfig;
  players: SessionPlayer[];
  mode: SessionMode;
  visitorId?: string;
};

@Injectable()
export class GameService {
  constructor(
    private readonly guessObjectService: GuessObjectService,
    private readonly gameRecordService: GameRecordService,
    private readonly eventService: EventService,
    private readonly idService: IdService,
  ) {}

  async createGame({
    gameConfig,
    players,
    mode,
    visitorId,
  }: CreateGameParams): Promise<Game> {
    const guessObjects =
      await this.guessObjectService.findShuffledGuessObjectsByGameConfig(
        gameConfig,
      );
    const guessObjectIds = guessObjects.map((obj) => obj.id);

    const game: Game = {
      id: await this.generateUniqueGameID(),
      config: gameConfig,
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
          ({ world_location, ...roundGuessObject }) => roundGuessObject,
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
            packs: gameConfig.packs,
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

  async endGame(
    game: Game,
    players: SessionPlayer[],
    mode: SessionMode,
    visitorId?: string,
  ): Promise<void> {
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

    const guessObject: FullGuessObject = await this.requireGuessObject(
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
    const isRoundRevealed: boolean =
      currentRound.status === RoundStatus.GUESSING &&
      guessedGame.state.currentRound?.status === RoundStatus.SHOWING_RESULTS;

    return isRoundRevealed
      ? revealGuessObject({ game: guessedGame, guessObject })
      : guessedGame;
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

  private async requireGuessObject(
    guessObjectId: GuessObjectId,
  ): Promise<FullGuessObject> {
    const [guessObject]: FullGuessObject[] =
      await this.guessObjectService.findFullBy({ ids: [guessObjectId] });
    if (guessObject) return guessObject;

    throw new NotFoundException({
      code: ErrorCode.GUESS_OBJECTS_NOT_FOUND,
      message: 'Guess object of the current round not found',
    });
  }

  private async generateUniqueGameID(): Promise<GameId> {
    const candidateId = this.idService.generateUniqueNamesId();
    return GameIdSchema.parse(candidateId); // TODO Check in supabase and redis for conflicts
  }
}
