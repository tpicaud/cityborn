import { withTailwindTypeScale } from '@tamagui/config/v6';
import { createFont } from 'tamagui';

const figmaTextSizes = {
  h1: 32,
  h2: 18,
  'p-title': 12,
  'p-simple': 12,
} as const;

const fredoka = createFont(
  withTailwindTypeScale({
    family: 'Fredoka',
    size: figmaTextSizes,
    lineHeight: figmaTextSizes,
    weight: {
      h1: '700',
      h2: '600',
      'p-title': '700',
      'p-simple': '500',
      xs: '400',
    },
    letterSpacing: { h1: 0 },
    face: {
      400: { normal: 'Fredoka_400Regular' },
      500: { normal: 'Fredoka_500Medium' },
      600: { normal: 'Fredoka_600SemiBold' },
      700: { normal: 'Fredoka_700Bold' },
    },
  }),
);

export const fonts = {
  body: fredoka,
  heading: fredoka,
};
