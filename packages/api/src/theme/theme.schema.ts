import { z } from 'zod';

export const ThemeIdSchema = z.string().uuid().brand<'ThemeId'>();

export type ThemeId = z.infer<typeof ThemeIdSchema>;

export const ThemeSchema = z.object({
  id: ThemeIdSchema,
  name: z.string(),
});

export const ThemesSchema = z.array(ThemeSchema);

export type Theme = z.infer<typeof ThemeSchema>;
