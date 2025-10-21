import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { WorldLocationService } from './world-location.service';
import { ErrorCode } from '@cityborn/errors';
import { WorldLocationDto, WorldLocationSearchResponseDto } from './dto/world-location.dto';

@Controller('world-location')
export class WorldLocationController {

    constructor(
        private readonly worldLocationServcice: WorldLocationService
    ) { }

    @Get('search')
    async search(
        @Query('q') q?: string,
        @Query('id') id?: string,
    ): Promise<WorldLocationDto | WorldLocationSearchResponseDto> {
        if (id) {
            return this.worldLocationServcice.findById(id);
        } else if (q) {
            return this.worldLocationServcice.searchByName(q);
        } else {
            throw new BadRequestException({
                code: ErrorCode.BAD_REQUEST,
                message: `Either 'q' or 'id' must be provided`,
            });
        }
    }
}
