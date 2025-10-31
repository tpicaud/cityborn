import { EndGameSentence } from "@prisma/client";
import { SentenceDto } from "../dto/sentence.dto";
import { ScoreType } from "@cityborn/types";

export class SentenceMapper {
    static toSentenceDto(prismaSentence: EndGameSentence): SentenceDto {
        return {
            id: prismaSentence.id,
            score_type: prismaSentence.score_type as ScoreType,
            message: prismaSentence.message
        }
    }
}