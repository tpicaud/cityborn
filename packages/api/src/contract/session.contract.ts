import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { GameSchema } from '../schemas/game.schema.js';
import {
  CreateSessionSchema,
  SessionSchema,
} from '../schemas/session.schema.js';
import { emptyResponseSchema } from '../schemas/common.schema.js';

const c = initContract();

export const sessionContract = c.router({
  createSession: {
    method: 'POST',
    path: '/session',
    body: CreateSessionSchema,
    responses: { 201: SessionSchema },
  },
  getSession: {
    method: 'GET',
    path: '/session/:id',
    pathParams: z.object({ id: z.string() }),
    responses: { 200: SessionSchema },
  },
  createGame: {
    method: 'POST',
    path: '/session/create-game',
    body: SessionSchema,
    responses: { 200: GameSchema },
  },
  endSoloGame: {
    method: 'POST',
    path: '/session/end-solo-game',
    body: SessionSchema,
    responses: { 204: emptyResponseSchema },
  },
});
