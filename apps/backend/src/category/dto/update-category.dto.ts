import { PartialType } from '@nestjs/mapped-types';
import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { CategoryDto } from './category.dto';

export class UpdateCategoryDto extends PartialType(CategoryDto) {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  connectIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  disconnectIds?: string[];
}
