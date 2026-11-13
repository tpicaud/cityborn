import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { CatalogSectionService } from './catalog-section.service';
import { AdminCatalogSectionController } from './controllers/catalog-section.admin.controller';
import { PublicCatalogSectionController } from './controllers/catalog-section.public.controller';
import { CATALOG_SECTION_REPOSITORY } from './repositories/catalog-section.repository';
import { PrismaCatalogSectionRepository } from './repositories/prisma-catalog-section.repository';
@Module({
  imports: [PrismaClsModule],
  controllers: [PublicCatalogSectionController, AdminCatalogSectionController],
  providers: [
    CatalogSectionService,
    {
      provide: CATALOG_SECTION_REPOSITORY,
      useClass: PrismaCatalogSectionRepository,
    },
  ],
})
export class CatalogSectionModule {}
