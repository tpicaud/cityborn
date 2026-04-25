import { contract } from '@cityborn/api';
import { ScoreType } from '@cityborn/types';
import { Controller } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { SentenceService } from './sentence.service';

@Controller()
export class SentenceController {
  constructor(private readonly sentenceService: SentenceService) {}

  @TsRestHandler(contract.session.getSentence)
  async getSentence() {
    return tsRestHandler(contract.session.getSentence, async ({ query }) => {
      return {
        status: 200 as const,
        body: await this.sentenceService.findRandomOne(query.score_type as ScoreType),
      };
    });
  }
}
