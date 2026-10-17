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
      path: '/',
      responses: { 200: GameRecordsSchema },
    },
    saveSoloGameRecord: {
      method: 'POST',
      path: '/',
      body: CreateGameRecordSchema,
      responses: { 200: emptyResponseSchema },
    },
  },
  { pathPrefix: '/game-record' },
);
