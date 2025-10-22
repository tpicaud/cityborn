import { WorldLocation } from "@cityborn/types";
import { Type } from "class-transformer";
import { IsEnum, IsArray, IsUUID, IsString, IsOptional, ValidateNested } from "class-validator";

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

  @IsOptional()
  @IsString()
  addresstype?: string;

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

export class WorldLocationSearchResponseDto {
    @Type(() => WorldLocationDto)
    candidates: WorldLocationDto[];
}