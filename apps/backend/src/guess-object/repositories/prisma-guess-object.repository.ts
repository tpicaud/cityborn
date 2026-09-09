import {
  type CreateGuessObject,
  type FullGuessObject,
  type GuessObject,
  type GuessObjectDraft,
  type GuessObjectId,
  GuessObjectIdSchema,
  type PatchGuessObject,
  type WorldLocationId,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { GuessObjectMapper } from '../mappers/guess-object.mapper';
import type {
  GuessObjectDeletionDetails,
  GuessObjectFilter,
  GuessObjectRepository,
} from './guess-object.repository';

@Injectable()
export class PrismaGuessObjectRepository implements GuessObjectRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async findBy(filter: GuessObjectFilter): Promise<GuessObject[]> {
    const rowsGuessObject = await this.txHost.tx.guessObject.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.external_id && {
          source: { path: ['external_id'], equals: filter.external_id },
        }),
      },
      include: { world_location: true },
    });
    return rowsGuessObject.map((obj) => GuessObjectMapper.toGuessObject(obj));
  }

  async findFullBy(filter: GuessObjectFilter): Promise<FullGuessObject[]> {
    const rows = await this.txHost.tx.guessObject.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.external_id && {
          source: { path: ['external_id'], equals: filter.external_id },
        }),
        ...(filter.categoryIds?.length && {
          categories: { some: { id: { in: filter.categoryIds } } },
        }),
      },
      include: { world_location: { include: { geometry: true } } },
    });
    return rows.map((obj) => GuessObjectMapper.toFullGuessObject(obj));
  }

  async findByNameAndWorldLocation(
    name: string,
    world_location_id: WorldLocationId,
  ): Promise<Pick<GuessObject, 'id'> | null> {
    const existingGuessObject = await this.txHost.tx.guessObject.findFirst({
      where: { name, world_location_id },
    });
    return existingGuessObject
      ? { id: GuessObjectIdSchema.parse(existingGuessObject.id) }
      : null;
  }

  async create(createGuessObject: CreateGuessObject): Promise<GuessObjectId> {
    const prisma_guess_object = await this.txHost.tx.guessObject.create({
      data: {
        name: createGuessObject.name,
        image: createGuessObject.image,
        description: createGuessObject.description,
        short_description: createGuessObject.short_description,
        source: createGuessObject.source,
        world_location_id: createGuessObject.world_location_id,
      },
    });
    return GuessObjectIdSchema.parse(prisma_guess_object.id);
  }

  async update(
    id: GuessObjectId,
    updatedFields: PatchGuessObject,
  ): Promise<GuessObjectId> {
    const data = {
      name: updatedFields.name,
      image: updatedFields.image,
      description: updatedFields.description,
      short_description: updatedFields.short_description,
      ...(updatedFields.world_location_id && {
        world_location_id: updatedFields.world_location_id,
      }),
    };

    const updated_object = await this.txHost.tx.guessObject.update({
      where: { id },
      data,
    });
    return GuessObjectIdSchema.parse(updated_object.id);
  }

  async findForDeletion(
    id: GuessObjectId,
  ): Promise<GuessObjectDeletionDetails | null> {
    const guess_object = await this.txHost.tx.guessObject.findUnique({
      where: { id },
      include: { categories: true },
    });
    if (!guess_object) return null;
    return GuessObjectMapper.toDeletionDetails(guess_object);
  }

  async delete(id: GuessObjectId): Promise<void> {
    await this.txHost.tx.guessObject.delete({ where: { id } });
  }

  async countByWorldLocationId(
    world_location_id: WorldLocationId,
  ): Promise<number> {
    return this.txHost.tx.guessObject.count({
      where: { world_location_id },
    });
  }

  async searchDraftByName(name: string): Promise<GuessObjectDraft[]> {
    const prisma_guess_objects = await this.txHost.tx.guessObject.findMany({
      where: { name: { contains: name, mode: 'insensitive' } },
    });
    return prisma_guess_objects.map((obj) =>
      GuessObjectMapper.toGuessObjectDraftFromPrisma(obj),
    );
  }
}
