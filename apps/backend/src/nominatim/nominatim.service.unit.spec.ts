import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { NominatimSearchResponse } from './nominatim.service';
import { NominatimService } from './nominatim.service';

describe('NominatimService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('searchByName', () => {
    it('keeps the highest-ranked result for each display name', async () => {
      const rawResults: {
        place_id: number;
        osm_type: string;
        osm_id: number;
        lat: string;
        lon: string;
        display_name: string;
        namedetails: { 'name:fr': string };
        place_rank: number;
      }[] = [
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
      ];
      const response: DeepMocked<Response> = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      response.json.mockResolvedValue(rawResults);
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const nominatimService: NominatimService = new NominatimService();

      const result: NominatimSearchResponse =
        await nominatimService.searchByName('Paris');

      expect(result.results).toHaveLength(1);
      expect(result.results[0]).toMatchObject({
        place_id: '2',
        osm_id: '20',
        name: 'Paris',
      });
    });

    it('builds a GeoJSON point with longitude before latitude', async () => {
      const rawResults: {
        osm_type: string;
        lat: string;
        lon: string;
        display_name: string;
        place_rank: number;
      }[] = [
        {
          osm_type: 'node',
          lat: '48.8',
          lon: '2.3',
          display_name: 'Paris, France',
          place_rank: 20,
        },
      ];
      const response: DeepMocked<Response> = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      response.json.mockResolvedValue(rawResults);
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const nominatimService: NominatimService = new NominatimService();

      const result: NominatimSearchResponse =
        await nominatimService.searchByName('Paris');

      expect(result.results[0].geojson).toEqual({
        type: 'Point',
        coordinates: [2.3, 48.8],
      });
    });

    it('throws when the search endpoint rejects the request', async () => {
      const response: DeepMocked<Response> = createMock<Response>({
        ok: false,
        statusText: 'Too Many Requests',
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const nominatimService: NominatimService = new NominatimService();

      await expect(nominatimService.searchByName('Paris')).rejects.toThrow(
        'Nominatim search failed: Too Many Requests',
      );
    });
  });

  describe('findByOsmId', () => {
    it('returns null when an OpenStreetMap identifier is unknown', async () => {
      const response: DeepMocked<Response> = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      response.json.mockResolvedValue([]);
      const fetchSpy: jest.SpiedFunction<typeof global.fetch> = jest
        .spyOn(global, 'fetch')
        .mockResolvedValue(response);
      const nominatimService: NominatimService = new NominatimService();

      await expect(
        nominatimService.findByOsmId('7444', 'relation'),
      ).resolves.toBeNull();
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.stringContaining('osm_ids=R7444'),
        expect.any(Object),
      );
    });
  });
});
