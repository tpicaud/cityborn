import { CreateEvent, EventMap } from './event.types';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  async trackEvent<Name extends keyof EventMap>(
    event: CreateEvent<Name> | CreateEvent<Name>,
  ) {
    return this.prisma.event.create({
      data: {
        ...event,
        properties: event.properties as unknown as Prisma.InputJsonValue,
      },
    });
  }
}
