import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService) { }

    @Post()
    async createSession(@Body() createSessionDto: CreateSessionDto) {
        return this.sessionService.create(createSessionDto)
    }

    @Get()
    async getSession(@Query('sessionId') sessionId: string) {
        return await this.sessionService.getById(sessionId);
    }
}
