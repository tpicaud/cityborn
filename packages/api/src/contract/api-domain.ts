export const API_DOMAINS = [
  'auth',
  'category',
  'game-record',
  'guess-object',
  'health',
  'search',
  'sentence',
  'session',
  'user',
  'world-location',
] as const;

export type ApiDomain = (typeof API_DOMAINS)[number];
