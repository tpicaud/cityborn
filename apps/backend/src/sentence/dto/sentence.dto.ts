import { Sentence } from "@cityborn/types";
import { IsString } from "class-validator";

export class SentenceDto implements Sentence {
    @IsString()
    score_type: string;
    
    @IsString()
    sentence: string
}