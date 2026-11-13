const ctaHighlight: string = 'inset 0 2px 0 0 rgba(255, 255, 255, 0.5)';

const slimCtaHighlight: string = 'inset 0 1px 0 0 rgba(255, 255, 255, 0.5)';

const tabletCtaHighlight: string = 'inset 0 3px 0 0 rgba(255, 255, 255, 0.5)';

export const shadows = {
  'relief-orange': `0 4px 0 0 #FE4002, ${ctaHighlight}`,
  'relief-blue': `0 3px 0 0 #00549C, ${ctaHighlight}`,
  'relief-yellow': `0 3px 0 0 #EB8900, ${ctaHighlight}`,
  'relief-green': `0 4px 0 0 #00AF00, ${ctaHighlight}`,
  'relief-pressed': ctaHighlight,
  'relief-blue-slim': `0 2px 0 0 #00549C, ${slimCtaHighlight}`,
  'relief-pressed-slim': slimCtaHighlight,
  'relief-orange-tablet': `0 6px 0 0 #FE4002, ${tabletCtaHighlight}`,
  'relief-blue-tablet': `0 5px 0 0 #00549C, ${tabletCtaHighlight}`,
  'relief-yellow-tablet': `0 5px 0 0 #EB8900, ${tabletCtaHighlight}`,
  'relief-pressed-tablet': tabletCtaHighlight,
  'tag-selected':
    'inset 0 1px 0 0 rgba(255, 255, 255, 0.58), 0 1px 1.7px 0 rgba(0, 0, 0, 0.43)',
  'nav-bar': 'inset 0 1px 0 0 rgba(26, 255, 217, 0.26)',
  'icon-button': '0 3px 7.9px 0 rgba(0, 0, 0, 0.25)',
  card: '0 4px 12px 0 rgba(0, 0, 0, 0.28)',
  'card-tablet': '0 10px 29px 0 rgba(0, 0, 0, 0.28)',
  'card-cta':
    'inset 0 1px 0 0 rgba(255, 255, 255, 0.5), inset 0 -2px 0.9px 0 rgba(0, 0, 0, 0.47)',
  'card-cta-tablet':
    'inset 0 2px 0 0 rgba(255, 255, 255, 0.5), inset 0 -5px 2px 0 rgba(0, 0, 0, 0.47)',
  panel: '0 11px 16.7px 0 rgba(0, 0, 0, 0.29)',
  'portrait-card': '0 4px 5.25px 0 rgba(0, 0, 0, 0.25)',
  'portrait-card-tablet': '0 6px 8.2px 0 rgba(0, 0, 0, 0.25)',
  'glow-cta-halo': 'inset 0 0 9.4px 0 rgba(255, 255, 255, 0.3)',
  'glow-cta-halo-tablet': 'inset 0 0 16px 0 rgba(255, 255, 255, 0.3)',
  'banner-plate-blue':
    '2px 5px 7.3px 0 rgba(0, 0, 0, 0.54), 0 4px 0 0 #013463, inset -1px 1px 0 0 #A6F8FF',
  'banner-plate-yellow':
    '-1px 5px 7.3px 0 rgba(0, 0, 0, 0.54), 0 4px 0 0 #FF9500, inset 0 2px 0 0 #FFF9A6',
} as const;

export const textShadows = {
  'screen-title': '0 5px 9.6px rgba(0, 0, 0, 0.25)',
  'cta-label': '0 2px 4px rgba(0, 0, 0, 0.3)',
  'banner-score': '0 2px 4px rgba(0, 0, 0, 0.13)',
} as const;
