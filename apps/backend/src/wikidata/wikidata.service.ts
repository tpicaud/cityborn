import { ErrorCode } from '@cityborn/errors';
import { Injectable, InternalServerErrorException } from '@nestjs/common';

export interface WikidataSearchResponse {
  results: WikidataItemResponse[];
}

export interface WikidataItemResponse {
  id: string;
  label: string;
  image?: string;
  description?: string;
  short_description?: string;
  world_location_id?: string;
  osm_type?: string;
}

@Injectable()
export class WikidataService {
  private WIKIDATA_API_URL = 'https://www.wikidata.org/w/api.php';
  private WIKIDATA_URL = 'https://www.wikidata.org/wiki';

  constructor() {}

  /**
   * Wikidata search by name
   */
  async searchByName(q: string): Promise<WikidataSearchResponse> {
    const params = new URLSearchParams({
      action: 'wbsearchentities',
      format: 'json',
      language: 'fr',
      uselanguage: 'fr',
      search: q,
    });

    try {
      const response = await fetch(`${this.WIKIDATA_API_URL}?${params}`);
      if (!response.ok) {
        throw new Error(`Erreur Wikidata: ${response.statusText}`);
      }

      const data = await response.json();

      const wikidata_response: WikidataSearchResponse = {
        results: data.search
          .filter((item: any) => item.label && item.label.trim() !== '')
          .map((item: any) => ({
            id: item.id,
            label: item.label,
            short_description: item.description || '',
          })),
      };

      return wikidata_response;
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.GUESS_OBJECTS_SEARCH_FAILED,
        message: `Error retrieving wikidata search results: ${error.message}`,
      });
    }
  }

  /**
   * Wikidata search by id
   */
  async findById(id: string): Promise<WikidataItemResponse> {
    try {
      const response = await fetch(
        `${this.WIKIDATA_URL}/Special:EntityData/${id}.json`,
      );
      if (!response.ok) {
        throw new Error(`Erreur Wikidata: ${response.statusText}`);
      }

      const data = await response.json();
      const entity = data.entities[id];

      // Build image
      const rawImageName = entity.claims?.P18?.[0]?.mainsnak?.datavalue?.value;
      const imageUrl = rawImageName
        ? await this.resolveWikimediaImageUrl(rawImageName)
        : undefined;

      // Build osm id
      const osm = await this.getOSMId(
        entity.claims?.P19?.[0]?.mainsnak?.datavalue?.value.id,
      );

      const wikidataItem: WikidataItemResponse = {
        id: entity.id.toString(),
        label: entity.labels.fr?.value || entity.labels.en?.value || 'Unknown',
        short_description:
          (entity.descriptions.fr?.value || entity.descriptions.en?.value) ??
          undefined,
        image: imageUrl,
        world_location_id: osm ? osm.world_location_id : undefined,
        osm_type: osm ? osm.osm_type : undefined,
      };

      return wikidataItem;
    } catch (error) {
      throw new InternalServerErrorException({
        code: ErrorCode.GUESS_OBJECTS_SEARCH_FAILED,
        message: `Error retrieving Wikidata entity ${id}: ${error.message}`,
      });
    }
  }

  // Auxiliary
  private async getOSMId(
    place_id: string,
  ): Promise<{ world_location_id: string; osm_type: string } | undefined> {
    if (!place_id) return undefined;

    const response = await fetch(
      `https://www.wikidata.org/wiki/Special:EntityData/${place_id}.json`,
    );

    if (!response.ok) {
      throw new Error(`Erreur Wikidata: ${response.statusText}`);
    }

    const data = await response.json();
    const entity = data.entities[place_id];

    const osmIdClaim = entity.claims?.P402?.[0]?.mainsnak?.datavalue?.value
      ? {
          world_location_id:
            entity.claims?.P402?.[0]?.mainsnak?.datavalue?.value.toString(),
          osm_type: 'relation',
        }
      : {
          world_location_id:
            entity.claims?.P11693?.[0]?.mainsnak?.datavalue?.value.toString(),
          osm_type: 'node',
        };
    return osmIdClaim ?? undefined;
  }

  private async resolveWikimediaImageUrl(
    rawImageName: string,
  ): Promise<string | undefined> {
    const params = new URLSearchParams({
      action: 'query',
      titles: `File:${rawImageName}`,
      prop: 'imageinfo',
      iiprop: 'url',
      format: 'json',
    });

    const response = await fetch(
      `https://commons.wikimedia.org/w/api.php?${params}`,
    );
    if (!response.ok) return undefined;

    const data = await response.json();
    const pages = data.query?.pages;
    const page = pages?.[Object.keys(pages)[0]];
    return page?.imageinfo?.[0]?.url ?? undefined;
  }
}
