import { initContract } from '@ts-rest/core';
import { ThemesSchema } from './theme.schema';

const c = initContract();

export const themeAdminContract = c.router(
  {
    getThemes: {
      method: 'GET',
      path: '/',
      responses: { 200: ThemesSchema },
    },
  },
  { pathPrefix: '/theme' },
);
