import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import { IncludeQuerySchema } from '../protocol/payload.schema';
import {
  GuessObjectIdParamSchema,
  GuessObjectSchema,
  GuessObjectsSchema,
} from './guess-object.schema';

const c = initContract();

export const guessObjectContract = c.router(
  {
    /**
     * @deprecated Utiliser les objets de l'état de partie à la place. Aucune
     * app ne l'appelle ; il expose le lieu de naissance d'un objet en jeu.
     * @deprecatedSince 2026-10-28
     */
    getGuessObjects: {
      method: 'GET',
      deprecated: true,
      path: '/',
      query: z.object({ guessObjectsIds: z.string() }),
      responses: { 200: GuessObjectsSchema },
    },
    /**
     * @deprecated Utiliser les objets de l'état de partie à la place. Aucune
     * app ne l'appelle ; il expose le lieu de naissance d'un objet en jeu.
     * @deprecatedSince 2026-10-28
     */
    getGuessObject: {
      method: 'GET',
      deprecated: true,
      path: '/:id',
      pathParams: GuessObjectIdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: GuessObjectSchema },
    },
  },
  { pathPrefix: '/guess-object' },
);
