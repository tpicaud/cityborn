import { initContract } from '@ts-rest/core';
import type { ApiDomain } from '../protocol/api-domain';
import { emptyResponseSchema } from '../protocol/payload.schema';

const c = initContract();

export const healthContract = c.router(
  {
    check: {
      method: 'GET',
      path: '',
      responses: { 200: emptyResponseSchema },
    },
  },
  { pathPrefix: '/health' satisfies `/${ApiDomain}` },
);
