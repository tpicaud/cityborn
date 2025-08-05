import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Sentence, SentenceDocument } from './sentence.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

@Injectable()
export class SentenceService {
    constructor(@InjectModel(Sentence.name, 'sentences') private sentenceModel: Model<SentenceDocument>) {}

    async findRandomOne(score_type: string): Promise<Sentence> {
        if (!score_type) {
            throw new BadRequestException('Missing query parameter: score_type');
        }

        const result = await this.sentenceModel.aggregate([
            { $match: { score_type } },
            { $sample: { size: 1 } }
        ]);

        if (!result || result.length === 0) {
            throw new NotFoundException(`No sentence found for score_type: ${score_type}`);
        }

        return result[0];
    }
}
