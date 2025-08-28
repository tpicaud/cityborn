import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Sentence, SentenceDocument } from './sentence.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { ErrorCode } from '@cityborn/errors';

@Injectable()
export class SentenceService {
    constructor(@InjectModel(Sentence.name, 'sentences') private sentenceModel: Model<SentenceDocument>) {}

    async findRandomOne(score_type: string): Promise<Sentence> {

        const result = await this.sentenceModel.aggregate([
            { $match: { score_type } },
            { $sample: { size: 1 } }
        ]);

        if (!result || result.length === 0) {
            throw new NotFoundException({ code: ErrorCode.GAME_END_SENTENCE_NOT_FOUND, message: `No sentence found for score type: ${score_type}` });
        }

        return result[0];
    }
}
