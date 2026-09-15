import { Inject, Injectable } from '@nestjs/common';
import type { CreateEvent, Event, EventMap } from './event.types';
import {
  EVENT_REPOSITORY,
  type EventRepository,
} from './repositories/event.repository';

@Injectable()
export class EventService {
  constructor(
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
  ) {}

  async trackEvent<Name extends keyof EventMap>(
    event: CreateEvent<Name>,
  ): Promise<Event> {
    return this.eventRepository.create(event);
  }
}
