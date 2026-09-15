import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../../prisma/prisma-cls.module';
import { CATEGORY_REPOSITORY } from './category.repository';
import { PrismaCategoryRepository } from './prisma-category.repository';

@Module({
  imports: [PrismaClsModule],
  providers: [
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
  ],
  exports: [CATEGORY_REPOSITORY],
})
export class CategoryRepositoryModule {}
