import { contract } from '@cityborn/api';
import { ErrorCode } from '@cityborn/errors';
import type { Session, User } from '@cityborn/types';
import { Controller, UnauthorizedException, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { VisitorId } from 'src/common/decorators/visitor-id.decorator';
import { CurrentUser } from 'src/user/user.decorator';
import type { CreateSessionDto } from './dto/create-session.dto';
import type { SessionDto } from './dto/session.dto';
import { SessionService } from './session.service';

@Controller()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @TsRestHandler(contract.session.createSession)
  @UseGuards(OptionalAuthGuard)
  async createSession(
    @CurrentUser() user?: User,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(contract.session.createSession, async ({ body }) => {
      if (body.mode === 'multi' && !user)
        throw new UnauthorizedException({
          code: ErrorCode.USER_NO_ACCOUNT_OR_NOT_VERIFIED,
          message: 'User does not have an account or is not verified',
        });
      return {
        status: 201 as const,
        body: { session: await this.sessionService.create(body as unknown as CreateSessionDto, user, visitorId) },
      };
    });
  }

  @TsRestHandler(contract.session.getSession)
  async getSession() {
    return tsRestHandler(contract.session.getSession, async ({ params }) => {
      return {
        status: 200 as const,
        body: { session: await this.sessionService.getById(params.id) },
      };
    });
  }

  @TsRestHandler(contract.session.createGame)
  @UseGuards(OptionalAuthGuard)
  async createGame(@VisitorId() visitorId?: string) {
    return tsRestHandler(contract.session.createGame, async ({ body }) => {
      return {
        status: 201 as const,
        body: { game: await this.sessionService.createGame(body.session as unknown as Session, visitorId) },
      };
    });
  }

  @TsRestHandler(contract.session.endSoloGame)
  @UseGuards(OptionalAuthGuard)
  async endSoloGame(@VisitorId() visitorId?: string) {
    return tsRestHandler(contract.session.endSoloGame, async ({ body }) => {
      await this.sessionService.endSoloGame(body as unknown as SessionDto, visitorId);
      return { status: 200 as const, body: {} };
    });
  }
}
