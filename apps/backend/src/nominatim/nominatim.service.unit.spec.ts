import { createMock } from '../../test/support/createMock';
import { NominatimService } from './nominatim.service';

function mockFetchResponse(
  body: unknown,
  overrides: Partial<Response> = {},
): jest.SpiedFunction<typeof fetch> {
  const response = createMock<Response>({
    ok: true,
    statusText: 'OK',
    ...overrides,
  });
  response.json.mockResolvedValue(body);
  return jest.spyOn(global, 'fetch').mockResolvedValue(response);
}

describe('NominatimService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('keeps the highest-ranked result for each display name', async () => {
    mockFetchResponse([
      {
        place_id: 1,
        osm_type: 'relation',
        osm_id: 10,
        lat: '48.8',
        lon: '2.3',
        display_name: 'Paris, France',
        namedetails: { 'name:fr': 'Paris ancien' },
        place_rank: 10,
      },
      {
        place_id: 2,
        osm_type: 'relation',
        osm_id: 20,
        lat: '48.9',
        lon: '2.4',
        display_name: 'Paris, France',
        namedetails: { 'name:fr': 'Paris' },
        place_rank: 20,
      },
    ]);
    const nominatimService = new NominatimService();

    const result = await nominatimService.searchByName('Paris');

    expect(result.results).toHaveLength(1);
    expect(result.results[0]).toMatchObject({
      place_id: '2',
      osm_id: '20',
      name: 'Paris',
    });
  });

  it('builds a GeoJSON point with longitude before latitude', async () => {
    mockFetchResponse([
      {
        osm_type: 'node',
        lat: '48.8',
        lon: '2.3',
        display_name: 'Paris, France',
        place_rank: 20,
      },
    ]);
    const nominatimService = new NominatimService();

    const result = await nominatimService.searchByName('Paris');

    expect(result.results[0].geojson).toEqual({
      type: 'Point',
      coordinates: [2.3, 48.8],
    });
  });

  it('throws when the search endpoint rejects the request', async () => {
    mockFetchResponse([], { ok: false, statusText: 'Too Many Requests' });
    const nominatimService = new NominatimService();

    await expect(nominatimService.searchByName('Paris')).rejects.toThrow(
      'Nominatim search failed: Too Many Requests',
    );
  });

  it('returns null when an OpenStreetMap identifier is unknown', async () => {
    const fetchSpy = mockFetchResponse([]);
    const nominatimService = new NominatimService();

    await expect(
      nominatimService.findByOsmId('7444', 'relation'),
    ).resolves.toBeNull();
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('osm_ids=R7444'),
      expect.any(Object),
    );
  });
});
