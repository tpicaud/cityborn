import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { WorldLocationModule } from '../world-location/world-location.module';
import { AdminGuessObjectController } from './controllers/guess-object.admin.controller';
import { PublicGuessObjectController } from './controllers/guess-object.public.controller';
import { GuessObjectService } from './guess-object.service';

@Module({
  imports: [PrismaModule, WorldLocationModule],
  controllers: [PublicGuessObjectController, AdminGuessObjectController],
  providers: [GuessObjectService],
  exports: [GuessObjectService],
})
export class GuessObjectModule {}
