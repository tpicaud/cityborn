import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { GuessObjectDto } from 'src/guess-object/dto/guess-object.dto';
import { Category } from '@cityborn/types';

export class CategoryDto implements Category {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsBoolean()
  isPublished: boolean;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  guessObjectsIds?: string[];

  @IsOptional()
  @IsArray()
  @Type(() => GuessObjectDto)
  guessObjects?: GuessObjectDto[];
}
