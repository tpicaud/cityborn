import { Controller, Get, Query } from '@nestjs/common';
import { SentenceService } from './sentence.service';
import { SentenceResponseDto } from './dto/sentence.response.dto';

@Controller('sentence')
export class SentenceController {
    constructor(private readonly sentenceService: SentenceService) {}

    @Get()
    async getSentence(@Query('score_type') score_type: string): Promise<SentenceResponseDto> {
        return {
            sentence: await this.sentenceService.findRandomOne(score_type)
        }
    }
}
