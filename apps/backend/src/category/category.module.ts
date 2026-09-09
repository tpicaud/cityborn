import { Module } from '@nestjs/common';
import { GuessObjectModule } from '../guess-object/guess-object.module';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { AdminCategoryController } from './controllers/category.admin.controller';
import { PublicCategoryController } from './controllers/category.public.controller';
import { CATEGORY_REPOSITORY } from './repositories/category.repository';
import { PrismaCategoryRepository } from './repositories/prisma-category.repository';
import { AdminCategoryService } from './services/category.admin.service';
import { PublicCategoryService } from './services/category.public.service';
import { CategoryService } from './services/category.service';

@Module({
  imports: [PrismaClsModule, GuessObjectModule],
  controllers: [PublicCategoryController, AdminCategoryController],
  providers: [
    CategoryService,
    PublicCategoryService,
    AdminCategoryService,
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
  ],
  exports: [CategoryService, PublicCategoryService, AdminCategoryService],
})
export class CategoryModule {}
