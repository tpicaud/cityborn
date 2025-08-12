import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { SessionResponseDto } from './dto/session.response.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    @UseGuards(AuthGuard)
    @Post()
    async createSession(@Body() createSessionDto: CreateSessionDto): Promise<SessionResponseDto> {
        return {
            session: await this.sessionService.create(createSessionDto)
        }
    }
    @UseGuards(AuthGuard)
    @Get(':sessionId')
    async getSession(@Param('sessionId') sessionId: string): Promise<SessionResponseDto> {
        return {
            session: await this.sessionService.getById(sessionId)
        };
    }
}
