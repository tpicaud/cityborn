import { animations } from '@tamagui/config/animations-css';
import { createV6Config } from '@tamagui/config/v6';
import { createTamagui } from 'tamagui';
import { palette } from './src/palette';
import { shadows, textShadows } from './src/shadows';
import { fonts } from './src/typography';

const v6Config = createV6Config(palette);

export const tamaguiConfig = createTamagui({
  ...v6Config,
  fonts,
  tokens: {
    ...v6Config.tokens,
    space: { ...v6Config.tokens.space, '0.75': 3 },
    borderWidth: {
      ...v6Config.tokens.borderWidth,
      '1.5': 1.5,
      '2.5': 2.5,
      3: 3,
    },
    boxShadow: { ...v6Config.tokens.boxShadow, ...shadows },
    textShadow: textShadows,
  },
  animations,
});

export type TamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends TamaguiConfig {}
}
