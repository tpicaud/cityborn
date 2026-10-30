import { withTailwindTypeScale } from '@tamagui/config/v6';
import { createFont, isWeb } from 'tamagui';

const figmaTextSizes = {
  'page-title': 83,
  'hero-title': 42,
  h1: 32,
  'cta-large': 26,
  cta: 22,
  'section-title': 22,
  h2: 18,
  'card-title': 13,
  'p-title': 12,
  'p-simple': 12,
  'card-caption': 10,
} as const;

const fredoka = createFont(
  withTailwindTypeScale({
    family: isWeb
      ? 'var(--font-fredoka, Fredoka), system-ui, sans-serif'
      : 'Fredoka',
    size: figmaTextSizes,
    lineHeight: figmaTextSizes,
    weight: {
      'page-title': '700',
      'hero-title': '700',
      h1: '700',
      'cta-large': '700',
      cta: '700',
      'section-title': '700',
      h2: '600',
      'card-title': '600',
      'p-title': '700',
      'p-simple': '500',
      'card-caption': '400',
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
