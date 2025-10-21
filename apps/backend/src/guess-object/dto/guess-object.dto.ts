import { GuessObject, WorldLocation } from "@cityborn/types";
import { Type } from "class-transformer";
import {
  IsString,
  ValidateNested,
  IsOptional,
  IsUUID,
  IsEnum,
  IsArray,
} from "class-validator";

export class GeometryDto {
  @IsEnum(['Point', 'Polygon', 'MultiPolygon'])
  type: 'Point' | 'Polygon' | 'MultiPolygon';

  @IsArray()
  coordinates: number[] | number[][] | number[][][];
}

export class WorldLocationParentDto {
  @IsUUID()
  @IsString()
  id: string;

  @IsString()
  name: string;

}

export class WorldLocationSourceDto {
  @IsString()
  provider: string;

  @IsString()
  external_id: string;
}

export class WorldLocationDto implements WorldLocation {
  @IsUUID()
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  display_name?: string;

  @IsEnum(['area', 'point'])
  type: 'area' | 'point';

  @Type(() => GeometryDto)
  geometry: GeometryDto

  @IsOptional()
  @IsEnum(['ADM1', 'ADM2', 'ADM3', 'ADM4'])
  level?: 'ADM1' | 'ADM2' | 'ADM3' | 'ADM4';

  @IsOptional()
  @IsString()
  iso_code?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => WorldLocationParentDto)
  parent?: WorldLocationParentDto;

  @IsOptional()
  @IsArray()
  centroid?: [number, number];

  @IsOptional()
  @ValidateNested()
  @Type(() => WorldLocationSourceDto)
  source?: WorldLocationSourceDto;
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
  @Type(() => WorldLocationDto)
  world_location?: WorldLocationDto
}
