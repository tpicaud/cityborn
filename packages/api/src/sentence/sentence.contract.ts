import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import type { ApiDomain } from '../contract/api-domain';
import { commonErrorResponses } from '../errors/api-error.schema';
import { ScoreTypeSchema, SentenceSchema } from './sentence.schema';

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
