import { initContract } from '@ts-rest/core';
import { commonErrorResponses } from '../schemas/api-error.schema';
import { emptyResponseSchema } from '../schemas/common.schema';

const c = initContract();

export const healthContract = c.router(
  {
    check: {
      method: 'GET',
      path: '',
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/health' },
);
