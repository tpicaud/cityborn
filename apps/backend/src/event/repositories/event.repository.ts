import type { CreateEvent, Event, EventMap } from '../event.types';

export const EVENT_REPOSITORY = Symbol('EVENT_REPOSITORY');

export interface EventRepository {
  create<Name extends keyof EventMap>(event: CreateEvent<Name>): Promise<Event>;
}
