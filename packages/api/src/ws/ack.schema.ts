import { z } from 'zod';
import { ApiErrorSchema } from '../schemas/api-error.schema';

export const WsAckFailureSchema = z.object({
  success: z.literal(false),
  error: ApiErrorSchema.optional(),
});

export const emptyWsAckDataSchema = z.object({});

export type WsAckFailure = z.infer<typeof WsAckFailureSchema>;

export type WsAck<Data extends z.AnyZodObject | undefined = undefined> =
  | (Data extends z.AnyZodObject
      ? z.infer<Data> & { success: true }
      : { success: true })
  | WsAckFailure;

export function wsAckSchema<Data extends z.AnyZodObject>(data: Data) {
  return z.union([
    data.extend({ success: z.literal(true) }),
    WsAckFailureSchema,
  ]);
}
