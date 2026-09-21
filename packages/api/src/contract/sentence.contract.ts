import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { commonErrorResponses } from '../schemas/api-error.schema';
import { ScoreTypeSchema } from '../schemas/enums.schema';
import { SentenceSchema } from '../schemas/sentence.schema';
import type { ApiDomain } from './api-domain';

const c = initContract();

export const sentenceContract = c.router(
  {
    getSentence: {
      method: 'GET',
      path: '/',
      query: z.object({ score_type: ScoreTypeSchema }),
      responses: { 200: SentenceSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/sentence' satisfies `/${ApiDomain}` },
);
