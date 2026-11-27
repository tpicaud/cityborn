import { initContract } from '@ts-rest/core';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
} from '../protocol/payload.schema';
import {
  CatalogSectionIdParamSchema,
  CatalogSectionPackParamSchema,
  CatalogSectionSchema,
  CatalogSectionsSchema,
  MoveCatalogSectionSchema,
  SaveCatalogSectionSchema,
} from './catalog-section.schema';

const c = initContract();

export const catalogSectionAdminContract = c.router(
  {
    getCatalogSections: {
      method: 'GET',
      path: '/',
      responses: { 200: CatalogSectionsSchema },
    },
    createCatalogSection: {
      method: 'POST',
      path: '/',
      body: SaveCatalogSectionSchema,
      responses: { 201: CatalogSectionSchema },
    },
    renameCatalogSection: {
      method: 'PUT',
      path: '/:id',
      pathParams: CatalogSectionIdParamSchema,
      body: SaveCatalogSectionSchema,
      responses: { 200: CatalogSectionSchema },
    },
    moveCatalogSection: {
      method: 'POST',
      path: '/:id/move',
      pathParams: CatalogSectionIdParamSchema,
      body: MoveCatalogSectionSchema,
      responses: { 200: CatalogSectionsSchema },
    },
    deleteCatalogSection: {
      method: 'DELETE',
      path: '/:id',
      pathParams: CatalogSectionIdParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema },
    },
    addPackToCatalogSection: {
      method: 'PUT',
      path: '/:id/packs/:packId',
      pathParams: CatalogSectionPackParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: CatalogSectionSchema },
    },
    removePackFromCatalogSection: {
      method: 'DELETE',
      path: '/:id/packs/:packId',
      pathParams: CatalogSectionPackParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: CatalogSectionSchema },
    },
    movePackInCatalogSection: {
      method: 'POST',
      path: '/:id/packs/:packId/move',
      pathParams: CatalogSectionPackParamSchema,
      body: MoveCatalogSectionSchema,
      responses: { 200: CatalogSectionSchema },
    },
  },
  { pathPrefix: '/catalog-section' },
);
