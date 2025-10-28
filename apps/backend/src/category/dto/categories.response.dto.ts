import { Type } from "class-transformer";
import { CategoryDto } from "./category.dto";
import { IsArray, ValidateNested } from "class-validator";

export class CategoriesResponseDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CategoryDto)
    categories: CategoryDto[]
}