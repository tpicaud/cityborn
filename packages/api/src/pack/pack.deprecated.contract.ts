import { initContract } from '@ts-rest/core';
import { IncludeQuerySchema } from '../protocol/payload.schema';
import {
  CategoriesSchema,
  CategoryIdParamSchema,
  CategorySchema,
  CategoryTreesSchema,
} from './pack.schema';

const c = initContract();

export const deprecatedCategoryContract = c.router(
  {
    /**
     * @deprecated Utiliser `pack.getPackTrees` à la place. Conservé pour les
     * builds mobile publiées avant le renommage de Category en Pack.
     * @deprecatedSince 2026-10-23
     */
    getCategoryTrees: {
      method: 'GET',
      path: '/tree',
      responses: { 200: CategoryTreesSchema },
    },
    /**
     * @deprecated Utiliser `pack.getPack` à la place. Conservé pour les
     * builds mobile publiées avant le renommage de Category en Pack.
     * @deprecatedSince 2026-10-23
     */
    getCategory: {
      method: 'GET',
      path: '/:id',
      pathParams: CategoryIdParamSchema,
      query: IncludeQuerySchema,
      responses: { 200: CategorySchema },
    },
    /**
     * @deprecated Utiliser `pack.getPacks` à la place. Conservé pour les
     * builds mobile publiées avant le renommage de Category en Pack.
     * @deprecatedSince 2026-10-23
     */
    getCategories: {
      method: 'GET',
      path: '/',
      query: IncludeQuerySchema,
      responses: { 200: CategoriesSchema },
    },
  },
  { pathPrefix: '/category' },
);
