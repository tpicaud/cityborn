import { z } from 'zod';
import { CategorySchema } from './category.schema.js';
import { SessionModeSchema } from './enums.js';

const accountMethodSchema = z.enum(['email', 'google', 'apple']);

export const EventNameSchema = z.enum([
  'user_signed_up',
  'user_signed_in',
  'user_new_connection',
  'session_created',
  'game_started',
  'game_finished',
]);

// Discriminated union of (name, properties) pairs — one variant per event
export const EventPayloadSchema = z.discriminatedUnion('name', [
  z.object({
    name: z.literal('user_signed_up'),
    properties: z.object({ method: accountMethodSchema }),
  }),
  z.object({
    name: z.literal('user_signed_in'),
    properties: z.object({ method: accountMethodSchema }),
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

// Wire shape for creating an event (sent by clients)
export const CreateEventSchema = z.intersection(
  z.object({ visitorId: z.string() }),
  EventPayloadSchema,
);

// Persisted event shape
export const EventSchema = z.intersection(
  z.object({
    id: z.string(),
    visitorId: z.string(),
    created_at: z.string(),
  }),
  EventPayloadSchema,
);

export type EventName = z.infer<typeof EventNameSchema>;
export type EventPayload = z.infer<typeof EventPayloadSchema>;
export type CreateEvent = z.infer<typeof CreateEventSchema>;
export type Event = z.infer<typeof EventSchema>;
