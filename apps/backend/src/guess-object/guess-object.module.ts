import { Module } from '@nestjs/common';
import { PrismaClsModule } from '../prisma/prisma-cls.module';
import { WorldLocationModule } from '../world-location/world-location.module';
import { AdminGuessObjectController } from './controllers/guess-object.admin.controller';
import { PublicGuessObjectController } from './controllers/guess-object.public.controller';
import { GuessObjectService } from './guess-object.service';
import { GUESS_OBJECT_REPOSITORY } from './repositories/guess-object.repository';
import { PrismaGuessObjectRepository } from './repositories/prisma-guess-object.repository';

@Module({
  imports: [PrismaClsModule, WorldLocationModule],
  controllers: [PublicGuessObjectController, AdminGuessObjectController],
  providers: [
    GuessObjectService,
    {
      provide: GUESS_OBJECT_REPOSITORY,
      useClass: PrismaGuessObjectRepository,
    },
  ],
  exports: [GuessObjectService],
})
export class GuessObjectModule {}
