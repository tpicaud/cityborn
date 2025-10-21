import { Injectable, NotFoundException } from '@nestjs/common';
import { NominatimService } from 'src/nominatim/nominatim.service';
import { WorldLocationDto, WorldLocationSearchResponseDto } from './dto/world-location.dto';
import { WorldLocationMapper } from './mapper/world-location.mapper';
import { ErrorCode } from '@cityborn/errors';

@Injectable()
export class WorldLocationService {

    constructor(
        private readonly nominatimService: NominatimService
    ) { }

    async searchByName(name: string): Promise<WorldLocationSearchResponseDto> {
        const nominatim_response = await this.nominatimService.searchByName(name);
        return WorldLocationMapper.toWorldLocationSearchResponseDto(nominatim_response);
    }

    async findById(id: string): Promise<WorldLocationDto> {
        const nominatim_response = await this.nominatimService.findByOsmId(id);
        if (!nominatim_response) {
            throw new NotFoundException({
                code: ErrorCode.WORLD_LOCATION_NOT_FOUND,
                message: 'No location found for the provided ID',
            });
        };

        return WorldLocationMapper.toWorldLocationDtoFromNominatimItem(nominatim_response);
    }
}
