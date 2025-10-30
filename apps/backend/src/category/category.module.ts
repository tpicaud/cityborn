import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GuessObjectModule } from 'src/guess-object/guess-object.module';

@Module({
  imports: [PrismaModule, GuessObjectModule],
  controllers: [CategoryController],
  providers: [CategoryService]
})
export class CategoryModule { }
