import type { CreateEvent, EventMap } from '@cityborn/types';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type { PrismaService } from 'src/prisma/prisma.service';
import type { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvent<Name extends keyof EventMap>(
    event: CreateEvent<Name> | CreateEventDto<Name>,
  ) {
    return this.prisma.event.create({
      data: {
        ...event,
        properties: event.properties as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
