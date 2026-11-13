import { contract } from '@cityborn/api';
import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { CatalogSectionService } from '../catalog-section.service';
@Controller()
export class PublicCatalogSectionController {
  constructor(private readonly service: CatalogSectionService) {}
  @TsRestHandler(contract.catalogSection)
  async handler() {
    return tsRestHandler(contract.catalogSection, {
      getPublishedSections: async () => ({
        status: 200,
        body: await this.service.findAll(true),
      }),
    });
  }
}
