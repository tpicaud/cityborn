import { type Theme, ThemeSchema } from '@cityborn/api';
import type { Theme as PrismaTheme } from '@prisma/client';

export const ThemeMapper = {
  toTheme(prismaTheme: PrismaTheme): Theme {
    return ThemeSchema.parse({ id: prismaTheme.id, name: prismaTheme.name });
  },
};
