import { Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '@cityborn/errors';
import { PrismaService } from 'src/prisma/prisma.service';
import { SentenceDto } from './dto/sentence.dto';
import { ScoreType } from '@cityborn/types';
import { SentenceMapper } from './mapper/sentence.mapper';

@Injectable()
export class SentenceService {
    constructor(private readonly prisma: PrismaService) { }

    async findRandomOne(score_type: ScoreType): Promise<SentenceDto> {

        const sentences = await this.prisma.endGameSentence.findMany({
            where: {
                score_type
            }
        });

        if (sentences.length === 0) {
            throw new NotFoundException({
                code: ErrorCode.GAME_END_SENTENCE_NOT_FOUND,
                message: 'Sentence not found'
            });
        }

        const randomIndex = Math.floor(Math.random() * sentences.length);
        const randomSentence = sentences[randomIndex];

        return SentenceMapper.toSentenceDto(randomSentence);
    }
}
