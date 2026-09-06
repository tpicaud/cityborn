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
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
};

@Injectable()
export class GameService {
  constructor(
    private readonly guessObjectService: GuessObjectService,
    private readonly prisma: PrismaService,
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
          {} satisfies Record<string, PlayerResults>,
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
  ): Promise<void> {
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
            gameId: game_record.id.toString(),
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
