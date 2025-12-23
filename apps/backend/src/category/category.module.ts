import { Module } from '@nestjs/common';
import { PublicCategoryController } from './controllers/category.public.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuessObjectModule } from 'src/guess-object/guess-object.module';
import { PublicCategoryService } from './services/category.public.service';
import { AdminCategoryController } from './controllers/category.admin.controller';
import { AdminCategoryService } from './services/category.admin.service';
import { CategoryService } from './services/category.service';

@Module({
  imports: [PrismaModule, GuessObjectModule],
  controllers: [PublicCategoryController, AdminCategoryController],
  providers: [CategoryService, PublicCategoryService, AdminCategoryService],
  exports: [CategoryService, PublicCategoryService, AdminCategoryService],
})
export class CategoryModule {}
