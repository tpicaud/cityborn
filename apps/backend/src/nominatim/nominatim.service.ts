import { Injectable } from '@nestjs/common';

export interface NominatimItemResponse {
    place_id: string;
    osm_id: string;
    lat: string;
    lon: string
    name: string;
    display_name: string;
    geojson: {
        type: string;
        coordinates: number[] | number[][] | number[][][];
    }
}

@Injectable()
export class NominatimService {
    private readonly NOMINATIM_API_URL = 'https://nominatim.openstreetmap.org';

    constructor() { }

    async findByOsmId(osm_id: string, osm_type: 'N' | 'W' | 'R' = 'R'): Promise<NominatimItemResponse | null> {
        try {
            const params: Record<string, string> = {
                osm_ids: `${osm_type}${osm_id}`,
                format: 'json',
                polygon_geojson: '1',   // inclut la géométrie GeoJSON
                polygon_threshold: '0.05', // simplification de la géométrie
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
