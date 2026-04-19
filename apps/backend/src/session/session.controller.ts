import { ErrorCode } from '@cityborn/errors';
import { SessionMode, type User } from '@cityborn/types';
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { VisitorId } from 'src/common/decorators/visitor-id.decorator';
import { CurrentUser } from 'src/user/user.decorator';
import type { CreateGameDto } from './dto/create-game.dto';
import type { CreateSessionDto } from './dto/create-session.dto';
import type { GameResponseDto } from './dto/game.response.dto';
import type { SessionDto } from './dto/session.dto';
import type { SessionResponseDto } from './dto/session.response.dto';
import type { SessionService } from './session.service';

@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @UseGuards(OptionalAuthGuard)
  @Post()
  async createSession(
    @Body() createSessionDto: CreateSessionDto,
    @CurrentUser() user?: User,
    @VisitorId() visitorId?: string,
  ): Promise<SessionResponseDto> {
    if (createSessionDto.mode === SessionMode.MULTI && !user)
      throw new UnauthorizedException({
        code: ErrorCode.USER_NO_ACCOUNT_OR_NOT_VERIFIED,
        message: 'User does not have an account or is no verified',
      });
    return {
      session: await this.sessionService.create(
        createSessionDto,
        user,
        visitorId,
      ),
    };
  }

  @Get(':sessionId')
  async getSession(
    @Param('sessionId') sessionId: string,
  ): Promise<SessionResponseDto> {
    return {
      session: await this.sessionService.getById(sessionId),
    };
  }

  @UseGuards(OptionalAuthGuard)
  @Post('create-game')
  async createGame(
    @Body() createGameDto: CreateGameDto,
    @VisitorId() visitorId?: string,
  ): Promise<GameResponseDto> {
    return {
      game: await this.sessionService.createGame(
        createGameDto.session,
        visitorId,
      ),
    };
  }

  @UseGuards(OptionalAuthGuard)
  @Post('end-solo-game')
  async endSoloGame(
    @Body() sessionDto: SessionDto,
    @VisitorId() visitorId?: string,
  ): Promise<void> {
    await this.sessionService.endSoloGame(sessionDto, visitorId);
  }
}
