import { Body, Controller, Post } from '@nestjs/common';
import type { CreateEventDto } from './dto/create-event.dto';
import type { EventService } from './event.service';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post('track')
  async track(@Body() eventDto: CreateEventDto) {
    return await this.eventService.trackEvent(eventDto);
  }
}
