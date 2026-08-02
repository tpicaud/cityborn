import { ErrorCode, GuessObjectDraft, WorldLocation } from '@cityborn/api';
import { Injectable, NotFoundException } from '@nestjs/common';
import { GuessObjectService } from '../guess-object/guess-object.service';
import { GuessObjectMapper } from '../guess-object/mappers/guess-object.mapper';
import { NominatimService } from '../nominatim/nominatim.service';
import { WikidataService } from '../wikidata/wikidata.service';
import { WorldLocationMapper } from '../world-location/mapper/world-location.mapper';
import { WorldLocationService } from '../world-location/world-location.service';

@Injectable()
export class SearchService {
  constructor(
    private readonly guessObjectService: GuessObjectService,
    private readonly wikidataService: WikidataService,
    private readonly worldLocationService: WorldLocationService,
    private readonly nominatimService: NominatimService,
  ) {}

  async searchGuessObjectByExternalId(
    source_id: string,
  ): Promise<GuessObjectDraft> {
    const [guessObjectInDB] = await this.guessObjectService.findFullBy({
      external_id: source_id,
    });
    if (guessObjectInDB) {
      return guessObjectInDB;
    } else {
      const wikidata_response = await this.wikidataService.findById(source_id);
      const guessObjectDraft =
        GuessObjectMapper.toGuessObjectDraft(wikidata_response);

      if (wikidata_response.world_location_id) {
        const world_location = await this.searchWorldLocationById(
          wikidata_response.world_location_id,
          wikidata_response.osm_type!,
        );
        if (world_location) guessObjectDraft.world_location = world_location;
      }

      return guessObjectDraft;
    }
  }

  async searchGuessObjectByName(query: string): Promise<GuessObjectDraft[]> {
    const wikidata_response = await this.wikidataService.searchByName(query);
    const drafts_from_wikidata =
      GuessObjectMapper.toGuessObjectsSearchResponse(wikidata_response);

    const drafts_from_db =
      await this.guessObjectService.searchDraftByName(query);

    const dbByExternalId = new Map(
      drafts_from_db.map((obj) => [obj.source?.external_id, obj]),
    );

    const merged_drafts = drafts_from_wikidata.map((wikiDraft) => {
      const dbObj = dbByExternalId.get(wikiDraft.source?.external_id);
      if (dbObj) {
        return dbObj;
      }
      return wikiDraft;
    });

    return merged_drafts;
  }

  async searchWorldLocationById(
    id: string,
    osm_type: string,
  ): Promise<WorldLocation> {
    const db_world_location =
      await this.worldLocationService.getWithGeometry(id);
    if (db_world_location) {
      return db_world_location;
    }

    const nominatim_response = await this.nominatimService.findByOsmId(
      id,
      osm_type as any,
    );

    if (!nominatim_response) {
      throw new NotFoundException({
        code: ErrorCode.WORLD_LOCATION_NOT_FOUND,
        message: 'No location found for the provided ID',
      });
    }

    const world_locations =
      WorldLocationMapper.toWorldLocationFromNominatimItem(nominatim_response);

    return world_locations;
  }

  async searchWorldLocationByName(query: string): Promise<WorldLocation[]> {
    const nominatim_response = await this.nominatimService.searchByName(query);
    return nominatim_response.results.map((res) =>
      WorldLocationMapper.toWorldLocationFromNominatimItem(res),
    );
  }
}
