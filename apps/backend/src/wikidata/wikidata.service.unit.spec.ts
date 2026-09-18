import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type {
  WikidataItemResponse,
  WikidataSearchResponse,
} from './wikidata.service';
import { WikidataService } from './wikidata.service';

describe('WikidataService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('searchByName', () => {
    it('filters unnamed search results and maps descriptions', async () => {
      const responseData: {
        search: { id: string; label: string; description: string }[];
      } = {
        search: [
          { id: 'Q243', label: 'Tour Eiffel', description: 'monument' },
          { id: 'Q1', label: '   ', description: 'ignored' },
        ],
      };
      const response: DeepMocked<Response> = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      response.json.mockResolvedValue(responseData);
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const wikidataService: WikidataService = new WikidataService();

      const result: WikidataSearchResponse =
        await wikidataService.searchByName('Tour Eiffel');

      expect(result.results).toEqual([
        {
          id: 'Q243',
          label: 'Tour Eiffel',
          short_description: 'monument',
        },
      ]);
    });

    it('throws when Wikidata rejects a search', async () => {
      const response: DeepMocked<Response> = createMock<Response>({
        ok: false,
        statusText: 'Unavailable',
      });
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const wikidataService: WikidataService = new WikidataService();

      await expect(wikidataService.searchByName('Paris')).rejects.toThrow(
        'Erreur Wikidata: Unavailable',
      );
    });
  });

  describe('findById', () => {
    it('maps an entity without optional image or birthplace', async () => {
      const responseData: {
        entities: {
          Q243: {
            id: string;
            labels: { fr: { value: string } };
            descriptions: { fr: { value: string } };
            claims: Record<string, never>;
          };
        };
      } = {
        entities: {
          Q243: {
            id: 'Q243',
            labels: { fr: { value: 'Tour Eiffel' } },
            descriptions: { fr: { value: 'monument parisien' } },
            claims: {},
          },
        },
      };
      const response: DeepMocked<Response> = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      response.json.mockResolvedValue(responseData);
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const wikidataService: WikidataService = new WikidataService();

      const result: WikidataItemResponse =
        await wikidataService.findById('Q243');

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
      const responseData: {
        entities: {
          Q243: {
            id: string;
            labels: { de: { value: string } };
            descriptions: Record<string, never>;
            claims: Record<string, never>;
          };
        };
      } = {
        entities: {
          Q243: {
            id: 'Q243',
            labels: { de: { value: 'Eiffelturm' } },
            descriptions: {},
            claims: {},
          },
        },
      };
      const response: DeepMocked<Response> = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      response.json.mockResolvedValue(responseData);
      jest.spyOn(global, 'fetch').mockResolvedValue(response);
      const wikidataService: WikidataService = new WikidataService();

      const result: WikidataItemResponse =
        await wikidataService.findById('Q243');

      expect(result.label).toBe('Eiffelturm');
    });

    it('resolves the image and OpenStreetMap relation of an entity', async () => {
      const entityData: {
        entities: {
          Q1: {
            id: string;
            labels: { en: { value: string } };
            descriptions: Record<string, never>;
            claims: {
              P18: { mainsnak: { datavalue: { value: string } } }[];
              P19: { mainsnak: { datavalue: { value: { id: string } } } }[];
            };
          };
        };
      } = {
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
      const imageData: {
        query: { pages: { 1: { imageinfo: { url: string }[] } } };
      } = {
        query: {
          pages: {
            1: { imageinfo: [{ url: 'https://images.test/portrait.jpg' }] },
          },
        },
      };
      const locationData: {
        entities: {
          Q90: {
            claims: { P402: { mainsnak: { datavalue: { value: number } } }[] };
          };
        };
      } = {
        entities: {
          Q90: {
            claims: {
              P402: [{ mainsnak: { datavalue: { value: 7444 } } }],
            },
          },
        },
      };
      const entityResponse: DeepMocked<Response> = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      const imageResponse: DeepMocked<Response> = createMock<Response>({
        ok: true,
        statusText: 'OK',
      });
      const locationResponse: DeepMocked<Response> = createMock<Response>({
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
      const wikidataService: WikidataService = new WikidataService();

      const result: WikidataItemResponse = await wikidataService.findById('Q1');

      expect(result).toMatchObject({
        image: 'https://images.test/portrait.jpg',
        world_location_id: '7444',
        osm_type: 'relation',
      });
    });
  });
});
