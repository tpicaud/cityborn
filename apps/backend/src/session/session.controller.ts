import { Body, Controller, Get, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionResponseDto } from './dto/session.response.dto';
import { CurrentUser } from 'src/user/user.decorator';
import { GameMode } from '@cityborn/types';
import { OptionalAuthGuard } from 'src/auth/guards/optional-auth.guard';
import { ErrorCode } from '@cityborn/errors';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    @UseGuards(OptionalAuthGuard)
    @Post()
    async createSession(@Body() createSessionDto: CreateSessionDto, @CurrentUser() user: any): Promise<SessionResponseDto> {
        if (!user && createSessionDto.gameMode === GameMode.MULTI) throw new UnauthorizedException({ code: ErrorCode.USER_NO_ACCOUNT, message: 'User does not have an account' });
        return {
            session: await this.sessionService.create(createSessionDto)
        }
    }

    @Get(':sessionId')
    async getSession(@Param('sessionId') sessionId: string): Promise<SessionResponseDto> {
        return {
            session: await this.sessionService.getById(sessionId)
        };
    }
}
