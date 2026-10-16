import { z } from 'zod';

export const GameIdSchema = z.string().brand<'GameId'>();

export type GameId = z.infer<typeof GameIdSchema>;
