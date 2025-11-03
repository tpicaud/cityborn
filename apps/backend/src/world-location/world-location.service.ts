import { Injectable } from '@nestjs/common';
import { NominatimService } from 'src/nominatim/nominatim.service';
import { WorldLocationDto } from './dto/world-location.dto';
import { WorldLocationMapper } from './mapper/world-location.mapper';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorldLocationService {

    constructor(
        private readonly prisma: PrismaService,
    ) { }

    async get(id: string): Promise<WorldLocationDto | null> {
        const prisma_world_location = await this.prisma.worldLocation.findUnique({
            where: {
                id: id,
            },
        });

        if (!prisma_world_location) return null;
        return WorldLocationMapper.toWorldLocationDto(prisma_world_location);
    }

    async create(world_location_dto: WorldLocationDto): Promise<WorldLocationDto> {
        const prisma_world_location = await this.prisma.worldLocation.create({
            data: {
                id: world_location_dto.id.toString(),
                name: world_location_dto.name,
                type: world_location_dto.type,
                geometry: world_location_dto.geometry as unknown as Prisma.InputJsonValue,
                display_name: world_location_dto.display_name,
                addresstype: world_location_dto.addresstype,
                level: world_location_dto.level,
                iso_code: world_location_dto.iso_code,
                centroid: world_location_dto.centroid ?? [],
                source: world_location_dto.source as unknown as Prisma.InputJsonValue,
            }
        });

        return WorldLocationMapper.toWorldLocationDto(prisma_world_location);
    }

    async delete(id: string): Promise<WorldLocationDto> {
        const world_location = await this.prisma.worldLocation.delete({
            where: { id }
        });
        return WorldLocationMapper.toWorldLocationDto(world_location);
    }
}
