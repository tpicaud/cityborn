import { contract } from '@cityborn/api';
import { ErrorCode } from '@cityborn/errors';
import { BadRequestException, Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from 'src/auth/guards/admin.guard';
import { SearchService } from './search.service';

@UseGuards(AdminGuard)
@Controller()
export class AdminSearchController {
  constructor(private readonly searchService: SearchService) {}

  @TsRestHandler(contract.admin.search)
  async handler() {
    return tsRestHandler(contract.admin.search, {
      searchGuessObject: async ({ query }) => {
        if (query.external_id) {
          return {
            status: 200 as const,
            body: [
              await this.searchService.searchGuessObjectByExternalId(
                query.external_id,
              ),
            ],
          };
        } else if (query.q) {
          return {
            status: 200 as const,
            body: await this.searchService.searchGuessObjectByName(query.q),
          };
        } else {
          throw new BadRequestException({
            code: ErrorCode.BAD_REQUEST,
            message: `Either 'q' or 'source_id' must be provided`,
          });
        }
      },
      searchWorldLocation: async ({ query }) => {
        if (query.id && query.osm_type) {
          return {
            status: 200 as const,
            body: [
              await this.searchService.searchWorldLocationById(
                query.id,
                query.osm_type,
              ),
            ],
          };
        } else if (query.q) {
          return {
            status: 200 as const,
            body: await this.searchService.searchWorldLocationByName(query.q),
          };
        } else {
          throw new BadRequestException({
            code: ErrorCode.BAD_REQUEST,
            message: `Either 'q' or 'id' must be provided`,
          });
        }
      },
    });
  }
}
