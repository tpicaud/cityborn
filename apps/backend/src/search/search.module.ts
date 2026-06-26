import { Module } from '@nestjs/common';
import { GuessObjectModule } from '../guess-object/guess-object.module';
import { NominatimModule } from '../nominatim/nominatim.module';
import { WikidataModule } from '../wikidata/wikidata.module';
import { WorldLocationModule } from '../world-location/world-location.module';
import { AdminSearchController } from './search.admin.controller';
import { SearchService } from './search.service';

@Module({
  controllers: [AdminSearchController],
  providers: [SearchService],
  imports: [
    GuessObjectModule,
    WikidataModule,
    WorldLocationModule,
    NominatimModule,
  ],
})
export class SearchModule {}
