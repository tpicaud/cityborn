import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { CreateEventSchema } from '../schemas/event.schema.js';

const c = initContract();

export const eventContract = c.router({
  trackEvent: {
    method: 'POST',
    path: '/event/track',
    body: z.object({ event: CreateEventSchema }),
    responses: { 201: z.object({}) },
  },
});
