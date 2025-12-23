import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEvent, EventMap } from '@cityborn/types';
import { CreateEventDto } from './dto/create-event.dto';
import { Prisma } from '@prisma/client';

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
