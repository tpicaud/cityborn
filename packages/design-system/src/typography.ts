import { withTailwindTypeScale } from '@tamagui/config/v6';
import { createFont, isWeb } from 'tamagui';

const fredokaSizes = {
  1: 10,
  2: 12,
  3: 13,
  4: 16,
  5: 18,
  6: 22,
  7: 26,
  8: 32,
  9: 42,
  10: 83,
  11: 99,
} as const;

const fredoka = withTailwindTypeScale({
  family: isWeb
    ? 'var(--font-fredoka, Fredoka), system-ui, sans-serif'
    : 'Fredoka',
  size: fredokaSizes,
  lineHeight: fredokaSizes,
  letterSpacing: { 1: 0 },
  face: {
    400: { normal: 'Fredoka_400Regular' },
    500: { normal: 'Fredoka_500Medium' },
    600: { normal: 'Fredoka_600SemiBold' },
    700: { normal: 'Fredoka_700Bold' },
  },
});

export const fonts = {
  body: createFont({ ...fredoka, weight: { 1: '500' } }),
  heading: createFont({ ...fredoka, weight: { 1: '700' } }),
};
