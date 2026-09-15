import type { Event as PrismaEvent } from '@prisma/client';
import type { Event } from '../event.types';

export const EventMapper = {
  toEvent(prismaEvent: PrismaEvent): Event {
    return {
      id: prismaEvent.id,
      visitorId: prismaEvent.visitorId,
      name: prismaEvent.name as Event['name'],
      properties: prismaEvent.properties as Event['properties'],
      created_at: prismaEvent.createdAt.toISOString(),
    };
  },
};
