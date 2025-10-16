import { Module } from '@nestjs/common';
import { GuessObjectController } from './guess-object.controller';
import { GuessObjectService } from './guess-object.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GuessObjectController],
  providers: [GuessObjectService],
  exports: [GuessObjectService]
})
export class GuessObjectModule { }
