import { createMock } from '../../test/support/createMock';
import { WikidataService } from './wikidata.service';

function buildFetchResponse(
  body: unknown,
  overrides: Partial<Response> = {},
): Response {
  const response = createMock<Response>({
    ok: true,
    statusText: 'OK',
    ...overrides,
  });
  response.json.mockResolvedValue(body);
  return response;
}

describe('WikidataService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('filters unnamed search results and maps descriptions', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      buildFetchResponse({
        search: [
          { id: 'Q243', label: 'Tour Eiffel', description: 'monument' },
          { id: 'Q1', label: '   ', description: 'ignored' },
        ],
      }),
    );
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
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        buildFetchResponse({}, { ok: false, statusText: 'Unavailable' }),
      );
    const wikidataService = new WikidataService();

    await expect(wikidataService.searchByName('Paris')).rejects.toThrow(
      'Erreur Wikidata: Unavailable',
    );
  });

  it('maps an entity without optional image or birthplace', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      buildFetchResponse({
        entities: {
          Q243: {
            id: 'Q243',
            labels: { fr: { value: 'Tour Eiffel' } },
            descriptions: { fr: { value: 'monument parisien' } },
            claims: {},
          },
        },
      }),
    );
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

  it('resolves the image and OpenStreetMap relation of an entity', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        buildFetchResponse({
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
        }),
      )
      .mockResolvedValueOnce(
        buildFetchResponse({
          query: {
            pages: {
              1: { imageinfo: [{ url: 'https://images.test/portrait.jpg' }] },
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        buildFetchResponse({
          entities: {
            Q90: {
              claims: {
                P402: [{ mainsnak: { datavalue: { value: 7444 } } }],
              },
            },
          },
        }),
      );
    const wikidataService = new WikidataService();

    const result = await wikidataService.findById('Q1');

    expect(result).toMatchObject({
      image: 'https://images.test/portrait.jpg',
      world_location_id: '7444',
      osm_type: 'relation',
    });
  });
});
