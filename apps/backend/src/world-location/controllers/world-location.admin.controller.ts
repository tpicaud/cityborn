import { contract } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from '../../auth/guards/admin.guard';
import { WorldLocationService } from '../world-location.service';

@UseGuards(AdminGuard)
@Controller()
export class AdminWorldLocationController {
  constructor(private readonly worldLocationService: WorldLocationService) {}

  @TsRestHandler(contract.admin.worldLocation)
  async handler() {
    return tsRestHandler(contract.admin.worldLocation, {
      createWorldLocation: async ({ body }) => {
        const world_location =
          await this.worldLocationService.findOrCreate(body);
        return { status: 201 as const, body: world_location.id };
      },
    });
  }
}
