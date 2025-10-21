import { WikidataItemResponse, WikidataSearchResponse } from "src/wikidata/wikidata.service";
import { GuessObjectDto, WorldLocationDto } from "../dto/guess-object.dto";
import { GuessObject as PrismaGuessObject, WorldLocation as PrismaWorldLocation } from '@prisma/client';
import { GuessObjectCandidateDto, GuessObjectsSearchResponseDto } from "../dto/search-guess-object.response.dto";
import { NominatimItemResponse } from "src/nominatim/nominatim.service";

type PrismaGuessObjectWithRelations = PrismaGuessObject & {
    world_location?: PrismaWorldLocation;
};

type PrismaWorldLocationWithRelations = PrismaWorldLocation & {
    parent?: PrismaWorldLocation;
    children?: PrismaWorldLocation;
};

export class GuessObjectMapper {
    static toGuessObjectDto(prismaGuessObject: PrismaGuessObjectWithRelations): GuessObjectDto {
        return {
            id: prismaGuessObject.id,
            name: prismaGuessObject.name,
            image: prismaGuessObject.image ?? undefined,
            description: prismaGuessObject.description ?? undefined,
            short_description: prismaGuessObject.short_description ?? undefined,
            world_location: prismaGuessObject.world_location ? this.toWorldLocationDto(prismaGuessObject.world_location) : undefined
        }
    }

    static toGuessObjectCandidateDto(response: WikidataItemResponse): GuessObjectCandidateDto {
        return {
            external_id: response.id,
            name: response.label,
            description: response.description ?? undefined,
            short_description: response.short_description ?? undefined,
            image: response.image ?? undefined,
            world_location_id: response.world_location_id ?? undefined,
        }
    }

    static toGuessObjectsSearchResponseDto(response: WikidataSearchResponse): GuessObjectsSearchResponseDto {
        return {
            candidates: response.results.map(item => this.toGuessObjectCandidateDto(item))
        }
    }

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
}