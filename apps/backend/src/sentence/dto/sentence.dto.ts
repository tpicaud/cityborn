import { ScoreType, Sentence } from "@cityborn/types";
import { IsString, IsUUID } from "class-validator";

export class SentenceDto implements Sentence {
    @IsUUID()
    id: string

    @IsString()
    score_type: ScoreType;
    
    @IsString()
    message: string
}