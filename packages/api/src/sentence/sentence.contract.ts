import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import type { ApiDomain } from '../protocol/api-domain';
import { ScoreTypeSchema, SentenceSchema } from './sentence.schema';

const c = initContract();

export const sentenceContract = c.router(
  {
    getSentence: {
      method: 'GET',
      path: '/',
      query: z.object({ score_type: ScoreTypeSchema }),
      responses: { 200: SentenceSchema },
    },
  },
  { pathPrefix: '/sentence' satisfies `/${ApiDomain}` },
);
