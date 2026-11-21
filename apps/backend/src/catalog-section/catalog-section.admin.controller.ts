import { contract } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { AdminGuard } from '../auth/guards/access-token.guard';
import { CatalogSectionService } from './catalog-section.service';

@UseGuards(AdminGuard)
@Controller()
export class AdminCatalogSectionController {
  constructor(private readonly catalogSectionService: CatalogSectionService) {}

  @TsRestHandler(contract.admin.catalogSection)
  async handler() {
    return tsRestHandler(contract.admin.catalogSection, {
      getCatalogSections: async () => ({
        status: 200,
        body: await this.catalogSectionService.findAll(),
      }),
      createCatalogSection: async ({ body }) => ({
        status: 201,
        body: await this.catalogSectionService.create(body),
      }),
      renameCatalogSection: async ({ params, body }) => ({
        status: 200,
        body: await this.catalogSectionService.rename({
          id: params.id,
          section: body,
        }),
      }),
      moveCatalogSection: async ({ params, body }) => ({
        status: 200,
        body: await this.catalogSectionService.move({
          id: params.id,
          direction: body.direction,
        }),
      }),
      deleteCatalogSection: async ({ params }) => {
        await this.catalogSectionService.delete(params.id);
        return { status: 200, body: {} };
      },
    });
  }
}
