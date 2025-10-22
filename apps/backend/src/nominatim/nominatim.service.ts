import { ErrorCode } from '@cityborn/errors';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WorldLocationDto } from 'src/world-location/dto/world-location.dto';

export interface NominatimSearchResponse {
    results: NominatimItemResponse[];
}

export interface NominatimItemResponse {
    place_id: string;
    osm_id: string;
    lat: string;
    lon: string
    name: string;
    display_name: string;
    addresstype?: string;
    geojson: {
        type: string;
        coordinates: number[] | number[][] | number[][][];
    }
}

@Injectable()
export class NominatimService {
    private readonly NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org';

    constructor() { }

    async searchByName(q: string): Promise<NominatimSearchResponse> {
        try {
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
                    'User-Agent': 'Cityborn/1.0 (cityborn.contact@gmail.app)',
                },
            });

            if (!response.ok) {
                throw new Error(`Nominatim search failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Garde uniquement les relations
            const filtered_data = data.filter((r: any) => r.osm_type === 'relation');

            // Group by display_name et garde celui avec le place_rank le plus haut
            const grouped: Record<string, any> = {};
            for (const item of filtered_data) {
                const key = item.display_name;
                if (!grouped[key] || item.place_rank > grouped[key].place_rank) {
                    grouped[key] = item;
                }
            }

            const results: NominatimItemResponse[] = Object.values(grouped).map((item: any) => ({
                place_id: item.place_id?.toString() ?? '',
                osm_id: item.osm_id?.toString() ?? '',
                lat: item.lat,
                lon: item.lon,
                name: item.namedetails?.['name:fr'] || item.display_name?.split(',')[0] || 'Inconnu',
                display_name: item.display_name,
                addresstype: item.addresstype,
                place_rank: item.place_rank,
                geojson: item.geojson ?? {
                    type: 'Point',
                    coordinates: [Number(item.lon), Number(item.lat)],
                },
            }));

            return { results };
        } catch (error: any) {
            console.error('Error fetching Nominatim data:', error);

            throw new InternalServerErrorException({
                code: ErrorCode.WORLD_LOCATION_SEARCH_FAILED,
                message: `Error retrieving nominatim search results: ${error.message}`,
            });
        }
    }


    async findByOsmId(osm_id: string, osm_type: 'N' | 'W' | 'R' = 'R'): Promise<NominatimItemResponse | null> {
        try {
            const params: Record<string, string> = {
                osm_ids: `${osm_type}${osm_id}`,
                format: 'json',
                polygon_geojson: '1',   // inclut la géométrie GeoJSON
                polygon_threshold: '0.001', // simplification de la géométrie
                addressdetails: '1',     // inclut les détails d'adresse
                extratags: '1',          // inclut les métadonnées OSM
                namedetails: '1',        // inclut les noms alternatifs
                'accept-language': 'fr'
            };

            const queryString = new URLSearchParams(params).toString();

            const response = await fetch(
                `${this.NOMINATIM_API_URL}/lookup?${queryString}`, {
                headers: {
                    'User-Agent': 'Cityborn/1.0 (cityborn.contact@gmail.app)',
                },
            });

            if (!response.ok) {
                throw new Error(`Nominatim request failed: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.length) {
                throw new Error(`No results found for OSM id ${osm_id}`);
            }

            return data[0];
        } catch (error) {
            console.error('Error fetching Nominatim data:', error);
            return null;
        }
    }
}
