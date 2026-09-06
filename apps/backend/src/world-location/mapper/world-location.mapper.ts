import { WorldLocation } from '@cityborn/api';
import type {
  WorldLocation as PrismaWorldLocation,
  WorldLocationGeometry as PrismaWorldLocationGeometry,
} from '@prisma/client';
import { type NominatimItemResponse } from '../../nominatim/nominatim.service';

export type PrismaWorldLocationWithGeometry = PrismaWorldLocation & {
  geometry: PrismaWorldLocationGeometry | null;
};

export const WorldLocationMapper = {
  toWorldLocation(
    prismaWorldLocation: PrismaWorldLocationWithGeometry,
  ): WorldLocation {
    return {
      id: prismaWorldLocation.id,
      osm_type: prismaWorldLocation.osm_type,
      name: prismaWorldLocation.name,
      display_name: prismaWorldLocation.display_name,
      addresstype: prismaWorldLocation.addresstype ?? undefined,
      geometry: (prismaWorldLocation.geometry?.data ?? null) as unknown as {
        type: 'Point' | 'Polygon' | 'MultiPolygon';
        coordinates: number[] | number[][] | number[][][];
      },
      centroid: prismaWorldLocation.centroid as unknown as [number, number],
      source: prismaWorldLocation.source as unknown as {
        provider: string;
        external_id: string;
      },
    };
  },

  toWorldLocationFromNominatimItem(
    nominatimItem: NominatimItemResponse,
  ): WorldLocation {
    return {
      id: nominatimItem.osm_id.toString(),
      osm_type: nominatimItem.osm_type,
      name: nominatimItem.name,
      display_name: nominatimItem.display_name,
      addresstype: nominatimItem.addresstype ?? undefined,
      geometry: nominatimItem.geojson as unknown as {
        type: 'Point' | 'Polygon' | 'MultiPolygon';
        coordinates: number[] | number[][] | number[][][];
      },
      centroid: [Number(nominatimItem.lat), Number(nominatimItem.lon)],
      source: {
        provider: 'nominatim',
        external_id: String(nominatimItem.osm_id),
      },
    };
  },
};
