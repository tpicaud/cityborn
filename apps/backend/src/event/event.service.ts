import { CreateEvent, EventMap } from '@cityborn/types';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

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
