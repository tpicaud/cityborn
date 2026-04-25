import { contract } from '@cityborn/api';
import type { CreateEvent } from '@cityborn/types';
import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { EventService } from './event.service';

@Controller()
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @TsRestHandler(contract.event.trackEvent)
  async track() {
    return tsRestHandler(contract.event.trackEvent, async ({ body }) => {
      await this.eventService.trackEvent(body.event as unknown as CreateEvent);
      return { status: 201 as const, body: {} };
    });
  }
}
