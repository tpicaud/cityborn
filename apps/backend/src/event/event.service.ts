import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventDto } from './event.dto';

@Injectable()
export class EventService {
    constructor(private readonly prisma: PrismaService) { }

    async trackEvent(eventDto: EventDto) {
        return this.prisma.event.create({ data: eventDto });
    }
}
