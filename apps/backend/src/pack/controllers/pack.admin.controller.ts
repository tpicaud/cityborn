import { contract, ErrorCode } from '@cityborn/api';
import { Controller, NotFoundException, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from '../../auth/guards/access-token.guard';
import { AdminPackService } from '../services/pack.admin.service';

@UseGuards(AdminGuard)
@Controller()
export class AdminPackController {
  constructor(private readonly adminPackService: AdminPackService) {}

  @TsRestHandler(contract.admin.pack)
  async handler() {
    return tsRestHandler(contract.admin.pack, {
      getPackTrees: async () => ({
        status: 200 as const,
        body: await this.adminPackService.getTrees(),
      }),

      getAllPacks: async () => {
        return {
          status: 200 as const,
          body: await this.adminPackService.findAll(),
        };
      },

      getPack: async ({ params }) => {
        const [pack] = await this.adminPackService.findBy({
          ids: [params.id],
        });
        if (!pack) {
          throw new NotFoundException({
            code: ErrorCode.PACK_NOT_FOUND,
            message: 'Pack not found',
          });
        }
        return { status: 200 as const, body: pack };
      },

      getFullPack: async ({ params }) => {
        return {
          status: 200 as const,
          body: await this.adminPackService.findFullBy(params.id),
        };
      },

      createPack: async ({ body }) => {
        return {
          status: 201 as const,
          body: await this.adminPackService.create(body),
        };
      },

      updatePack: async ({ params, body }) => {
        return {
          status: 200 as const,
          body: await this.adminPackService.update(params.id, body),
        };
      },

      deletePack: async ({ params }) => {
        await this.adminPackService.delete(params.id);
        return { status: 200 as const, body: {} };
      },
    });
  }
}
