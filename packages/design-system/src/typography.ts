import { withTailwindTypeScale } from '@tamagui/config/v6';
import { createFont, isWeb } from 'tamagui';

const fredokaSizes = {
  1: 10,
  2: 12,
  3: 13,
  4: 18,
  5: 22,
  6: 26,
  7: 32,
  8: 42,
  9: 83,
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
