import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { CategoryDto } from './category.dto';

export class CategoriesResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryDto)
  categories: CategoryDto[];
}
