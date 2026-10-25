import { initContract } from '@ts-rest/core';
import { emptyResponseSchema } from '../protocol/payload.schema';
import {
  CreateGameRecordSchema,
  GameRecordsSchema,
} from './game-record.schema';

const c = initContract();

export const deprecatedUserGameRecordContract = c.router(
  {
    /**
     * @deprecated Utiliser `gameRecord.getGameRecords` à la place. Conservé
     * pour les builds mobile publiées avant le déplacement sous `/game-record`.
     * @deprecatedSince 2026-10-17
     */
    getGameRecords: {
      method: 'GET',
      path: '/game-records',
      responses: { 200: GameRecordsSchema },
    },
    /**
     * @deprecated Utiliser les events du channel WebSocket `session` à la place.
     * Conservé pour les builds mobile publiées avant le déplacement sous `/game-record`.
     * @deprecatedSince 2026-10-17
     */
    saveSoloGameRecord: {
      method: 'POST',
      deprecated: true,
      path: '/game-records',
      body: CreateGameRecordSchema,
      responses: { 200: emptyResponseSchema },
    },
  },
  { pathPrefix: '/user' },
);
