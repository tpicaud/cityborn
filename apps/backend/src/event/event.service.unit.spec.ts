import { SessionMode } from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import { EventService } from './event.service';
import { createEvent } from './event.types';
import type { EventRepository } from './repositories/event.repository';

describe('createEvent', () => {
  it('preserves the typed event payload', () => {
    const event = createEvent({
      visitorId: 'visitor-1',
      name: 'session_created',
      properties: { mode: SessionMode.SOLO },
    });

    expect(event).toEqual({
      visitorId: 'visitor-1',
      name: 'session_created',
      properties: { mode: SessionMode.SOLO },
    });
  });
});

describe('EventService.trackEvent', () => {
  it('persists the event and its properties', async () => {
    const eventRepository = createMock<EventRepository>();
    const eventService = new EventService(eventRepository);
    const event = createEvent({
      visitorId: 'visitor-1',
      name: 'session_created',
      properties: { mode: SessionMode.SOLO },
    });
    eventRepository.create.mockResolvedValue({
      id: 'event-1',
      ...event,
      created_at: '2026-01-01T00:00:00.000Z',
    });

    const persistedEvent = await eventService.trackEvent(event);

    expect(eventRepository.create).toHaveBeenCalledWith(event);
    expect(persistedEvent.id).toBe('event-1');
  });
});
