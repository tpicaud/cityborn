import type {
  CreatePack,
  FullPack,
  GuessObjectId,
  Pack,
  PackId,
  ThemeId,
  UpdatePack,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { PackMapper } from '../mappers/pack.mapper';
import type { PackFilter, PackRepository } from './pack.repository';

@Injectable()
export class PrismaPackRepository implements PackRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async findBy(filter: PackFilter): Promise<Pack[]> {
    const packs = await this.txHost.tx.pack.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.isPublished !== undefined && {
          isPublished: filter.isPublished,
        }),
      },
    });
    return PackMapper.toPacks(packs);
  }

  async findFullBy(filter: PackFilter): Promise<FullPack[]> {
    const packs = await this.txHost.tx.pack.findMany({
      where: {
        ...(filter.ids && { id: { in: filter.ids } }),
        ...(filter.isPublished !== undefined && {
          isPublished: filter.isPublished,
        }),
      },
      include: { guessObjects: { include: { world_location: true } } },
    });
    return PackMapper.toFullPacks(packs);
  }

  async create(data: CreatePack): Promise<Pack> {
    const { guessObjectsIds, parentId, ...packData } = data;
    const pack = await this.txHost.tx.pack.create({
      data: {
        ...packData,
        guessObjects: guessObjectsIds
          ? { connect: guessObjectsIds.map((id) => ({ id })) }
          : undefined,
      },
    });
    return PackMapper.toPack(pack);
  }

  async lock(id: PackId): Promise<void> {
    await this.txHost.tx
      .$queryRaw`SELECT id FROM "Pack" WHERE id = ${id}::uuid FOR UPDATE`;
  }

  async removeFromThemeSections({
    packId,
    themeId,
  }: {
    packId: PackId;
    themeId: ThemeId;
  }): Promise<void> {
    await this.txHost.tx.catalogSectionPack.deleteMany({
      where: { packId, section: { themeId } },
    });
  }

  async update(packId: PackId, data: UpdatePack): Promise<Pack> {
    const { connectIds, disconnectIds, id, parentId, ...packData } = data;

    const relationUpdate: {
      connect?: { id: GuessObjectId }[];
      disconnect?: { id: GuessObjectId }[];
    } = {};
    if (connectIds) relationUpdate.connect = connectIds.map((id) => ({ id }));
    if (disconnectIds)
      relationUpdate.disconnect = disconnectIds.map((id) => ({ id }));

    const updated_pack = await this.txHost.tx.pack.update({
      where: { id: packId },
      data: {
        ...packData,
        ...(Object.keys(relationUpdate).length > 0
          ? { guessObjects: relationUpdate }
          : {}),
      },
      include: { guessObjects: { include: { world_location: true } } },
    });
    return PackMapper.toPack(updated_pack);
  }

  async countByGuessObjectId(id: GuessObjectId): Promise<number> {
    return this.txHost.tx.pack.count({
      where: { guessObjects: { some: { id } } },
    });
  }

  async delete(id: PackId): Promise<void> {
    await this.txHost.tx.pack.delete({ where: { id } });
  }
}
