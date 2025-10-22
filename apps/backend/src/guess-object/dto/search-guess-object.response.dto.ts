import { GuessObjectCandidate } from "@cityborn/types";
import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";
import { WorldLocationDto } from "src/world-location/dto/world-location.dto";

export class GuessObjectCandidateDto implements GuessObjectCandidate {
    @IsString()
    external_id: string;

    @IsString()
    name: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsString()
    short_description?: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    world_location_id?: string

    @IsOptional()
    @IsString()
    world_location?: WorldLocationDto;

}

export class GuessObjectsSearchResponseDto {
    @Type(() => GuessObjectCandidateDto)
    candidates: GuessObjectCandidateDto[];
}