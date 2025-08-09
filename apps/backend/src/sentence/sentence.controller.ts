import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SentenceService } from './sentence.service';
import { SentenceResponseDto } from './dto/sentence.response.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('sentence')
export class SentenceController {
    constructor(private readonly sentenceService: SentenceService) {}

    @UseGuards(AuthGuard)
    @Get()
    async getSentence(@Query('score_type') score_type: string): Promise<SentenceResponseDto> {
        return {
            sentence: await this.sentenceService.findRandomOne(score_type)
        }
    }
}
