import { contract, ErrorCode, type Session, User } from '@cityborn/api';
import { Controller, UnauthorizedException, UseGuards } from '@nestjs/common';
import { initContract } from '@ts-rest/core';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { VisitorId } from '../common/decorators/visitor-id.decorator';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { GameService } from '../game/game.service';
import { CurrentUser } from '../user/user.decorator';
import { SessionService } from './session.service';

const c = initContract(); // TODO delete to use only shared contract

const publicSessionRoutes = c.router({
  getSession: contract.session.getSession,
});

const optionalAuthSessionRoutes = c.router({
  createSession: contract.session.createSession,
  createGame: contract.session.createGame,
  finalizeGame: contract.session.finalizeGame,
  endSoloGame: contract.session.endSoloGame,
});
@Controller()
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly gameService: GameService,
    private readonly wideEventService: WideEventService,
  ) {}

  @TsRestHandler(publicSessionRoutes)
  async handler() {
    return tsRestHandler(publicSessionRoutes, {
      getSession: async ({ params }) => {
        this.wideEventService.enrich({ sessionId: params.id });
        return {
          status: 200 as const,
          body: await this.sessionService.getById(params.id),
        };
      },
    });
  }

  @TsRestHandler(optionalAuthSessionRoutes)
  @UseGuards(OptionalAuthGuard)
  async optionalAuthHandler(
    @CurrentUser() user?: User,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(optionalAuthSessionRoutes, {
      createSession: async ({ body }) => {
        if (body.mode === 'multi' && !user)
          throw new UnauthorizedException({
            code: ErrorCode.USER_NO_ACCOUNT_OR_NOT_VERIFIED,
            message: 'User does not have an account or is not verified',
          });
        const session = await this.sessionService.create(body, user, visitorId);
        this.wideEventService.enrich({ sessionId: session.id });
        return {
          status: 201 as const,
          body: session,
        };
      },
      createGame: async ({ body: session }) => {
        this.wideEventService.enrich({ sessionId: session.id });
        const game = await this.gameService.createGame({
          gameConfig: session.gameConfig,
          players: session.players,
          mode: session.mode,
          visitorId,
        });
        this.wideEventService.enrich({ gameId: game.id });
        return { status: 200 as const, body: game };
      },
      finalizeGame: async ({ body: session }) => {
        await this.finalizeGame(session, visitorId);
        return { status: 200 as const, body: {} };
      },
      // @deprecated kept for older mobile builds still calling this route; use finalizeGame.
      endSoloGame: async ({ body: session }) => {
        await this.finalizeGame(session, visitorId);
        return { status: 200 as const, body: {} };
      },
    });
  }

  private async finalizeGame(
    session: Session & { currentGame: NonNullable<Session['currentGame']> },
    visitorId?: string,
  ): Promise<void> {
    this.wideEventService.enrich({
      sessionId: session.id,
      gameId: session.currentGame.id,
    });
    await this.gameService.endGame(
      session.currentGame,
      session.players,
      session.mode,
      visitorId,
    );
  }
}
