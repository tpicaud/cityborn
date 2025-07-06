import { Controller, Param } from '@nestjs/common';
import { SentenceService } from './sentence.service';

@Controller('sentence')
export class SentenceController {
    constructor(private readonly sentenceService: SentenceService) {}

    @Get()
    async getSentence(@Param('score_type') score_type: string) {
        return await this.sentenceService
    }
}
