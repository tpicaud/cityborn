import { createPaletteThemes } from '@tamagui/config/v6-builder';

const figmaColors = {
  'dark-blue': '#013548',
  'mid-blue': '#003D57',
  'cta-orange': '#FF7600',
  'light-orange': '#FFAF6A',
  'common-blue': '#00BCBC',
  'secondary-cyan': '#1AFFD9',
  'common-red': '#FF3052',
} as const;

const ctaFrameColors = {
  'cta-border': 'rgba(255, 255, 255, 0.2)',
  'cta-backdrop': 'rgba(0, 0, 0, 0.35)',
} as const;

type GradientStops = readonly [string, string];

export const gradients = {
  'dark-blue': ['#006DA4', '#003D7A'],
  orange: ['#FF9840', '#FF6200'],
  blue: [figmaColors['common-blue'], '#008ABC'],
  yellow: ['#FFD505', '#FFAE00'],
} as const satisfies Record<string, GradientStops>;

const surface = [
  '#FFFFFF',
  '#C5FFF6',
  '#8DFFEC',
  '#53FFE3',
  figmaColors['secondary-cyan'],
  figmaColors['common-blue'],
  gradients.blue[1],
  gradients['dark-blue'][0],
  gradients['dark-blue'][1],
  figmaColors['mid-blue'],
  figmaColors['dark-blue'],
] as const;

const brand = [
  '#FFEFE1',
  '#FFDBBC',
  '#FFC38F',
  figmaColors['light-orange'],
  gradients.orange[0],
  figmaColors['cta-orange'],
  gradients.orange[1],
  '#BF4A00',
  '#803100',
  '#4D1D00',
  '#260F00',
] as const;

const paletteThemes = createPaletteThemes({ surface, brand });

export const palette = {
  themes: paletteThemes.themes,
  colorTokens: {
    ...paletteThemes.colorTokens,
    ...figmaColors,
    ...ctaFrameColors,
  },
};
