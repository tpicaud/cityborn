import { z } from 'zod';

export const ThemeIdSchema = z.string().uuid().brand<'ThemeId'>();

export type ThemeId = z.infer<typeof ThemeIdSchema>;

export const ThemeIconNameSchema = z
  .string()
  .trim()
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*:[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Identifiant Iconify invalide, par exemple fluent:sport-basketball-24-filled',
  )
  .brand<'ThemeIconName'>();

export type ThemeIconName = z.infer<typeof ThemeIconNameSchema>;

export const ThemeIconSchema = z.object({
  name: ThemeIconNameSchema,
  svg: z.string(),
});

export type ThemeIcon = z.infer<typeof ThemeIconSchema>;

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
  icon: ThemeIconNameSchema.optional(),
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
