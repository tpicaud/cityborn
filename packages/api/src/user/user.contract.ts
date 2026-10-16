import { initContract } from '@ts-rest/core';
import {
  CreateGameRecordSchema,
  GameRecordsSchema,
} from '../game-record/game-record.schema';
import type { ApiDomain } from '../protocol/api-domain';
import { emptyResponseSchema } from '../protocol/payload.schema';
import { UpdateUsernameSchema, UserSchema } from './user.schema';

const c = initContract();

export const userContract = c.router(
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
    updateUsername: {
      method: 'PATCH',
      path: '/username',
      body: UpdateUsernameSchema,
      responses: { 200: UserSchema },
    },
  },
  { pathPrefix: '/user' satisfies `/${ApiDomain}` },
);
