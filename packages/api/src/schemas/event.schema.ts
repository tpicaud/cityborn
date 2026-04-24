import { z } from 'zod';
import { CategorySchema } from './category.schema.js';
import { SessionModeSchema } from './common.schema.js';

// Typed event properties per event name
export const EventPropertiesSchema = z.discriminatedUnion('name', [
  z.object({
    name: z.literal('user_signed_up'),
    properties: z.object({ method: z.enum(['email', 'google', 'apple']) }),
  }),
  z.object({
    name: z.literal('user_signed_in'),
    properties: z.object({ method: z.enum(['email', 'google', 'apple']) }),
  }),
  z.object({
    name: z.literal('user_new_connection'),
    properties: z.object({}),
  }),
  z.object({
    name: z.literal('session_created'),
    properties: z.object({ mode: SessionModeSchema }),
  }),
  z.object({
    name: z.literal('game_started'),
    properties: z.object({
      mode: SessionModeSchema,
      categories: z.array(CategorySchema),
      numberOfPlayers: z.number(),
    }),
  }),
  z.object({
    name: z.literal('game_finished'),
    properties: z.object({
      gameId: z.string(),
      mode: SessionModeSchema,
      numberOfPlayers: z.number(),
      average_score: z.number(),
    }),
  }),
]);

export const CreateEventSchema = z.object({
  visitorId: z.string(),
  name: z.string(),
  properties: z.record(z.string(), z.unknown()),
});

export type CreateEvent = z.infer<typeof CreateEventSchema>;
