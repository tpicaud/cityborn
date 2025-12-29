import { GuessObject, WorldLocation } from '@cityborn/types';
import { Type } from 'class-transformer';
import { IsUUID, IsString, IsOptional } from 'class-validator';
import { WorldLocationDto } from 'src/world-location/dto/world-location.dto';

export class GuessObjectSourceDto {
  @IsString()
  provider: string;

  @IsString()
  external_id: string;
}

export class GuessObjectDto implements GuessObject {
  @IsUUID()
  @IsString()
  id: string;

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
  world_location?: WorldLocationDto;
}
