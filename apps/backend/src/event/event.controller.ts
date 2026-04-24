import { Body, Controller, Post } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { EventService } from './event.service';

@Controller('event')
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post('track')
  async track(@Body() eventDto: CreateEventDto) {
    return await this.eventService.trackEvent(eventDto);
  }
}
