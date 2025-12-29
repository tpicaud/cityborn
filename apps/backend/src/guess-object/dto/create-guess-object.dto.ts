import { CreateGuessObject, WorldLocation } from '@cityborn/types';
import { IsOptional, IsString } from 'class-validator';
import { GuessObjectSourceDto } from './guess-object.dto';
import { Type } from 'class-transformer';
import { WorldLocationDto } from 'src/world-location/dto/world-location.dto';

export class CreateGuessObjectDto implements CreateGuessObject {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  short_description?: string;

  @IsOptional()
  @Type(() => GuessObjectSourceDto)
  source?: GuessObjectSourceDto;

  @IsString()
  world_location_id: string;

  @IsOptional()
  @Type(() => WorldLocationDto)
  world_location?: WorldLocation;
}

export class CreateGuessObjectResponseDto {
  @IsString()
  id: string;
}
