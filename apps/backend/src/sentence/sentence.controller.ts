import { Controller, Get, Query } from '@nestjs/common';
import { SentenceService } from './sentence.service';

@Controller('sentence')
export class SentenceController {
    constructor(private readonly sentenceService: SentenceService) {}

    @Get()
    async getSentence(@Query('score_type') score_type: string) {
        return await this.sentenceService.findRandomOne(score_type);
    }
}
