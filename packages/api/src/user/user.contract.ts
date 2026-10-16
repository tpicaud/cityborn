import { initContract } from '@ts-rest/core';
import type { ApiDomain } from '../contract/api-domain';
import { commonErrorResponses } from '../errors/api-error.schema';
import {
  CreateGameRecordSchema,
  GameRecordsSchema,
} from '../game-record/game-record.schema';
import { emptyResponseSchema } from '../protocol/payload.schema';
import { UpdateUsernameSchema, UserSchema } from './user.schema';

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
    updateUsername: {
      method: 'PATCH',
      path: '/username',
      body: UpdateUsernameSchema,
      responses: { 200: UserSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/user' satisfies `/${ApiDomain}` },
);
