import {
  type Game,
  type GameConfig,
  GameStatus,
  type Guess,
  type OnlinePlayer,
  type Player,
  type PlayerResults,
  SessionMode,
} from '@cityborn/api';
import {
  applyGuess,
  beginGame,
  resolveNextRound,
  toLightGame,
} from '@cityborn/core';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { EventService } from '../event/event.service';
import { createEvent } from '../event/event.types';
import { GuessObjectService } from '../guess-object/guess-object.service';
import { IdService } from '../id/id.service';
import { PrismaService } from '../prisma/prisma.service';

export type CreateGameParams = {
  gameConfig: GameConfig;
  players: Player[];
  mode: SessionMode;
  visitorId?: string;
  sessionId?: string;
};

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private readonly guessObjectService: GuessObjectService,
    private readonly prisma: PrismaService,
    private readonly eventService: EventService,
    private readonly idService: IdService,
    private readonly wideEventService: WideEventService,
  ) {}

  async createGame({
    gameConfig,
    players,
    mode,
    visitorId,
    sessionId,
  }: CreateGameParams): Promise<Game> {
    if (sessionId) {
      this.wideEventService.enrich({ sessionId });
    }
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
          {} satisfies Record<string, PlayerResults>,
        ),
        guessObjects: guessObjects,
      },
    };
    this.wideEventService.enrich({ gameId: game.id });

    if (visitorId) {
      await this.eventService.trackEvent(
        createEvent({
          name: 'game_started',
          visitorId,
          properties: {
            mode,
            categories: gameConfig.categories,
            numberOfPlayers:
              mode === SessionMode.SOLO
                ? players.length
                : (players as OnlinePlayer[]).filter(
                    (player) => player.connected,
                  ).length,
          },
        }),
      );
    }

    return game;
  }

  async endGame(
    game: Game,
    players: Player[],
    mode: SessionMode,
    visitorId?: string,
    sessionId?: string,
  ): Promise<void> {
    this.wideEventService.enrich({
      gameId: game.id,
      ...(sessionId ? { sessionId } : {}),
    });
    try {
      const game_record = await this.prisma.gameRecord.create({
        data: {
          mode,
          gameConfig: game.config as unknown as Prisma.InputJsonValue,
          players: players as unknown as Prisma.InputJsonValue,
          guessObjectsIds: game.state.guessObjectsIds,
          results: game.state.results as unknown as Prisma.InputJsonValue,
          users: {
            connect: players
              .filter((player) => !player.isGuest)
              .map((player) => ({ id: player.id })),
          },
        },
      });

      if (visitorId) {
        await this.eventService.trackEvent(
          createEvent({
            name: 'game_finished',
            visitorId,
            properties: {
              gameId: game_record.id.toString(),
              mode,
              numberOfPlayers: game.state.results
                ? Object.keys(game.state.results).length
                : 0,
              average_score: game.state.results
                ? Object.values(game.state.results)
                    .flatMap((res) => res.results)
                    .reduce((sum, r) => sum + r.points, 0) /
                  Object.values(game.state.results).flatMap(
                    (res) => res.results,
                  ).length
                : 0,
            },
          }),
        );
      }
    } catch (error) {
      this.logger.error(`Error storing game in db: ${error}`);
    }
  }

  beginGame(game: Game): Game {
    return beginGame(game);
  }

  applyGuess(
    game: Game,
    playerID: string,
    guess: Guess,
    connectedPlayerUsernames: string[],
  ): Game {
    return applyGuess(game, playerID, guess, connectedPlayerUsernames);
  }

  resolveNextRound(game: Game): { game: Game; isGameOver: boolean } {
    return resolveNextRound(game);
  }

  toLightGame(game: Game): Game {
    return toLightGame(game);
  }

  private async generateUniqueGameID(): Promise<string> {
    const candidateId = this.idService.generateUniqueNamesId();
    return candidateId.toString(); // TODO Check in supabase and redis for conflicts
  }
}
