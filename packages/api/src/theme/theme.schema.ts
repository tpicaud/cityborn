import { z } from 'zod';

export const ThemeIdSchema = z.string().uuid().brand<'ThemeId'>();

export type ThemeId = z.infer<typeof ThemeIdSchema>;

export enum ThemeIcon {
  BASKETBALL = 'BASKETBALL',
  MUSIC = 'MUSIC',
  CINEMA = 'CINEMA',
  EDUCATION = 'EDUCATION',
}

export const ThemeIconSchema = z.nativeEnum(ThemeIcon);

export const ThemeSchema = z.object({
  id: ThemeIdSchema,
  name: z.string(),
  icon: ThemeIconSchema,
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
export const SaveThemeSchema = z.object({
  name: ThemeNameSchema,
  icon: ThemeIconSchema.optional(),
});
export const ThemeIdParamSchema = z.object({ id: ThemeIdSchema });

export enum ThemeMoveDirection {
  UP = 'UP',
  DOWN = 'DOWN',
}

export const MoveThemeSchema = z.object({
  direction: z.nativeEnum(ThemeMoveDirection),
});
export type AdminTheme = z.infer<typeof AdminThemeSchema>;
export type SaveTheme = z.infer<typeof SaveThemeSchema>;
export type MoveTheme = z.infer<typeof MoveThemeSchema>;
