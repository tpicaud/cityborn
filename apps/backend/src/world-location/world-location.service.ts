import { WorldLocation } from '@cityborn/api';
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

  async create(world_location_dto: WorldLocation): Promise<WorldLocation> {
    const row = await this.prisma.worldLocation.create({
      data: {
        id: world_location_dto.id.toString(),
        name: world_location_dto.name,
        type: world_location_dto.type,
        geometry: {
          create: {
            data: world_location_dto.geometry as unknown as Prisma.InputJsonValue,
          },
        },
        display_name: world_location_dto.display_name,
        addresstype: world_location_dto.addresstype,
        level: world_location_dto.level,
        iso_code: world_location_dto.iso_code,
        centroid: world_location_dto.centroid ?? [],
        source: world_location_dto.source as unknown as Prisma.InputJsonValue,
      },
      include: { geometry: true },
    });

    return WorldLocationMapper.toWorldLocation(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.worldLocation.delete({ where: { id } });
  }
}
