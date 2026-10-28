import {
  ErrorCode,
  type Game,
  type Guess,
  GuessObjectIdSchema,
  type GuessSubmission,
  type PlayerId,
  type Session,
  SessionSchema,
} from '@cityborn/api';
import { applyGuess } from '@cityborn/core';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { z } from 'zod';
import { GameService } from '../game/game.service';

export const SessionStateSchema = SessionSchema.extend({
  scoringMode: z.enum(['legacy', 'server']).default('legacy'),
  publicGuessObjectIds: z.array(GuessObjectIdSchema).optional(),
});

export type SessionState = z.infer<typeof SessionStateSchema>;

export type SessionGuess =
  | { mode: 'legacy'; guess: Guess }
  | { mode: 'server'; guess: GuessSubmission };

@Injectable()
export class SessionGameProtocol {
  constructor(private readonly gameService: GameService) {}

  modeForVersion(
    clientApiVersion: number | undefined,
  ): SessionState['scoringMode'] {
    return clientApiVersion !== undefined && clientApiVersion >= 7
      ? 'server'
      : 'legacy';
  }

  assertClientCompatibility({
    session,
    clientApiVersion,
  }: {
    session: SessionState;
    clientApiVersion: number | undefined;
  }): void {
    if (session.scoringMode === this.modeForVersion(clientApiVersion)) return;
    this.rejectIncompatibleProtocol();
  }

  applyGuess({
    session,
    game,
    playerID,
    submission,
    connectedPlayerIds,
    receivedAt,
  }: {
    session: SessionState;
    game: Game;
    playerID: PlayerId;
    submission: SessionGuess;
    connectedPlayerIds: PlayerId[];
    receivedAt: number;
  }): Game {
    if (session.scoringMode !== submission.mode)
      this.rejectIncompatibleProtocol();

    return submission.mode === 'server'
      ? this.gameService.applyGuess({
          game,
          playerID,
          submission: submission.guess,
          connectedPlayerIds,
          receivedAt,
        })
      : applyGuess(game, playerID, submission.guess, connectedPlayerIds);
  }

  async restoreLegacyGame(session: SessionState): Promise<SessionState> {
    if (
      session.scoringMode === 'legacy' &&
      session.currentGame &&
      !session.currentGame.state.guessObjects
    ) {
      session.currentGame = await this.gameService.restoreGuessObjects(
        session.currentGame,
      );
    }
    return session;
  }

  toClientSession(session: SessionState): Session {
    const {
      scoringMode,
      publicGuessObjectIds,
      ...publicSession
    }: SessionState = session;
    let projectedGame: Game | undefined = session.currentGame;
    if (scoringMode === 'server' && projectedGame) {
      if (!publicGuessObjectIds)
        throw new InternalServerErrorException({
          code: ErrorCode.UNKNOWN_ERROR,
          message: 'Modern game has no public answer IDs',
        });
      projectedGame = this.gameService.toClientGame({
        game: projectedGame,
        publicGuessObjectIds,
      });
    }
    return {
      ...publicSession,
      serverTime: Date.now(),
      currentGame: projectedGame,
    };
  }

  private rejectIncompatibleProtocol(): never {
    throw new BadRequestException({
      code: ErrorCode.BAD_REQUEST,
      message:
        'Cette session nécessite une version compatible du jeu. Créez une nouvelle session.',
    });
  }
}
