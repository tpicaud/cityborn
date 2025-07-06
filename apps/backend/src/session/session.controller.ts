import { Controller, Get, Param } from '@nestjs/common';
import { SessionService } from './session.service';

@Controller('session')
export class SessionController {
    constructor(private readonly sessionService: SessionService) {}

    @Get(':id')
    async getSession(@Param('id') id: string) {
        return await this.sessionService.findOne(id);
    }
}
