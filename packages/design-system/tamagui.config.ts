import { createFont, createTamagui, createTokens } from 'tamagui';
import { colors } from './src/colors';

const sizes: Record<string, number> = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
};

export const tamaguiConfig = createTamagui({
  tokens: createTokens({
    size: sizes,
    space: sizes,
    radius: { 1: 4, 2: 8, 3: 12, 4: 16 },
    zIndex: { 1: 0 },
    color: {
      primary: colors.primary.DEFAULT,
      white: '#ffffff',
      black: '#171717',
    },
  }),
  fonts: {
    body: createFont({
      family: 'System',
      size: {
        1: 12,
        2: 14,
        3: 16,
        4: 18,
        5: 20,
        6: 22,
        7: 24,
        8: 26,
        9: 28,
        10: 30,
      },
    }),
  },
  themes: {
    light: {
      background: '#ffffff',
      color: '#171717',
      borderColor: '#d4d4d4',
    },
  },
});

export type TamaguiConfig = typeof tamaguiConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends TamaguiConfig {}
}
