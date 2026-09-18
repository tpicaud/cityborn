import { createMock } from '@golevelup/ts-jest';
import { WikidataService } from './wikidata.service';

describe('WikidataService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('searchByName', () => {
    it('filters unnamed search results and maps descriptions', async () => {
      const responseData = {
        search: [
          { id: 'Q243', label: 'Tour Eiffel', description: 'monument' },
          { id: 'Q1', label: '   ', description: 'ignored' },
        ],
      };
      const response = createMock<Response>({ ok: true, statusText: 'OK' });
      response.json.mockResolvedValue(responseData);
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const wikidataService = new WikidataService();

      const result = await wikidataService.searchByName('Tour Eiffel');

      expect(result.results).toEqual([
        {
          id: 'Q243',
          label: 'Tour Eiffel',
          short_description: 'monument',
        },
      ]);
    });

    it('throws when Wikidata rejects a search', async () => {
      const response = createMock<Response>({
        ok: false,
        statusText: 'Unavailable',
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const wikidataService = new WikidataService();

      await expect(wikidataService.searchByName('Paris')).rejects.toThrow(
        'Erreur Wikidata: Unavailable',
      );
    });
  });

  describe('findById', () => {
    it('maps an entity without optional image or birthplace', async () => {
      const responseData = {
        entities: {
          Q243: {
            id: 'Q243',
            labels: { fr: { value: 'Tour Eiffel' } },
            descriptions: { fr: { value: 'monument parisien' } },
            claims: {},
          },
        },
      };
      const response = createMock<Response>({ ok: true, statusText: 'OK' });
      response.json.mockResolvedValue(responseData);
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const wikidataService = new WikidataService();

      const result = await wikidataService.findById('Q243');

      expect(result).toEqual({
        id: 'Q243',
        label: 'Tour Eiffel',
        short_description: 'monument parisien',
        image: undefined,
        world_location_id: undefined,
        osm_type: undefined,
      });
    });

    it('uses another available label when French and English are absent', async () => {
      const responseData = {
        entities: {
          Q243: {
            id: 'Q243',
            labels: { de: { value: 'Eiffelturm' } },
            descriptions: {},
            claims: {},
          },
        },
      };
      const response = createMock<Response>({ ok: true, statusText: 'OK' });
      response.json.mockResolvedValue(responseData);
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const wikidataService = new WikidataService();

      const result = await wikidataService.findById('Q243');

      expect(result.label).toBe('Eiffelturm');
    });

    it('resolves the image and OpenStreetMap relation of an entity', async () => {
      const entityData = {
        entities: {
          Q1: {
            id: 'Q1',
            labels: { en: { value: 'Person' } },
            descriptions: {},
            claims: {
              P18: [{ mainsnak: { datavalue: { value: 'Portrait.jpg' } } }],
              P19: [{ mainsnak: { datavalue: { value: { id: 'Q90' } } } }],
            },
          },
        },
      };
      const imageData = {
        query: {
          pages: {
            1: { imageinfo: [{ url: 'https://images.test/portrait.jpg' }] },
          },
        },
      };
      const locationData = {
        entities: {
          Q90: {
            claims: {
              P402: [{ mainsnak: { datavalue: { value: 7444 } } }],
            },
          },
        },
      };
      const entityResponse = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      const imageResponse = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      const locationResponse = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      entityResponse.json.mockResolvedValue(entityData);
      imageResponse.json.mockResolvedValue(imageData);
      locationResponse.json.mockResolvedValue(locationData);
      jest
        .spyOn(global, 'fetch')
        .mockResolvedValueOnce(entityResponse)
        .mockResolvedValueOnce(imageResponse)
        .mockResolvedValueOnce(locationResponse);
      const wikidataService = new WikidataService();

      const result = await wikidataService.findById('Q1');

      expect(result).toMatchObject({
        image: 'https://images.test/portrait.jpg',
        world_location_id: '7444',
        osm_type: 'relation',
      });
    });
  });
});
