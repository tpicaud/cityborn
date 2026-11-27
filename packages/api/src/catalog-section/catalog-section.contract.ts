import { initContract } from '@ts-rest/core';
import { CatalogSectionsSchema } from './catalog-section.schema';

const c = initContract();

export const catalogSectionContract = c.router(
  {
    getPlayableCatalogSections: {
      method: 'GET',
      path: '/',
      responses: { 200: CatalogSectionsSchema },
    },
  },
  { pathPrefix: '/catalog-section' },
);
