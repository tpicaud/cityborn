import { Module } from '@nestjs/common';
import { GuessObjectModule } from '../guess-object/guess-object.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminCategoryController } from './controllers/category.admin.controller';
import { PublicCategoryController } from './controllers/category.public.controller';
import { AdminCategoryService } from './services/category.admin.service';
import { PublicCategoryService } from './services/category.public.service';
import { CategoryService } from './services/category.service';

@Module({
  imports: [PrismaModule, GuessObjectModule],
  controllers: [PublicCategoryController, AdminCategoryController],
  providers: [CategoryService, PublicCategoryService, AdminCategoryService],
  exports: [CategoryService, PublicCategoryService, AdminCategoryService],
})
export class CategoryModule {}
