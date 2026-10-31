import { initContract } from '@ts-rest/core';
import { IncludeQuerySchema } from '../protocol/payload.schema';
import {
  PackIdParamSchema,
  PackSchema,
  PacksSchema,
  PackTreesSchema,
} from './pack.schema';

const c = initContract();

export const packContract = c.router(
  {
    /**
     * @deprecated Utiliser `getPacks` et `theme.getPlayableThemes` à la place.
     * Conservé pour les builds mobile publiées avant l'affichage par thème.
     * @deprecatedSince 2026-10-31
     */
    getPackTrees: {
      method: 'GET',
      deprecated: true,
      path: '/tree',
      responses: { 200: PackTreesSchema },
    },
    getPack: {
      method: 'GET',
      path: '/:id',
      pathParams: PackIdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: PackSchema },
    },
    getPacks: {
      method: 'GET',
      path: '/',
      query: IncludeQuerySchema,
      responses: { 200: PacksSchema },
    },
  },
  { pathPrefix: '/pack' },
);
