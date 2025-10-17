import { GuessObjectDto, WorldLocationDto } from "../dto/guess-object.dto";
import { GuessObject as PrismaGuessObject, WorldLocation as PrismaWorldLocation } from '@prisma/client';

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

    static toWorldLocationDto(prismaWorldLocation: PrismaWorldLocationWithRelations): WorldLocationDto {
        return {
            id: prismaWorldLocation.id,
            name: prismaWorldLocation.name,
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
}