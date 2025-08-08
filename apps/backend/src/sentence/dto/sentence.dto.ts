import { IsString } from "class-validator";

export class SentenceDto {
    @IsString()
    sentence: string
}