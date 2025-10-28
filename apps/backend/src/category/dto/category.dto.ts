import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";
import { GuessObjectDto } from "src/guess-object/dto/guess-object.dto";

export class CategoryDto {
    @IsUUID()
    id: string

    @IsString()
    name: string

    @IsOptional()
    @IsString()
    description?: string

    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    guessObjectIds?: string[];

    @IsOptional()
    @IsArray()
    @Type(() => GuessObjectDto)
    guessObjects?: GuessObjectDto[]
}