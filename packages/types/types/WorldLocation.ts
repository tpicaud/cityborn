export interface WorldLocation {
    id: string;
    osm_type: string;
    name: string;
    type: 'area' | 'point';
    geometry?: {
        type: 'Point' | 'Polygon' | 'MultiPolygon';
        coordinates: number[] | number[][] | number[][][];
    }

    // Optional
    display_name?: string;
    addresstype?: string;
    level?: 'ADM1' | 'ADM2' | 'ADM3' | 'ADM4';
    iso_code?: string;
    centroid?: [number, number];
    source?: {
        provider: string;
        external_id: string;
    }
}

export type WorldLocationPreview = Pick<WorldLocation, 'id' | 'name' | 'display_name'>;