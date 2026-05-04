import { initContract } from '@ts-rest/core';
import { emptyResponseSchema } from '../schemas/common.schema.js';
import { CreateEventSchema } from '../schemas/event.schema.js';

const c = initContract();

export const eventContract = c.router({
  trackEvent: {
    method: 'POST',
    path: '/event/track',
    body: CreateEventSchema,
    responses: { 201: emptyResponseSchema },
  },
});
