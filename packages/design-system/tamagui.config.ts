import { animations } from '@tamagui/config/animations-css';
import { createV6Config } from '@tamagui/config/v6';
import { createPaletteThemes, shades } from '@tamagui/config/v6-builder';
import { createTamagui } from 'tamagui';
import { colors } from './src/colors';

export const tamaguiConfig = createTamagui({
  ...createV6Config(
    createPaletteThemes({
      brand: shades.map((shade) => colors.primary[shade]),
    }),
  ),
  animations,
});

export type TamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends TamaguiConfig {}
}
