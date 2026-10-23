import { initContract } from '@ts-rest/core';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
} from '../protocol/payload.schema';
import {
  AdminThemesSchema,
  SaveThemeSchema,
  ThemeIdParamSchema,
  ThemeSchema,
} from './theme.schema';

const c = initContract();
export const themeAdminContract = c.router(
  {
    getThemes: {
      method: 'GET',
      path: '/',
      responses: { 200: AdminThemesSchema },
    },
    createTheme: {
      method: 'POST',
      path: '/',
      body: SaveThemeSchema,
      responses: { 201: ThemeSchema },
    },
    updateTheme: {
      method: 'PUT',
      path: '/:id',
      pathParams: ThemeIdParamSchema,
      body: SaveThemeSchema,
      responses: { 200: ThemeSchema },
    },
    deleteTheme: {
      method: 'DELETE',
      path: '/:id',
      pathParams: ThemeIdParamSchema,
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema },
    },
  },
  { pathPrefix: '/theme' },
);
