import { Module } from '@nestjs/common';
import { CategoryController } from './controllers/category.public.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuessObjectModule } from 'src/guess-object/guess-object.module';
import { PublicCategoryService } from './services/category.public.service';

@Module({
  imports: [PrismaModule, GuessObjectModule],
  controllers: [CategoryController],
  providers: [PublicCategoryService]
})
export class CategoryModule { }
