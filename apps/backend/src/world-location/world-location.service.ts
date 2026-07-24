import { CreateWorldLocation, WorldLocation } from '@cityborn/api';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WorldLocationMapper } from './mapper/world-location.mapper';

@Injectable()
export class WorldLocationService {
  constructor(private readonly prisma: PrismaService) {}

  async get(id: string): Promise<{ id: string } | null> {
    const row = await this.prisma.worldLocation.findUnique({ where: { id } });
    if (!row) return null;
    return { id: row.id };
  }

  async getWithGeometry(id: string): Promise<WorldLocation | null> {
    const row = await this.prisma.worldLocation.findUnique({
      where: { id },
      include: { geometry: true },
    });
    if (!row) return null;
    return WorldLocationMapper.toWorldLocation(row);
  }

  async findOrCreate(
    createWorldLocation: CreateWorldLocation,
  ): Promise<WorldLocation> {
    const existing = await this.prisma.worldLocation.findUnique({
      where: {
        osm_type_external_id: {
          osm_type: createWorldLocation.osm_type,
          external_id: createWorldLocation.source.external_id,
        },
      },
      include: { geometry: true },
    });
    if (existing) return WorldLocationMapper.toWorldLocation(existing);

    const row = await this.prisma.worldLocation.create({
      data: {
        osm_type: createWorldLocation.osm_type,
        external_id: createWorldLocation.source.external_id,
        name: createWorldLocation.name,
        geometry: {
          create: {
            data: createWorldLocation.geometry as unknown as Prisma.InputJsonValue,
          },
        },
        display_name: createWorldLocation.display_name,
        addresstype: createWorldLocation.addresstype,
        centroid: createWorldLocation.centroid,
        source: createWorldLocation.source as unknown as Prisma.InputJsonValue,
      },
      include: { geometry: true },
    });

    return WorldLocationMapper.toWorldLocation(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.worldLocation.delete({ where: { id } });
  }
}
