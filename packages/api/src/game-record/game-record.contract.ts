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
    /**
     * @deprecated Utiliser les events du channel WebSocket `session` à la place.
     * Conservé pour les builds mobile publiées avant le solo en session serveur.
     * @deprecatedSince 2026-10-25
     */
    saveSoloGameRecord: {
      method: 'POST',
      deprecated: true,
      path: '/',
      body: CreateGameRecordSchema,
      responses: { 200: emptyResponseSchema },
    },
  },
  { pathPrefix: '/game-record' },
);
