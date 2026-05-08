import { WorldLocation } from '@cityborn/api';
import type { WorldLocation as PrismaWorldLocation } from '@prisma/client';
import { type NominatimItemResponse } from 'src/nominatim/nominatim.service';

type PrismaWorldLocationWithRelations = PrismaWorldLocation & {
  parent?: PrismaWorldLocation;
  children?: PrismaWorldLocation;
};

export class WorldLocationMapper {
  static toWorldLocation(
    prismaWorldLocation: PrismaWorldLocationWithRelations,
  ): WorldLocation {
    return {
      id: prismaWorldLocation.id,
      osm_type: prismaWorldLocation.osm_type,
      name: prismaWorldLocation.name,
      display_name: prismaWorldLocation.display_name ?? undefined,
      type: prismaWorldLocation.type,
      geometry: prismaWorldLocation.geometry as unknown as {
        type: 'Point' | 'Polygon' | 'MultiPolygon';
        coordinates: number[] | number[][] | number[][][];
      },
      level: prismaWorldLocation.level ?? undefined,
      iso_code: prismaWorldLocation.iso_code ?? undefined,
      centroid:
        (prismaWorldLocation.centroid as unknown as [number, number]) ??
        undefined,
      source:
        (prismaWorldLocation.source as unknown as {
          provider: string;
          external_id: string;
        }) ?? undefined,
    };
  }

  static toWorldLocationFromNominatimItem(
    nominatimItem: NominatimItemResponse,
  ): WorldLocation {
    return {
      id: nominatimItem.osm_id.toString(),
      osm_type: nominatimItem.osm_type,
      name: nominatimItem.name,
      display_name: nominatimItem.display_name ?? undefined,
      addresstype: nominatimItem.addresstype ?? undefined,
      type: nominatimItem.geojson.type === 'Point' ? 'point' : 'area',
      geometry: nominatimItem.geojson as unknown as {
        type: 'Point' | 'Polygon' | 'MultiPolygon';
        coordinates: number[] | number[][] | number[][][];
      },
      //level: nominatimItem.level ?? undefined,
      //iso_code: nominatimItem.iso_code ?? undefined,
      //parent: nominatimItem.parent,
      centroid: [Number(nominatimItem.lat), Number(nominatimItem.lon)],
      source: {
        provider: 'nominatim',
        external_id: nominatimItem.place_id,
      },
    };
  }
}
