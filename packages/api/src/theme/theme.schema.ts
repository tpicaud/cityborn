import { z } from 'zod';

export const ThemeIdSchema = z.string().uuid().brand<'ThemeId'>();

export type ThemeId = z.infer<typeof ThemeIdSchema>;

export const ThemeSchema = z.object({
  id: ThemeIdSchema,
  name: z.string(),
});

export const ThemesSchema = z.array(ThemeSchema);

export type Theme = z.infer<typeof ThemeSchema>;

export const AdminThemeSchema = ThemeSchema.extend({
  packCount: z.number().int().nonnegative(),
  isDefault: z.boolean(),
});
export const AdminThemesSchema = z.array(AdminThemeSchema);
export const ThemeNameSchema = z
  .string()
  .trim()
  .min(1, 'Le nom est obligatoire')
  .max(40, 'Le nom ne peut pas dépasser 40 caractères');
export const SaveThemeSchema = z.object({ name: ThemeNameSchema });
export const ThemeIdParamSchema = z.object({ id: ThemeIdSchema });
export type AdminTheme = z.infer<typeof AdminThemeSchema>;
export type SaveTheme = z.infer<typeof SaveThemeSchema>;
