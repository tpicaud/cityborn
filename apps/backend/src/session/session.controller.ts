import { contract, ErrorCode, User } from '@cityborn/api';
import { Controller, UnauthorizedException, UseGuards } from '@nestjs/common';
import { initContract } from '@ts-rest/core';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { OptionalAuthGuard } from '../auth/guards/optional-auth.guard';
import { VisitorId } from '../common/decorators/visitor-id.decorator';
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
  endSoloGame: contract.session.endSoloGame,
});
@Controller()
export class SessionController {
  constructor(
    private readonly sessionService: SessionService,
    private readonly gameService: GameService,
  ) {}

  @TsRestHandler(publicSessionRoutes)
  async handler() {
    return tsRestHandler(publicSessionRoutes, {
      getSession: async ({ params }) => ({
        status: 200 as const,
        body: await this.sessionService.getById(params.id),
      }),
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
        return {
          status: 201 as const,
          body: await this.sessionService.create(body, user, visitorId),
        };
      },
      createGame: async ({ body }) => ({
        status: 200 as const,
        body: await this.gameService.createGame(body, visitorId),
      }),
      endSoloGame: async ({ body }) => {
        await this.gameService.endSoloGame(body, visitorId);
        return { status: 200 as const, body: {} };
      },
    });
  }
}
