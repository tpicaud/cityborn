import { BadRequestException, Controller, Get, Query, UseGuards } from '@nestjs/common';
import { WorldLocationService } from './world-location.service';
import { ErrorCode } from '@cityborn/errors';
import { WorldLocationDto, WorldLocationSearchResponseDto } from './dto/world-location.dto';
import { AdminGuard } from 'src/auth/guards/admin.guard';

@Controller('world-location')
export class WorldLocationController {

    constructor(
        private readonly worldLocationServcice: WorldLocationService
    ) { }

    ////////////////
    // Admin only //
    ////////////////
    
    @UseGuards(AdminGuard)
    @Get('search')
    async search(
        @Query('q') q?: string,
        @Query('id') id?: string,
        @Query('osm_type') osm_type?: string
    ): Promise<WorldLocationDto | WorldLocationSearchResponseDto> {
        if (id && osm_type) {
            return this.worldLocationServcice.findById(id, osm_type);
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
