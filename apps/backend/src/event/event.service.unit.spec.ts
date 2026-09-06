import { SessionMode } from '@cityborn/api';
import { createMock } from '../../test/support/createMock';
import type { PrismaService } from '../prisma/prisma.service';
import { EventService } from './event.service';
import { createEvent } from './event.types';

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
    const prismaService = createMock<PrismaService>();
    const eventService = new EventService(prismaService);
    const event = createEvent({
      visitorId: 'visitor-1',
      name: 'session_created',
      properties: { mode: SessionMode.SOLO },
    });
    prismaService.event.create.mockResolvedValue({
      id: 'event-1',
      name: event.name,
      visitorId: event.visitorId,
      properties: event.properties,
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
    });

    const persistedEvent = await eventService.trackEvent(event);

    expect(prismaService.event.create).toHaveBeenCalledWith({ data: event });
    expect(persistedEvent.id).toBe('event-1');
  });
});
