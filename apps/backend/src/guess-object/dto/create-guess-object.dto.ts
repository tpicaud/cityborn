import { CreateGuessObject, WorldLocation } from "@cityborn/types";
import { IsOptional, IsString } from "class-validator";

export class CreateGuessObjectDto implements CreateGuessObject {
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
    @IsString()
    world_location_id?: string;
}