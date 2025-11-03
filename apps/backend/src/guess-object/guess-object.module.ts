import { Module } from '@nestjs/common';
import { GuessObjectService } from './guess-object.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WorldLocationModule } from 'src/world-location/world-location.module';
import { PublicGuessObjectController } from './controllers/guess-object.public.controller';
import { AdminGuessObjectController } from './controllers/guess-object.admin.controller';

@Module({
  imports: [PrismaModule, WorldLocationModule],
  controllers: [PublicGuessObjectController, AdminGuessObjectController],
  providers: [GuessObjectService],
  exports: [GuessObjectService]
})
export class GuessObjectModule { }
