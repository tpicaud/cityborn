import { initContract } from '@ts-rest/core';
import { commonErrorResponses } from '../schemas/api-error.schema';
import { emptyResponseSchema } from '../schemas/common.schema';
import {
  CreateGameRecordSchema,
  GameRecordsSchema,
} from '../schemas/game.schema';

const c = initContract();

export const userContract = c.router(
  {
    getGameRecords: {
      method: 'GET',
      path: '/game-records',
      responses: { 200: GameRecordsSchema, ...commonErrorResponses },
    },
    saveSoloGameRecord: {
      method: 'POST',
      path: '/game-records',
      body: CreateGameRecordSchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/user' },
);
