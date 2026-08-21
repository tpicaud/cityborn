import {
  type Game,
  GameStatus,
  type OnlinePlayer,
  type PlayerResults,
  type Session,
  SessionMode,
} from '@cityborn/api';
import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { EventService } from '../event/event.service';
import { createEvent } from '../event/event.types';
import { GuessObjectService } from '../guess-object/guess-object.service';
import { IdService } from '../id/id.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GameService {
  private readonly logger = new Logger(GameService.name);

  constructor(
    private readonly guessObjectService: GuessObjectService,
    private readonly prisma: PrismaService,
    private readonly eventService: EventService,
    private readonly idService: IdService,
  ) {}

  async createGame(session: Session, visitorId?: string): Promise<Game> {
    const guessObjects =
      await this.guessObjectService.findShuffledGuessObjectsByGameConfig(
        session.gameConfig,
      );
    const guessObjectIds = guessObjects.map((obj) => obj.id);

    const game: Game = {
      id: await this.generateUniqueGameID(),
      config: session.gameConfig,
      status: GameStatus.STARTING,
      state: {
        guessObjectsIds: guessObjectIds,
        results: session.players.reduce(
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
            mode: session.mode,
            categories: session.gameConfig.categories,
            numberOfPlayers:
              session.mode === SessionMode.SOLO
                ? session.players.length
                : (session.players as OnlinePlayer[]).filter(
                    (player) => player.connected,
                  ).length,
          },
        }),
      );
    }

    return game;
  }

  async endGame(
    session: Session,
    game: Game,
    visitorId?: string,
  ): Promise<void> {
    try {
      const game_record = await this.prisma.gameRecord.create({
        data: {
          mode: session.mode,
          gameConfig: session.gameConfig as unknown as Prisma.InputJsonValue,
          players: session.players as unknown as Prisma.InputJsonValue,
          guessObjectsIds: game.state.guessObjectsIds,
          results: game.state.results as unknown as Prisma.InputJsonValue,
          users: {
            connect: session.players
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
              mode: session.mode,
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

  async endSoloGame(sessionDto: Session, visitorId?: string) {
    if (!sessionDto.currentGame) return;
    await this.endGame(sessionDto, sessionDto.currentGame, visitorId);
  }

  private async generateUniqueGameID(): Promise<string> {
    const candidateId = this.idService.generateUniqueNamesId();
    return candidateId.toString(); // TODO Check in supabase and redis for conflicts
  }
}
