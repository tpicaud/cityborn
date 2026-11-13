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
  CreateCatalogSectionSchema,
  MoveCatalogSectionSchema,
  RenameCatalogSectionSchema,
} from './catalog-section.schema';

const c: ReturnType<typeof initContract> = initContract();
export const catalogSectionAdminContract = c.router(
  {
    getSections: {
      method: 'GET',
      path: '/',
      responses: { 200: CatalogSectionsSchema },
    },
    createSection: {
      method: 'POST',
      path: '/',
      body: CreateCatalogSectionSchema,
      responses: { 201: CatalogSectionSchema },
    },
    renameSection: {
      method: 'PUT',
      path: '/:id',
      pathParams: CatalogSectionIdParamSchema,
      body: RenameCatalogSectionSchema,
      responses: { 200: CatalogSectionSchema },
    },
    moveSection: {
      method: 'POST',
      path: '/:id/move',
      pathParams: CatalogSectionIdParamSchema,
      body: MoveCatalogSectionSchema,
      responses: { 200: CatalogSectionsSchema },
    },
    deleteSection: {
      method: 'DELETE',
      path: '/:id',
      pathParams: CatalogSectionIdParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema },
    },
    addPack: {
      method: 'PUT',
      path: '/:id/packs/:packId',
      pathParams: CatalogSectionPackParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: CatalogSectionSchema },
    },
    removePack: {
      method: 'DELETE',
      path: '/:id/packs/:packId',
      pathParams: CatalogSectionPackParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: CatalogSectionSchema },
    },
    movePack: {
      method: 'POST',
      path: '/:id/packs/:packId/move',
      pathParams: CatalogSectionPackParamSchema,
      body: MoveCatalogSectionSchema,
      responses: { 200: CatalogSectionSchema },
    },
  },
  { pathPrefix: '/catalog-section' },
);
