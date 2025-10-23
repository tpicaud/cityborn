import { Injectable, NotFoundException } from '@nestjs/common';
import { NominatimService } from 'src/nominatim/nominatim.service';
import { WorldLocationDto, WorldLocationSearchResponseDto } from './dto/world-location.dto';
import { WorldLocationMapper } from './mapper/world-location.mapper';
import { ErrorCode } from '@cityborn/errors';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorldLocationService {

    constructor(
        private readonly nominatimService: NominatimService,
        private readonly prisma: PrismaService,
    ) { }

    async searchByName(name: string): Promise<WorldLocationSearchResponseDto> {
        const nominatim_response = await this.nominatimService.searchByName(name);
        return WorldLocationMapper.toWorldLocationSearchResponseDto(nominatim_response);
    }

    async findById(id: string): Promise<WorldLocationDto> {
        const prisma_world_location = await this.prisma.worldLocation.findUnique({
            where: {
                id: id,
            },
        });

        if (prisma_world_location) return WorldLocationMapper.toWorldLocationDto(prisma_world_location);

        // si pas dans la db, rechercher sur nominatim
        const nominatim_response = await this.nominatimService.findByOsmId(id);
        if (!nominatim_response) {
            throw new NotFoundException({
                code: ErrorCode.WORLD_LOCATION_NOT_FOUND,
                message: 'No location found for the provided ID',
            });
        };

        return WorldLocationMapper.toWorldLocationDtoFromNominatimItem(nominatim_response);
    }

    async create(world_location_dto: WorldLocationDto): Promise<WorldLocationDto> {
        const prisma_world_location = await this.prisma.worldLocation.create({
            data: {
                id: world_location_dto.id,
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
}
