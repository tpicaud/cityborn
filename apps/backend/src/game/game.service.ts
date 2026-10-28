import {
  BaseGuessObjectSchema,
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
  type GuessSubmission,
  type PlayerId,
  PlayerIdSchema,
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
  resolveNextRound,
  roundCountdownInMilliseconds,
} from '@cityborn/core';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
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

const roundNetworkToleranceMs: number = 1000;

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
        guessObjectsIds: game.state.guessObjectsIds,
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
    return this.withRoundDeadline(beginGame(game));
  }

  applyGuess({
    game,
    playerID,
    submission,
    connectedPlayerIds,
    receivedAt,
  }: {
    game: Game;
    playerID: PlayerId;
    submission: GuessSubmission;
    connectedPlayerIds: PlayerId[];
    receivedAt: number;
  }): Game {
    const round: Round | undefined = game.state.currentRound;
    if (
      game.status !== GameStatus.IN_GAME ||
      round?.status !== RoundStatus.GUESSING
    )
      return game;
    const guessObject: FullGuessObject | undefined =
      game.state.guessObjects?.find(({ id }) => id === round.guessObjectId);
    const guess: Guess =
      submission.coordinates &&
      guessObject &&
      round.deadline !== undefined &&
      receivedAt <= round.deadline + roundNetworkToleranceMs
        ? createGuess(guessObject, submission.coordinates)
        : defaultGuess;
    return applyGuess(game, playerID, guess, connectedPlayerIds);
  }

  expireRound({ game, now }: { game: Game; now: number }): Game {
    const round: Round | undefined = game.state.currentRound;
    if (
      game.status !== GameStatus.IN_GAME ||
      round?.status !== RoundStatus.GUESSING ||
      round.deadline === undefined ||
      now <= round.deadline + roundNetworkToleranceMs
    )
      return game;

    const playerIds: PlayerId[] = Object.keys(game.state.results).map((id) =>
      PlayerIdSchema.parse(id),
    );
    return playerIds.reduce(
      (currentGame, playerId) =>
        applyGuess(currentGame, playerId, defaultGuess, playerIds),
      game,
    );
  }

  resolveNextRound(game: Game): { game: Game; isGameOver: boolean } {
    if (game.state.currentRound?.status !== RoundStatus.SHOWING_RESULTS)
      return { game, isGameOver: false };
    const next: { game: Game; isGameOver: boolean } = resolveNextRound(game);
    return next.isGameOver
      ? next
      : { ...next, game: this.withRoundDeadline(next.game) };
  }

  async restoreGuessObjects(game: Game): Promise<Game> {
    if (game.state.guessObjects) return game;
    const objects: FullGuessObject[] = await this.guessObjectService.findFullBy(
      {
        ids: game.state.guessObjectsIds,
      },
    );
    return {
      ...game,
      state: {
        ...game.state,
        guessObjects: game.state.guessObjectsIds.flatMap((id) =>
          objects.filter((object) => object.id === id),
        ),
      },
    };
  }

  toClientGame({
    game,
    publicGuessObjectIds,
  }: {
    game: Game;
    publicGuessObjectIds: GuessObjectId[];
  }): Game {
    const round: Round | undefined = game.state.currentRound;
    const objects: FullGuessObject[] = game.state.guessObjects ?? [];
    const aliases: GuessObjectId[] = publicGuessObjectIds;
    if (
      aliases.length !== game.state.guessObjectsIds.length ||
      new Set(aliases).size !== aliases.length ||
      new Set(game.state.guessObjectsIds).size !==
        game.state.guessObjectsIds.length
    )
      throw new InternalServerErrorException({
        code: ErrorCode.UNKNOWN_ERROR,
        message: 'Invalid public answer ID mapping',
      });
    const aliasByAnswerId: Map<GuessObjectId, GuessObjectId> = new Map(
      game.state.guessObjectsIds.map((id, index) => [id, aliases[index]]),
    );
    const publicIdFor: (id: GuessObjectId) => GuessObjectId = (id) => {
      const alias: GuessObjectId | undefined = aliasByAnswerId.get(id);
      if (!alias)
        throw new InternalServerErrorException({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Missing public answer ID',
        });
      return alias;
    };
    const currentIndex: number = game.state.guessObjectsIds.indexOf(
      round?.guessObjectId ?? game.state.guessObjectsIds[0],
    );
    const revealedCount: number =
      game.status === GameStatus.IN_RESULTS
        ? objects.length
        : Math.max(
            0,
            currentIndex +
              (round?.status === RoundStatus.SHOWING_RESULTS ? 1 : 0),
          );
    const revealedIds: Set<GuessObjectId> = new Set(
      game.state.guessObjectsIds.slice(0, revealedCount),
    );
    return {
      ...game,
      state: {
        ...game.state,
        guessObjectsIds: aliases,
        guessObjectPreviews: objects.map((object) => ({
          ...BaseGuessObjectSchema.parse(object),
          id: publicIdFor(object.id),
        })),
        guessObjects: objects
          .filter(({ id }) => revealedIds.has(id))
          .map((object) => ({ ...object, id: publicIdFor(object.id) })),
        results: Object.fromEntries(
          Object.entries(game.state.results).map(
            ([playerId, playerResults]) => [
              playerId,
              {
                results: playerResults.results.map((result) => ({
                  ...result,
                  guessObjectId: publicIdFor(result.guessObjectId),
                })),
              },
            ],
          ),
        ),
        currentRound:
          round?.status === RoundStatus.GUESSING
            ? {
                ...round,
                guessObjectId: publicIdFor(round.guessObjectId),
                playersGuesses: Object.fromEntries(
                  Object.keys(round.playersGuesses ?? {}).map((playerID) => [
                    playerID,
                    defaultGuess,
                  ]),
                ),
              }
            : round && {
                ...round,
                guessObjectId: publicIdFor(round.guessObjectId),
              },
      },
    };
  }

  private withRoundDeadline(game: Game): Game {
    if (!game.state.currentRound) return game;
    return {
      ...game,
      state: {
        ...game.state,
        currentRound: {
          ...game.state.currentRound,
          deadline:
            Date.now() +
            roundCountdownInMilliseconds +
            game.config.timer * 1000,
        },
      },
    };
  }

  private async generateUniqueGameID(): Promise<GameId> {
    const candidateId = this.idService.generateUniqueNamesId();
    return GameIdSchema.parse(candidateId); // TODO Check in supabase and redis for conflicts
  }
}
