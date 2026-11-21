import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { AdminCatalogSectionController } from './catalog-section.admin.controller';
import { CatalogSectionService } from './catalog-section.service';
import { CATALOG_SECTION_REPOSITORY } from './repositories/catalog-section.repository';
import { PrismaCatalogSectionRepository } from './repositories/prisma-catalog-section.repository';

@Module({
  imports: [PrismaClsModule],
  controllers: [AdminCatalogSectionController],
  providers: [
    CatalogSectionService,
    {
      provide: CATALOG_SECTION_REPOSITORY,
      useClass: PrismaCatalogSectionRepository,
    },
  ],
})
export class CatalogSectionModule {}
