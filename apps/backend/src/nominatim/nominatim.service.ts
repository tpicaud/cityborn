import { Injectable } from '@nestjs/common';
import { USER_AGENT } from '../common/constants';

export interface NominatimSearchResponse {
  results: NominatimItemResponse[];
}

export interface NominatimItemResponse {
  place_id: string;
  osm_type: 'node' | 'way' | 'relation';
  osm_id: string;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  addresstype?: string;
  geojson: {
    type: string;
    coordinates: number[] | number[][] | number[][][];
  };
}

interface NominatimRawItem {
  place_id?: number | string;
  osm_type: string;
  osm_id?: number | string;
  lat: string;
  lon: string;
  display_name: string;
  namedetails?: Record<string, string>;
  addresstype?: string;
  place_rank: number;
  geojson?: NominatimItemResponse['geojson'];
}

@Injectable()
export class NominatimService {
  private readonly NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org';

  async searchByName(q: string): Promise<NominatimSearchResponse> {
    const params: Record<string, string> = {
      q,
      format: 'json',
      addressdetails: '1',
      extratags: '1',
      'accept-language': 'fr',
      limit: '20',
    };

    const queryString = new URLSearchParams(params).toString();
    const url = `${this.NOMINATIM_API_URL}/search?${queryString}`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim search failed: ${response.statusText}`);
    }

    const data: NominatimRawItem[] = await response.json();

    const grouped: Record<string, NominatimRawItem> = {};
    for (const item of data) {
      const key = item.display_name;
      if (!grouped[key] || item.place_rank > grouped[key].place_rank) {
        grouped[key] = item;
      }
    }

    const results: NominatimItemResponse[] = Object.values(grouped).map(
      (item) => ({
        place_id: item.place_id?.toString() ?? '',
        osm_type: item.osm_type as NominatimItemResponse['osm_type'],
        osm_id: item.osm_id?.toString() ?? '',
        lat: item.lat,
        lon: item.lon,
        name:
          item.namedetails?.['name:fr'] ||
          item.display_name?.split(',')[0] ||
          'Inconnu',
        display_name: item.display_name,
        addresstype: item.addresstype,
        place_rank: item.place_rank,
        geojson: item.geojson ?? {
          type: 'Point',
          coordinates: [Number(item.lat), Number(item.lon)],
        },
      }),
    );

    return { results };
  }

  async findByOsmId(
    osm_id: string,
    osm_type: 'node' | 'way' | 'relation' = 'relation',
  ): Promise<NominatimItemResponse | null> {
    let id: string;
    switch (osm_type) {
      case 'node':
        id = `N${osm_id}`;
        break;
      case 'way':
        id = `W${osm_id}`;
        break;
      case 'relation':
        id = `R${osm_id}`;
        break;
      default:
        id = `R${osm_id}`;
    }

    const params: Record<string, string> = {
      osm_ids: id,
      format: 'json',
      polygon_geojson: '1',
      polygon_threshold: '0.0001',
      addressdetails: '1',
      extratags: '1',
      namedetails: '1',
      'accept-language': 'fr',
    };

    const queryString = new URLSearchParams(params).toString();

    const response = await fetch(
      `${this.NOMINATIM_API_URL}/lookup?${queryString}`,
      {
        headers: {
          'User-Agent': USER_AGENT,
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Nominatim request failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.length) {
      return null;
    }

    return data[0];
  }
}
