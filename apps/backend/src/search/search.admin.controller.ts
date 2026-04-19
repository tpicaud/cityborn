import { ErrorCode } from '@cityborn/errors';
import {
  BadRequestException,
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import type {
  SearchGuessObjectResponseDto,
  SearchWorldLocationResponseDto,
} from './dto/search.response.dto';
import type { SearchService } from './search.service';

@UseGuards(AdminGuard)
@Controller('admin/search')
export class AdminSearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('guess-object')
  async searchGuessObject(
    @Query('q') q?: string,
    @Query('external_id') external_id?: string,
  ): Promise<SearchGuessObjectResponseDto> {
    if (external_id) {
      return {
        results:
          await this.searchService.searchGuessObjectByExternalId(external_id),
      };
    } else if (q) {
      return {
        results: await this.searchService.searchGuessObjectByName(q),
      };
    } else {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `Either 'q' or 'source_id' must be provided`,
      });
    }
  }

  @Get('world-location')
  async searchWorldLocation(
    @Query('q') q?: string,
    @Query('id') id?: string,
    @Query('osm_type') osm_type?: string,
  ): Promise<SearchWorldLocationResponseDto> {
    if (id && osm_type) {
      return {
        results: await this.searchService.searchWorldLocationById(id, osm_type),
      };
    } else if (q) {
      return {
        results: await this.searchService.searchWorldLocationByName(q),
      };
    } else {
      throw new BadRequestException({
        code: ErrorCode.BAD_REQUEST,
        message: `Either 'q' or 'id' must be provided`,
      });
    }
  }
}
