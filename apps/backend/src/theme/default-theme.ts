import {
  type ThemeIcon,
  ThemeIconSchema,
  type ThemeId,
  ThemeIdSchema,
} from '@cityborn/api';
export const defaultThemeId: ThemeId = ThemeIdSchema.parse(
  '244b803a-63aa-460a-a40d-4eea0ec2be50',
);
export const defaultThemeIcon: ThemeIcon = ThemeIconSchema.parse({
  name: 'boxicons:education-filled',
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24"><path fill="currentColor" d="m21.45 8.61l-9-4.5a1 1 0 0 0-.89 0l-6 3l-3 1.5l-1 .5a1 1 0 0 0-.55.89v6h2v-5.38l8.55 4.28c.14.07.29.11.45.11s.31-.04.45-.11l9-4.5c.34-.17.55-.52.55-.89s-.21-.72-.55-.89Z" class="b"/><path fill="currentColor" d="M12 17c-.46 0-.93-.11-1.34-.32L5 13.85v1.59C5 17.5 8.12 20 12 20s7-2.49 7-4.56v-1.59l-5.66 2.83c-.41.21-.88.32-1.34.32" class="b"/></svg>',
});
