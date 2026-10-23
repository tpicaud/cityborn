export const API_DOMAINS = [
  'auth',
  /**
   * @deprecated Utiliser `pack` à la place. Conservé pour les routes
   * `/category` dépréciées.
   * @deprecatedSince 2026-10-23
   */
  'category',
  'game-record',
  'guess-object',
  'health',
  'pack',
  'search',
  'sentence',
  'session',
  'user',
  'world-location',
] as const;

export type ApiDomain = (typeof API_DOMAINS)[number];
