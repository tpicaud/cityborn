import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { emptyResponseSchema } from '../schemas/common.schema.js';
import { GameRecordSchema, GameRecordsSchema } from '../schemas/game.schema.js';

const c = initContract();

export const userContract = c.router({
  getGameRecords: {
    method: 'GET',
    path: '/user/game-records',
    responses: { 200: GameRecordsSchema },
  },
  saveGameRecord: {
    method: 'POST',
    path: '/user/game-records',
    body: GameRecordSchema,
    responses: { 204: emptyResponseSchema },
  },
});
