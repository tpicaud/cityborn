import { contract } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from '../../auth/guards/access-token.guard';
import { PackService } from '../pack.service';

@UseGuards(AdminGuard)
@Controller()
export class AdminPackController {
  constructor(private readonly packService: PackService) {}

  @TsRestHandler(contract.admin.pack)
  async handler() {
    return tsRestHandler(contract.admin.pack, {
      getPackTrees: async () => ({
        status: 200 as const,
        body: await this.packService.findTrees(),
      }),

      getAllPacks: async () => ({
        status: 200 as const,
        body: await this.packService.findAll(),
      }),

      getPack: async ({ params }) => ({
        status: 200 as const,
        body: await this.packService.findById(params.id),
      }),

      getFullPack: async ({ params }) => ({
        status: 200 as const,
        body: await this.packService.findFullById(params.id),
      }),

      createPack: async ({ body }) => ({
        status: 201 as const,
        body: await this.packService.create(body),
      }),

      updatePack: async ({ params, body }) => ({
        status: 200 as const,
        body: await this.packService.update(params.id, body),
      }),

      deletePack: async ({ params }) => {
        await this.packService.delete(params.id);
        return { status: 200 as const, body: {} };
      },
    });
  }
}
