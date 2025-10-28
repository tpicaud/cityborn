import { IsArray, IsOptional, IsString, IsUUID } from "class-validator";

export class UpdateCategoryDto {
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
    @IsUUID('all', { each: true })
    connectIds?: string[];

    @IsOptional()
    @IsArray()
    @IsUUID('all', { each: true })
    disconnectIds?: string[];
}