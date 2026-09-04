import type {
  CreateWorldLocation,
  WorldLocation,
  WorldLocationSource,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Prisma } from '@prisma/client';
import type { PrismaTransactionHost } from '../../prisma/prisma-cls.module';
import { WorldLocationMapper } from '../mapper/world-location.mapper';
import type { WorldLocationRepository } from './world-location.repository';

@Injectable()
export class PrismaWorldLocationRepository implements WorldLocationRepository {
  constructor(
    @Inject(TransactionHost) private readonly txHost: PrismaTransactionHost,
  ) {}

  async existsById(id: string): Promise<boolean> {
    const row = await this.txHost.tx.worldLocation.findUnique({
      where: { id },
      select: { id: true },
    });
    return row !== null;
  }

  async findById(
    id: string,
    includes: { geometry: boolean },
  ): Promise<WorldLocation | null> {
    const row = await this.txHost.tx.worldLocation.findUnique({
      where: { id },
      include: { geometry: includes.geometry },
    });
    if (!row) return null;
    return WorldLocationMapper.toWorldLocation(row);
  }

  async findBySource(
    source: WorldLocationSource,
    includes: { geometry: boolean },
  ): Promise<WorldLocation | null> {
    const row = await this.txHost.tx.worldLocation.findUnique({
      where: {
        osm_type_external_id: {
          osm_type: source.provider,
          external_id: source.external_id,
        },
      },
      include: { geometry: includes.geometry },
    });
    if (!row) return null;
    return WorldLocationMapper.toWorldLocation(row);
  }

  async create(data: CreateWorldLocation): Promise<WorldLocation> {
    const row = await this.txHost.tx.worldLocation.create({
      data: {
        osm_type: data.osm_type,
        external_id: data.source.external_id,
        name: data.name,
        geometry: {
          create: {
            data: data.geometry as unknown as Prisma.InputJsonValue,
          },
        },
        display_name: data.display_name,
        addresstype: data.addresstype,
        centroid: data.centroid,
        source: data.source as unknown as Prisma.InputJsonValue,
      },
      include: { geometry: true },
    });

    return WorldLocationMapper.toWorldLocation(row);
  }

  async delete(id: string): Promise<void> {
    await this.txHost.tx.worldLocation.delete({ where: { id } });
  }
}
