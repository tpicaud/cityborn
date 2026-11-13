import { initContract } from '@ts-rest/core';
import { CatalogSectionsSchema } from './catalog-section.schema';

const c: ReturnType<typeof initContract> = initContract();
export const catalogSectionContract = c.router(
  {
    getPublishedSections: {
      method: 'GET',
      path: '/',
      responses: { 200: CatalogSectionsSchema },
    },
  },
  { pathPrefix: '/catalog-section' },
);
