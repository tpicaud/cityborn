import { initContract } from '@ts-rest/core';
import type { ApiDomain } from '../contract/api-domain';
import { commonErrorResponses } from '../errors/api-error.schema';
import { emptyResponseSchema } from '../protocol/payload.schema';

const c = initContract();

export const healthContract = c.router(
  {
    check: {
      method: 'GET',
      path: '',
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/health' satisfies `/${ApiDomain}` },
);
