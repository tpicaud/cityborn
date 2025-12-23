import { GuessObjectCandidate } from '@cityborn/types';
import { Type } from 'class-transformer';
import { IsOptional, IsString } from 'class-validator';
import { WorldLocationDto } from 'src/world-location/dto/world-location.dto';
import { GuessObjectSourceDto } from './guess-object.dto';

export class GuessObjectCandidateDto implements GuessObjectCandidate {
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
  @Type(() => GuessObjectSourceDto)
  source?: GuessObjectSourceDto;

  @IsOptional()
  @IsString()
  world_location_id?: string;

  @IsOptional()
  @IsString()
  world_location?: WorldLocationDto;
}

export class GuessObjectCandidateResponseDto {
  @Type(() => GuessObjectCandidateDto)
  guessObjectCandidate: GuessObjectCandidateDto;
}

export class GuessObjectCandidatesResponseDto {
  @Type(() => GuessObjectCandidateDto)
  guessObjectCandidates: GuessObjectCandidateDto;
}
