import { initContract } from '@ts-rest/core';
import { ThemesSchema } from './theme.schema';

const c = initContract();

export const themeContract = c.router(
  {
    getPlayableThemes: {
      method: 'GET',
      path: '/',
      responses: { 200: ThemesSchema },
    },
  },
  { pathPrefix: '/theme' },
);
