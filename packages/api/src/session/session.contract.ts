import { initContract } from '@ts-rest/core';
import type { ApiDomain } from '../contract/api-domain';
import { commonErrorResponses } from '../errors/api-error.schema';
import { GameSchema, GameStateSchema } from '../game/game.schema';
import { emptyResponseSchema } from '../protocol/payload.schema';
import { SessionIdParamSchema } from './session.id';
import { CreateSessionSchema, SessionSchema } from './session.schema';

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
      responses: { 201: SessionSchema, ...commonErrorResponses },
    },
    getSession: {
      method: 'GET',
      path: '/:id',
      pathParams: SessionIdParamSchema,
      responses: { 200: SessionSchema, ...commonErrorResponses },
    },
    createGame: {
      method: 'POST',
      path: '/create-game',
      body: SessionSchema,
      responses: { 200: GameSchema, ...commonErrorResponses },
    },
    finalizeGame: {
      method: 'POST',
      path: '/finalize-game',
      body: finalizeGameBodySchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
    /**
     * @deprecated Use `finalizeGame` instead. Kept so mobile builds
     * published before this rename keep working — safe to remove once
     * their adoption of a newer build is high enough.
     * @deprecatedSince 2026-08-21
     */
    endSoloGame: {
      method: 'POST',
      path: '/end-solo-game',
      body: finalizeGameBodySchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/session' satisfies `/${ApiDomain}` },
);
