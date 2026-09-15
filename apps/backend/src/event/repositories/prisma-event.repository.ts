import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import type { CreateEvent, Event, EventMap } from '../event.types';
import { EventMapper } from '../mapper/event.mapper';
import type { EventRepository } from './event.repository';

@Injectable()
export class PrismaEventRepository implements EventRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async create<Name extends keyof EventMap>(
    event: CreateEvent<Name>,
  ): Promise<Event> {
    const row = await this.txHost.tx.event.create({
      data: event,
    });
    return EventMapper.toEvent(row);
  }
}
