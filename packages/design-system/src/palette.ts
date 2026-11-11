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

const cardFill: string = '#004C61';

function cardFillAt(opacity: number): string {
  const alpha: string = Math.round(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${cardFill}${alpha}`;
}

const cardFadeStepCount: number = 24;

function smootherStep(progress: number): number {
  return progress ** 3 * (progress * (progress * 6 - 15) + 10);
}

const cardFadeInnerStops: string[] = Array.from(
  { length: cardFadeStepCount - 1 },
  (_: unknown, index: number): string =>
    cardFillAt(smootherStep((index + 1) / cardFadeStepCount)),
);

const componentColors = {
  'panel-fill': 'rgba(1, 43, 55, 0.51)',
  'panel-edge': '#107599',
  'panel-edge-faded': 'rgba(16, 117, 153, 0.5)',
  'field-fill': 'rgba(0, 0, 0, 0.08)',
  'field-border': 'rgba(255, 255, 255, 0.15)',
  'field-placeholder': 'rgba(255, 255, 255, 0.24)',
  'tag-fill': 'rgba(0, 0, 0, 0.21)',
  'tag-border': 'rgba(255, 255, 255, 0.39)',
  'badge-fill': 'rgba(0, 0, 0, 0.45)',
  'badge-text': 'rgba(255, 255, 255, 0.68)',
  'progress-track': 'rgba(16, 42, 43, 0.61)',
  'row-fill': 'rgba(0, 0, 0, 0.06)',
  'row-fill-press': 'rgba(255, 255, 255, 0.06)',
  scrim: 'rgba(0, 0, 0, 0.6)',
  'tab-highlight-fill': 'rgba(26, 255, 217, 0.09)',
  'tab-highlight-border': 'rgba(26, 255, 217, 0.48)',
  'outline-cta-fill': 'rgba(46, 21, 0, 0.25)',
  'outline-cta-border': 'rgba(248, 175, 112, 0.6)',
  'outline-cta-ring': 'rgba(0, 0, 0, 0.22)',
  'outline-cta-label': '#F8AF70',
  'separator-shade': 'rgba(0, 0, 0, 0.4)',
  'separator-light': 'rgba(255, 255, 255, 0.28)',
  'headline-kicker': 'rgba(255, 255, 255, 0.38)',
  'card-fill': cardFill,
} as const;

type GradientStops = readonly [string, ...string[], string];

const orangeGradientStart: string = '#FF9840';

export const gradients = {
  'dark-blue': ['#006DA4', '#003D7A'],
  night: ['#002D52', figmaColors['dark-blue']],
  orange: [orangeGradientStart, '#FF6200'],
  'cta-orange': [orangeGradientStart, figmaColors['cta-orange']],
  blue: [figmaColors['common-blue'], '#008ABC'],
  yellow: ['#FFD505', '#FFAE00'],
  green: ['#7BFF61', '#00D540'],
  'card-fade': [cardFillAt(0), ...cardFadeInnerStops, cardFill],
  'card-edge': ['rgba(0, 61, 87, 0)', '#009380'],
} as const satisfies Record<string, GradientStops>;

type GradientName = keyof typeof gradients;

export function verticalGradient(name: GradientName): string {
  const stops: GradientStops = gradients[name];
  return `linear-gradient(180deg, ${stops.join(', ')})`;
}

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
    ...componentColors,
  },
};
