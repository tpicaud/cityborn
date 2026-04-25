import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { SessionModeSchema } from '../schemas/common.schema.js';
import { GameSchema } from '../schemas/game.schema.js';
import { SessionSchema } from '../schemas/session.schema.js';

const c = initContract();

export const sessionContract = c.router({
  createSession: {
    method: 'POST',
    path: '/session',
    body: z.object({ mode: SessionModeSchema }),
    responses: { 201: z.object({ session: SessionSchema }) },
  },
  getSession: {
    method: 'GET',
    path: '/session/:id',
    pathParams: z.object({ id: z.string() }),
    responses: { 200: z.object({ session: SessionSchema }) },
  },
  createGame: {
    method: 'POST',
    path: '/session/create-game',
    body: z.object({ session: SessionSchema }),
    responses: { 201: z.object({ game: GameSchema }) },
  },
  endSoloGame: {
    method: 'POST',
    path: '/session/end-solo-game',
    body: SessionSchema,
    responses: { 200: z.object({}) },
  },
});
