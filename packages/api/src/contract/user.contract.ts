import { initContract } from '@ts-rest/core';
import { emptyResponseSchema } from '../schemas/common.schema.js';
import {
  CreateGameRecordSchema,
  GameRecordsSchema,
} from '../schemas/game.schema.js';

const c = initContract();

export const userContract = c.router({
  getGameRecords: {
    method: 'GET',
    path: '/user/game-records',
    responses: { 200: GameRecordsSchema },
  },
  saveSoloGameRecord: {
    method: 'POST',
    path: '/user/game-records',
    body: CreateGameRecordSchema,
    responses: { 200: emptyResponseSchema },
  },
});
