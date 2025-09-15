import { Body, Controller, Get, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionResponseDto } from './dto/session.response.dto';
import { CurrentUser } from 'src/user/user.decorator';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { ErrorCode } from '@cityborn/errors';
import { SessionMode, User } from '@cityborn/types';
import { CreateGameDto } from './dto/create-game.dto';
import { GameResponseDto } from './dto/game.response.dto';
import { VisitorId } from 'src/common/decorators/visitor-id.decorator';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    @UseGuards(OptionalAuthGuard)
    @Post()
    async createSession(@Body() createSessionDto: CreateSessionDto, @CurrentUser() user?: User, @VisitorId() visitorId?: string): Promise<SessionResponseDto> {
        if (createSessionDto.mode === SessionMode.MULTI && ((!user || (user && !user.isVerified)))) throw new UnauthorizedException({ code: ErrorCode.USER_NO_ACCOUNT_OR_NOT_VERIFIED, message: 'User does not have an account or is no verified' });
        return {
            session: await this.sessionService.create(createSessionDto, user, visitorId)
        }
    }

    @Get(':sessionId')
    async getSession(@Param('sessionId') sessionId: string): Promise<SessionResponseDto> {
        return {
            session: await this.sessionService.getById(sessionId)
        };
    }

    @UseGuards(OptionalAuthGuard)
    @Post('create-game')
    async createGame(@Body() createGameDto: CreateGameDto, @VisitorId() visitorId?: string): Promise<GameResponseDto> {
        return {
            game: await this.sessionService.createGame(SessionMode.SOLO, createGameDto.gameConfig, visitorId)
        }
    }
}
