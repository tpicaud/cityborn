import { GuessObject } from "@cityborn/types";
import { Type } from "class-transformer";
import {
  IsString,
  IsObject,
  ValidateNested,
} from "class-validator";

class CoordinatesDto {
  @IsString()
  type: string;

  @IsObject()
  value: any; // tu peux remplacer `any` par un type plus précis si tu le connais (ex: number[] pour des coordonnées geo)
}

class AnswerDto {
  @IsString()
  place_name: string;

  @ValidateNested()
  @Type(() => CoordinatesDto)
  coordinates: CoordinatesDto;
}

export class GuessObjectDto implements GuessObject {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  category: string;

  @IsString()
  description: string;

  @IsString()
  short_description: string;

  @IsString()
  image: string;

  @ValidateNested()
  @Type(() => AnswerDto)
  answer: AnswerDto;
}
