import { initContract } from '@ts-rest/core';
import { GameSchema, GameStateSchema } from '../game/game.schema';
import { emptyResponseSchema } from '../protocol/payload.schema';
import {
  CreateSessionSchema,
  SessionIdParamSchema,
  SessionSchema,
} from './session.schema';

const c = initContract();

const finalizeGameBodySchema = SessionSchema.extend({
  currentGame: GameSchema.extend({
    state: GameStateSchema.omit({ guessObjects: true }),
  }),
});

export const sessionContract = c.router(
  {
    createSession: {
      method: 'POST',
      path: '/',
      body: CreateSessionSchema,
      responses: { 201: SessionSchema },
    },
    getSession: {
      method: 'GET',
      path: '/:id',
      pathParams: SessionIdParamSchema,
      responses: { 200: SessionSchema },
    },
    createGame: {
      method: 'POST',
      path: '/create-game',
      body: SessionSchema,
      responses: { 200: GameSchema },
    },
    finalizeGame: {
      method: 'POST',
      path: '/finalize-game',
      body: finalizeGameBodySchema,
      responses: { 200: emptyResponseSchema },
    },
    /**
     * @deprecated Utiliser `finalizeGame` à la place. Conservé pour les
     * builds mobile publiées avant ce renommage.
     * @deprecatedSince 2026-08-21
     */
    endSoloGame: {
      method: 'POST',
      path: '/end-solo-game',
      body: finalizeGameBodySchema,
      responses: { 200: emptyResponseSchema },
    },
  },
  { pathPrefix: '/session' },
);
