import { initContract } from '@ts-rest/core';
import { emptyResponseSchema } from '../protocol/payload.schema';
import {
  CreateGameRecordSchema,
  GameRecordsSchema,
} from './game-record.schema';

const c = initContract();

export const gameRecordContract = c.router(
  {
    getGameRecords: {
      method: 'GET',
      path: '/game-records',
      responses: { 200: GameRecordsSchema },
    },
    saveSoloGameRecord: {
      method: 'POST',
      path: '/game-records',
      body: CreateGameRecordSchema,
      responses: { 200: emptyResponseSchema },
    },
  },
  { pathPrefix: '/user' },
);
