import { Module } from '@nestjs/common';
import { GuessObjectModule } from 'src/guess-object/guess-object.module';
import { NominatimModule } from 'src/nominatim/nominatim.module';
import { WikidataModule } from 'src/wikidata/wikidata.module';
import { WorldLocationModule } from 'src/world-location/world-location.module';
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
