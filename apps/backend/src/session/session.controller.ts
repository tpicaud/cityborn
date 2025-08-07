import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { Session } from '@cityborn/types';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    @Post()
    async createSession(@Body() createSessionDto: CreateSessionDto): Promise<Session> {
        return await this.sessionService.create(createSessionDto)
    }

    @Get()
    async getSession(@Query('sessionId') sessionId: string): Promise<Session> {
        return await this.sessionService.getById(sessionId);
    }
}
