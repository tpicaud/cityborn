import { Injectable, NotFoundException } from '@nestjs/common';
import { GuessObjectService } from 'src/guess-object/guess-object.service';
import { SearchGuessObjectResponseDto, SearchWorldLocationResponseDto } from './dto/search.response.dto';
import { WikidataService } from 'src/wikidata/wikidata.service';
import { GuessObjectMapper } from 'src/guess-object/mappers/guess-object.mapper';
import { WorldLocationService } from 'src/world-location/world-location.service';
import { WorldLocationMapper } from 'src/world-location/mapper/world-location.mapper';
import { ErrorCode } from '@cityborn/errors';
import { NominatimService } from 'src/nominatim/nominatim.service';
import { WorldLocationDto } from 'src/world-location/dto/world-location.dto';
import { GuessObjectCandidateDto } from 'src/guess-object/dto/search-guess-object.response.dto';

@Injectable()
export class SearchService {
    constructor(
        private readonly guessObjectService: GuessObjectService,
        private readonly wikidataService: WikidataService,
        private readonly worldLocationService: WorldLocationService,
        private readonly nominatimService: NominatimService
    ) { }

    async searchGuessObjectByExternalId(source_id: string): Promise<GuessObjectCandidateDto> {
        const guessObjectInDB = await this.guessObjectService.findByExternalId(source_id);
        if (guessObjectInDB) {
            // return if in db
            return guessObjectInDB
        } else {
            // else get from providers
            const wikidata_response = await this.wikidataService.findById(source_id);
            const guessObjectCandidate = GuessObjectMapper.toGuessObjectCandidateDto(wikidata_response);

            if (guessObjectCandidate.world_location_id) {
                const world_location = await this.searchWorldLocationById(guessObjectCandidate.world_location_id, guessObjectCandidate.world_location?.osm_type!);
                if (world_location) guessObjectCandidate.world_location = world_location;
            }

            return guessObjectCandidate;
        }
    }

    async searchGuessObjectByName(query: string): Promise<GuessObjectCandidateDto[]> {
        // Search in wikidata
        const wikidata_response = await this.wikidataService.searchByName(query);
        const guess_objects_candidates_from_wikidata = GuessObjectMapper.toGuessObjectsSearchResponseDto(wikidata_response);

        // search in db
        const guess_objects_candidates_from_db = await this.guessObjectService.searchByName(query);

        // Remplacer les candidats Wikidata par ceux de la DB quand l’external_id correspond
        const dbByExternalId = new Map(
            guess_objects_candidates_from_db.map(obj => [obj.source?.external_id, obj]),
        );

        const merged_candidates = guess_objects_candidates_from_wikidata.map(wikiCandidate => {
            const dbObj = dbByExternalId.get(wikiCandidate.source?.external_id);
            if (dbObj) {
                return dbObj;
            }
            return wikiCandidate;
        });

        return merged_candidates;
    }

    async searchWorldLocationById(id: string, osm_type: string): Promise<WorldLocationDto> {
        // Search in db
        const db_world_location = await this.worldLocationService.get(id);
        if (db_world_location) {
            return db_world_location;
        }

        // Else, search in external provider
        const nominatim_response = await this.nominatimService.findByOsmId(id, osm_type as any);

        if (!nominatim_response) {
            throw new NotFoundException({
                code: ErrorCode.WORLD_LOCATION_NOT_FOUND,
                message: 'No location found for the provided ID',
            });
        };

        const world_locations = WorldLocationMapper.toWorldLocationDtoFromNominatimItem(nominatim_response);

        return world_locations;
    }

    async searchWorldLocationByName(query: string): Promise<WorldLocationDto[]> {
        const nominatim_response = await this.nominatimService.searchByName(query);
        return nominatim_response.results.map(res => WorldLocationMapper.toWorldLocationDtoFromNominatimItem(res));
    }
}
