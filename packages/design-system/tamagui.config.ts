import { animations } from '@tamagui/config/animations-css';
import { createV6Config } from '@tamagui/config/v6';
import { createTamagui } from 'tamagui';
import { palette } from './src/palette';
import { shadows } from './src/shadows';
import { fonts } from './src/typography';

const v6Config = createV6Config(palette);

export const tamaguiConfig = createTamagui({
  ...v6Config,
  fonts,
  tokens: {
    ...v6Config.tokens,
    boxShadow: { ...v6Config.tokens.boxShadow, ...shadows },
  },
  animations,
});

export type TamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends TamaguiConfig {}
}
