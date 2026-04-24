import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { GameRecordSchema } from '../schemas/game.schema.js';

const c = initContract();

export const userContract = c.router({
  getGameRecords: {
    method: 'GET',
    path: '/user/game-records',
    responses: { 200: z.object({ gameRecords: z.array(GameRecordSchema) }) },
  },
  saveGameRecord: {
    method: 'POST',
    path: '/user/game-records',
    body: z.object({ gameRecord: GameRecordSchema }),
    responses: { 201: z.object({}) },
  },
});
