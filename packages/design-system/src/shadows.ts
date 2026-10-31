const ctaHighlight: string = 'inset 0 2px 0 0 rgba(255, 255, 255, 0.5)';

export const shadows = {
  'relief-orange': `0 4px 0 0 #FE4002, ${ctaHighlight}`,
  'relief-blue': `0 3px 0 0 #00549C, ${ctaHighlight}`,
  'relief-yellow': `0 3px 0 0 #EB8900, ${ctaHighlight}`,
  'relief-green': `0 4px 0 0 #00AF00, ${ctaHighlight}`,
  'relief-pressed': ctaHighlight,
  'tag-selected':
    'inset 0 1px 0 0 rgba(255, 255, 255, 0.58), 0 1px 1.7px 0 rgba(0, 0, 0, 0.43)',
  'nav-bar': 'inset 0 1px 0 0 rgba(26, 255, 217, 0.26)',
  'icon-button': '0 3px 7.9px 0 rgba(0, 0, 0, 0.25)',
  card: '0 4px 12px 0 rgba(0, 0, 0, 0.28)',
  panel: '0 11px 16.7px 0 rgba(0, 0, 0, 0.29)',
} as const;

export const textShadows = {
  'screen-title': '0 5px 9.6px rgba(0, 0, 0, 0.25)',
} as const;
