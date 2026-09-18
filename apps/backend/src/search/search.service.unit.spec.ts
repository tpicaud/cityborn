import type {
  FullGuessObject,
  GuessObjectDraft,
  GuessObjectSearchResult,
  WorldLocation,
  WorldLocationSearchResult,
} from '@cityborn/api';
import {
  buildFullGuessObject,
  buildGuessObjectDraft,
  buildWorldLocation,
  ErrorCode,
} from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { GuessObjectService } from '../guess-object/guess-object.service';
import type {
  NominatimItemResponse,
  NominatimService,
} from '../nominatim/nominatim.service';
import type { WikidataService } from '../wikidata/wikidata.service';
import type { WorldLocationService } from '../world-location/world-location.service';
import { SearchService } from './search.service';

function buildSearchService() {
  const guessObjectService: DeepMocked<GuessObjectService> =
    createMock<GuessObjectService>();
  const wikidataService: DeepMocked<WikidataService> =
    createMock<WikidataService>();
  const worldLocationService: DeepMocked<WorldLocationService> =
    createMock<WorldLocationService>();
  const nominatimService: DeepMocked<NominatimService> =
    createMock<NominatimService>();
  const searchService: SearchService = new SearchService(
    guessObjectService,
    wikidataService,
    worldLocationService,
    nominatimService,
  );

  return {
    searchService,
    guessObjectService,
    wikidataService,
    worldLocationService,
    nominatimService,
  };
}

describe('SearchService.searchGuessObjectByExternalId', () => {
  it('returns the persisted object when available', async () => {
    const {
      searchService,
      guessObjectService,
      wikidataService,
    }: ReturnType<typeof buildSearchService> = buildSearchService();
    const persisted: FullGuessObject = buildFullGuessObject();
    guessObjectService.findFullBy.mockResolvedValue([persisted]);

    const result: GuessObjectSearchResult =
      await searchService.searchGuessObjectByExternalId('Q243');

    expect(result).toBe(persisted);
    expect(wikidataService.findById).not.toHaveBeenCalled();
  });

  it('enriches a Wikidata draft with its location', async () => {
    const {
      searchService,
      guessObjectService,
      wikidataService,
      worldLocationService,
      nominatimService,
    }: ReturnType<typeof buildSearchService> = buildSearchService();
    const nominatimItem: NominatimItemResponse = {
      place_id: '1',
      osm_type: 'relation',
      osm_id: '7444',
      lat: '48.8566',
      lon: '2.3522',
      name: 'Paris',
      display_name: 'Paris, France',
      addresstype: 'city',
      geojson: { type: 'Point', coordinates: [2.3522, 48.8566] },
    };
    guessObjectService.findFullBy.mockResolvedValue([]);
    wikidataService.findById.mockResolvedValue({
      id: 'Q243',
      label: 'Eiffel Tower',
      world_location_id: '7444',
      osm_type: 'relation',
    });
    worldLocationService.findByExternalIdentifier.mockResolvedValue(null);
    nominatimService.findByOsmId.mockResolvedValue(nominatimItem);

    const result: GuessObjectSearchResult =
      await searchService.searchGuessObjectByExternalId('Q243');

    expect(result.world_location).toEqual({
      id: '7444',
      osm_type: 'relation',
      name: 'Paris',
      display_name: 'Paris, France',
      addresstype: 'city',
      centroid: [48.8566, 2.3522],
      source: { provider: 'nominatim', external_id: '7444' },
      geometry: { type: 'Point', coordinates: [2.3522, 48.8566] },
    });
  });
});

describe('SearchService.searchGuessObjectByName', () => {
  it('merges database-only drafts and replaces external duplicates', async () => {
    const {
      searchService,
      guessObjectService,
      wikidataService,
    }: ReturnType<typeof buildSearchService> = buildSearchService();
    const persistedDraft: GuessObjectDraft = buildGuessObjectDraft({
      name: 'Persisted tower',
    });
    const localDraft: GuessObjectDraft = buildGuessObjectDraft({
      name: 'Local only',
      source: { provider: 'manual', external_id: 'local-1' },
    });
    wikidataService.searchByName.mockResolvedValue({
      results: [
        { id: 'Q243', label: 'Remote tower' },
        { id: 'Q90', label: 'Paris' },
      ],
    });
    guessObjectService.searchDraftByName.mockResolvedValue([
      persistedDraft,
      localDraft,
    ]);

    const drafts: GuessObjectSearchResult[] =
      await searchService.searchGuessObjectByName('tower');

    expect(drafts.map(({ name }) => name)).toEqual([
      'Persisted tower',
      'Paris',
      'Local only',
    ]);
  });
});

describe('SearchService.searchWorldLocationById', () => {
  it('returns a persisted location without calling Nominatim', async () => {
    const {
      searchService,
      worldLocationService,
      nominatimService,
    }: ReturnType<typeof buildSearchService> = buildSearchService();
    const worldLocation: WorldLocation = buildWorldLocation();
    worldLocationService.findByExternalIdentifier.mockResolvedValue(
      worldLocation,
    );

    const location: WorldLocationSearchResult =
      await searchService.searchWorldLocationById('7444', 'relation');

    expect(location.id).toBe('location-1');
    expect(worldLocationService.findByExternalIdentifier).toHaveBeenCalledWith(
      'relation',
      '7444',
    );
    expect(nominatimService.findByOsmId).not.toHaveBeenCalled();
  });

  it('rejects when neither source has the location', async () => {
    const {
      searchService,
      worldLocationService,
      nominatimService,
    }: ReturnType<typeof buildSearchService> = buildSearchService();
    worldLocationService.findByExternalIdentifier.mockResolvedValue(null);
    nominatimService.findByOsmId.mockResolvedValue(null);

    await expect(
      searchService.searchWorldLocationById('missing', 'relation'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.WORLD_LOCATION_NOT_FOUND },
    });
  });

  it('maps a Nominatim location', async () => {
    const {
      searchService,
      worldLocationService,
      nominatimService,
    }: ReturnType<typeof buildSearchService> = buildSearchService();
    const nominatimItem: NominatimItemResponse = {
      place_id: '1',
      osm_type: 'relation',
      osm_id: '7444',
      lat: '48.8566',
      lon: '2.3522',
      name: 'Paris',
      display_name: 'Paris, France',
      addresstype: 'city',
      geojson: { type: 'Point', coordinates: [2.3522, 48.8566] },
    };
    worldLocationService.findByExternalIdentifier.mockResolvedValue(null);
    nominatimService.findByOsmId.mockResolvedValue(nominatimItem);

    const location: WorldLocationSearchResult =
      await searchService.searchWorldLocationById('7444', 'relation');

    expect(location.source.external_id).toBe('7444');
  });
});

describe('SearchService.searchWorldLocationByName', () => {
  it('maps every Nominatim result', async () => {
    const {
      searchService,
      nominatimService,
    }: ReturnType<typeof buildSearchService> = buildSearchService();
    const nominatimItem: NominatimItemResponse = {
      place_id: '1',
      osm_type: 'relation',
      osm_id: '7444',
      lat: '48.8566',
      lon: '2.3522',
      name: 'Paris',
      display_name: 'Paris, France',
      addresstype: 'city',
      geojson: { type: 'Point', coordinates: [2.3522, 48.8566] },
    };
    nominatimService.searchByName.mockResolvedValue({
      results: [nominatimItem],
    });

    const locations: WorldLocationSearchResult[] =
      await searchService.searchWorldLocationByName('Paris');

    expect(locations).toHaveLength(1);
  });
});
