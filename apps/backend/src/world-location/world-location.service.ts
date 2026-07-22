import { CreateWorldLocation, ErrorCode, WorldLocation } from '@cityborn/api';
import { BadRequestException, Injectable } from '@nestjs/common';
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
    world_location_dto: CreateWorldLocation,
  ): Promise<WorldLocation> {
    if (!world_location_dto.source) {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `World location source (provider + external_id) is required`,
      });
    }

    const existing = await this.prisma.worldLocation.findUnique({
      where: {
        osm_type_external_id: {
          osm_type: world_location_dto.osm_type,
          external_id: world_location_dto.source.external_id,
        },
      },
      include: { geometry: true },
    });
    if (existing) return WorldLocationMapper.toWorldLocation(existing);

    const row = await this.prisma.worldLocation.create({
      data: {
        osm_type: world_location_dto.osm_type,
        external_id: world_location_dto.source.external_id,
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
