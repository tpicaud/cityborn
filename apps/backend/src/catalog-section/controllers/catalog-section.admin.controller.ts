import { contract } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from '../../auth/guards/access-token.guard';
import { CatalogSectionService } from '../catalog-section.service';
@UseGuards(AdminGuard)
@Controller()
export class AdminCatalogSectionController {
  constructor(private readonly service: CatalogSectionService) {}
  @TsRestHandler(contract.admin.catalogSection)
  async handler() {
    return tsRestHandler(contract.admin.catalogSection, {
      getSections: async () => ({
        status: 200,
        body: await this.service.findAll(false),
      }),
      createSection: async ({ body }) => ({
        status: 201,
        body: await this.service.create(body),
      }),
      renameSection: async ({ params, body }) => ({
        status: 200,
        body: await this.service.rename({ ...params, ...body }),
      }),
      moveSection: async ({ params, body }) => ({
        status: 200,
        body: await this.service.move({ ...params, ...body }),
      }),
      deleteSection: async ({ params }) => {
        await this.service.delete(params.id);
        return { status: 200, body: {} };
      },
      addPack: async ({ params }) => ({
        status: 200,
        body: await this.service.addPack(params),
      }),
      removePack: async ({ params }) => ({
        status: 200,
        body: await this.service.removePack(params),
      }),
      movePack: async ({ params, body }) => ({
        status: 200,
        body: await this.service.movePack({ ...params, ...body }),
      }),
    });
  }
}
