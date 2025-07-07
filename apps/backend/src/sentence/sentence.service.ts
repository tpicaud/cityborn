import { Sentence } from '@cityborn/types';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SentenceService {
    async findRandomOne(score_type: string): Promise<Sentence> {
        return {
            text: ''
        }
    }
}
