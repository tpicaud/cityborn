import { z } from 'zod';

export const GameRecordIdSchema = z.string().brand<'GameRecordId'>();

export type GameRecordId = z.infer<typeof GameRecordIdSchema>;
