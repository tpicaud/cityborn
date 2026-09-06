import {
  buildFullGuessObject,
  buildGuessObjectDraft,
  buildWorldLocation,
  ErrorCode,
} from '@cityborn/api';
import { createMock } from '../../test/support/createMock';
import type { GuessObjectService } from '../guess-object/guess-object.service';
import type { NominatimService } from '../nominatim/nominatim.service';
import type { WikidataService } from '../wikidata/wikidata.service';
import type { WorldLocationService } from '../world-location/world-location.service';
import { SearchService } from './search.service';

function buildSearchService() {
  const guessObjectService = createMock<GuessObjectService>();
  const wikidataService = createMock<WikidataService>();
  const worldLocationService = createMock<WorldLocationService>();
  const nominatimService = createMock<NominatimService>();
  const searchService = new SearchService(
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

const nominatimItem = {
  place_id: '1',
  osm_type: 'relation' as const,
  osm_id: '7444',
  lat: '48.8566',
  lon: '2.3522',
  name: 'Paris',
  display_name: 'Paris, France',
  addresstype: 'city',
  geojson: { type: 'Point', coordinates: [2.3522, 48.8566] },
};

describe('SearchService.searchGuessObjectByExternalId', () => {
  it('returns the persisted object when available', async () => {
    const { searchService, guessObjectService, wikidataService } =
      buildSearchService();
    const persisted = buildFullGuessObject();
    guessObjectService.findFullBy.mockResolvedValue([persisted]);

    const result = await searchService.searchGuessObjectByExternalId('Q243');

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
    } = buildSearchService();
    guessObjectService.findFullBy.mockResolvedValue([]);
    wikidataService.findById.mockResolvedValue({
      id: 'Q243',
      label: 'Eiffel Tower',
      world_location_id: '7444',
      osm_type: 'relation',
    });
    worldLocationService.getWithGeometry.mockResolvedValue(null);
    nominatimService.findByOsmId.mockResolvedValue(nominatimItem);

    const result = await searchService.searchGuessObjectByExternalId('Q243');

    expect(result.world_location).toEqual(buildWorldLocation({ id: '7444' }));
  });
});

describe('SearchService.searchGuessObjectByName', () => {
  it('merges database-only drafts and replaces external duplicates', async () => {
    const { searchService, guessObjectService, wikidataService } =
      buildSearchService();
    wikidataService.searchByName.mockResolvedValue({
      results: [
        { id: 'Q243', label: 'Remote tower' },
        { id: 'Q90', label: 'Paris' },
      ],
    });
    guessObjectService.searchDraftByName.mockResolvedValue([
      buildGuessObjectDraft({ name: 'Persisted tower' }),
      buildGuessObjectDraft({
        name: 'Local only',
        source: { provider: 'manual', external_id: 'local-1' },
      }),
    ]);

    const drafts = await searchService.searchGuessObjectByName('tower');

    expect(drafts.map(({ name }) => name)).toEqual([
      'Persisted tower',
      'Paris',
      'Local only',
    ]);
  });
});

describe('SearchService.searchWorldLocationById', () => {
  it('returns a persisted location without calling Nominatim', async () => {
    const { searchService, worldLocationService, nominatimService } =
      buildSearchService();
    worldLocationService.getWithGeometry.mockResolvedValue(
      buildWorldLocation(),
    );

    const location = await searchService.searchWorldLocationById(
      '7444',
      'relation',
    );

    expect(location.id).toBe('location-1');
    expect(nominatimService.findByOsmId).not.toHaveBeenCalled();
  });

  it('rejects when neither source has the location', async () => {
    const { searchService, worldLocationService, nominatimService } =
      buildSearchService();
    worldLocationService.getWithGeometry.mockResolvedValue(null);
    nominatimService.findByOsmId.mockResolvedValue(null);

    await expect(
      searchService.searchWorldLocationById('missing', 'relation'),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.WORLD_LOCATION_NOT_FOUND },
    });
  });

  it('maps a Nominatim location', async () => {
    const { searchService, worldLocationService, nominatimService } =
      buildSearchService();
    worldLocationService.getWithGeometry.mockResolvedValue(null);
    nominatimService.findByOsmId.mockResolvedValue(nominatimItem);

    const location = await searchService.searchWorldLocationById(
      '7444',
      'relation',
    );

    expect(location.source.external_id).toBe('7444');
  });
});

describe('SearchService.searchWorldLocationByName', () => {
  it('maps every Nominatim result', async () => {
    const { searchService, nominatimService } = buildSearchService();
    nominatimService.searchByName.mockResolvedValue({
      results: [nominatimItem],
    });

    const locations = await searchService.searchWorldLocationByName('Paris');

    expect(locations).toHaveLength(1);
  });
});
