import type { z } from 'zod';
import { type Theme, ThemeSchema } from './theme.schema';

export function buildTheme(
  overrides: Partial<z.input<typeof ThemeSchema>> = {},
): Theme {
  return ThemeSchema.parse({
    id: '244b803a-63aa-460a-a40d-4eea0ec2be50',
    name: 'Divers',
    ...overrides,
  });
}
