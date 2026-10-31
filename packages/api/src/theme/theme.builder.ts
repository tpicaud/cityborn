import type { z } from 'zod';
import {
  type AdminTheme,
  AdminThemeSchema,
  type Theme,
  ThemeIcon,
  ThemeSchema,
} from './theme.schema';

export function buildTheme(
  overrides: Partial<z.input<typeof ThemeSchema>> = {},
): Theme {
  return ThemeSchema.parse({
    id: '244b803a-63aa-460a-a40d-4eea0ec2be50',
    name: 'Divers',
    icon: ThemeIcon.EDUCATION,
    ...overrides,
  });
}

export function buildAdminTheme(
  overrides: Partial<z.input<typeof AdminThemeSchema>> = {},
): AdminTheme {
  return AdminThemeSchema.parse({
    ...buildTheme(),
    packCount: 0,
    isDefault: true,
    ...overrides,
  });
}
