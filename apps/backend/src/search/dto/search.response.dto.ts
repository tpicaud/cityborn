import { Type } from "class-transformer";
import { GuessObjectCandidateDto } from "src/guess-object/dto/search-guess-object.response.dto";
import { WorldLocationDto } from "src/world-location/dto/world-location.dto";

export class SearchGuessObjectResponseDto {
    @Type(() => GuessObjectCandidateDto)
    results: GuessObjectCandidateDto | GuessObjectCandidateDto[]
}

export class SearchWorldLocationResponseDto {
    @Type(() => WorldLocationDto)
    results: WorldLocationDto | WorldLocationDto[]
}