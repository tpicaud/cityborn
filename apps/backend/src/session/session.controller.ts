import { Body, Controller, Get, Param, Post, UnauthorizedException, UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionResponseDto } from './dto/session.response.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { CurrentUser } from 'src/user/user.decorator';
import { GameMode } from '@cityborn/types';
import { OptionalAuthGuard } from 'src/auth/optional-auth.guard';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    @UseGuards(OptionalAuthGuard)
    @Post()
    async createSession(@Body() createSessionDto: CreateSessionDto, @CurrentUser() user: any): Promise<SessionResponseDto> {
        if (!user && createSessionDto.gameMode === GameMode.MULTI) throw new UnauthorizedException();
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
