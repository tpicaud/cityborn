import { initContract } from '@ts-rest/core';
import { commonErrorResponses } from '../schemas/api-error.schema';
import { emptyResponseSchema } from '../schemas/common.schema';
import {
  CreateGameRecordSchema,
  GameRecordsSchema,
} from '../schemas/game.schema';
import { UpdateUsernameSchema, UserSchema } from '../schemas/user.schema';
import type { ApiDomain } from './api-domain';

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
