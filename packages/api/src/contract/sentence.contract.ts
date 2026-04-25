import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { ScoreTypeSchema, SentenceSchema } from '../schemas/sentence.schema.js';

const c = initContract();

export const sentenceContract = c.router({
  getSentence: {
    method: 'GET',
    path: '/sentence',
    query: z.object({ score_type: ScoreTypeSchema }),
    responses: { 200: SentenceSchema },
  },
});
