import { GuessObjectCandidate } from "@cityborn/types";
import { Type } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class GuessObjectCandidateDto implements GuessObjectCandidate {
    @IsString()
    external_id: string;

    @IsString()
    label: string;

    @IsOptional()
    @IsString()
    description?: string;

}

export class GuessObjectsSearchResponseDto {
    @Type(() => GuessObjectCandidateDto)
    candidates: GuessObjectCandidate[];
}