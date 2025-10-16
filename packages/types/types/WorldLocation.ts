export interface WorldLocation {
    id: string;
    name: string;
    type: 'area' | 'point';
    geometry: {
        type: 'Point' | 'Polygon' | 'MultiPolygon';
        coordinates: number[] | number[][] | number[][][];
    }

    // Optional
    level?: 'ADM1' | 'ADM2' | 'ADM3' | 'ADM4';
    iso_code?: string;
    parent?: {
        id: string;
        name: string;
    };
    centroid?: [number, number];
    source?: {
        provider: string;
        external_id: string;
    }
}