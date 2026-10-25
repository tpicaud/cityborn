import {
  BaseGuessObjectSchema,
  defaultGuess,
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
} from '@cityborn/core';
import { Injectable } from '@nestjs/common';
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

const roundCountdownMs: number = 3000;
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

  resolveNextRound(game: Game): { game: Game; isGameOver: boolean } {
    if (game.state.currentRound?.status !== RoundStatus.SHOWING_RESULTS)
      return { game, isGameOver: false };
    const next: { game: Game; isGameOver: boolean } = resolveNextRound(game);
    return next.isGameOver
      ? next
      : { ...next, game: this.withRoundDeadline(next.game) };
  }

  toClientGame(game: Game): Game {
    const round: Round | undefined = game.state.currentRound;
    const objects: FullGuessObject[] = game.state.guessObjects ?? [];
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
        guessObjectPreviews: objects.map((object) =>
          BaseGuessObjectSchema.parse(object),
        ),
        guessObjects: objects.filter(({ id }) => revealedIds.has(id)),
        currentRound:
          round?.status === RoundStatus.GUESSING
            ? {
                ...round,
                playersGuesses: Object.fromEntries(
                  Object.keys(round.playersGuesses ?? {}).map((playerID) => [
                    playerID,
                    defaultGuess,
                  ]),
                ),
              }
            : round,
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
          deadline: Date.now() + roundCountdownMs + game.config.timer * 1000,
        },
      },
    };
  }

  private async generateUniqueGameID(): Promise<GameId> {
    const candidateId = this.idService.generateUniqueNamesId();
    return GameIdSchema.parse(candidateId); // TODO Check in supabase and redis for conflicts
  }
}
