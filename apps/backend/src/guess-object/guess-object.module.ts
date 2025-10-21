import { Module } from '@nestjs/common';
import { GuessObjectController } from './guess-object.controller';
import { GuessObjectService } from './guess-object.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { WikidataModule } from 'src/wikidata/wikidata.module';
import { WorldLocationModule } from 'src/world-location/world-location.module';

@Module({
  imports: [PrismaModule, WikidataModule, WorldLocationModule],
  controllers: [GuessObjectController],
  providers: [GuessObjectService],
  exports: [GuessObjectService]
})
export class GuessObjectModule { }
