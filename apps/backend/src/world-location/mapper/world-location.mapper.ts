import { WorldLocation as PrismaWorldLocation } from "@prisma/client";
import { NominatimItemResponse, NominatimSearchResponse } from "src/nominatim/nominatim.service";
import { WorldLocationDto, WorldLocationSearchResponseDto } from "../dto/world-location.dto";

type PrismaWorldLocationWithRelations = PrismaWorldLocation & {
    parent?: PrismaWorldLocation;
    children?: PrismaWorldLocation;
};

export class WorldLocationMapper {
    static toWorldLocationDto(prismaWorldLocation: PrismaWorldLocationWithRelations): WorldLocationDto {
        return {
            id: prismaWorldLocation.id,
            name: prismaWorldLocation.name,
            display_name: prismaWorldLocation.display_name ?? undefined,
            type: prismaWorldLocation.type,
            geometry: prismaWorldLocation.geometry as unknown as {
                type: 'Point' | 'Polygon' | 'MultiPolygon';
                coordinates: number[] | number[][] | number[][][];
            },
            level: prismaWorldLocation.level ?? undefined,
            iso_code: prismaWorldLocation.iso_code ?? undefined,
            parent: prismaWorldLocation.parent,
            centroid: prismaWorldLocation.centroid as unknown as [number, number] ?? undefined,
            source: prismaWorldLocation.source as unknown as {
                provider: string;
                external_id: string;
            } ?? undefined
        }
    }

    static toWorldLocationDtoFromNominatimItem(nominatimItem: NominatimItemResponse): WorldLocationDto {
        return {
            id: nominatimItem.osm_id,
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
                provider: "nominatim",
                external_id: nominatimItem.place_id
            }
        }
    }

    static toWorldLocationSearchResponseDto(response: NominatimSearchResponse): WorldLocationSearchResponseDto {
        return {
            candidates: response.results.map(item => this.toWorldLocationDtoFromNominatimItem(item))
        }
    }
}