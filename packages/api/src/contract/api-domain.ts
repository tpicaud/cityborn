/**
 * Vocabulaire des domaines métier exposés par l'API : chaque `pathPrefix` de
 * contrat ts-rest en est un, et l'observabilité backend en dérive son champ
 * `domain`.
 */
export const API_DOMAINS = [
  'auth',
  'category',
  'guess-object',
  'health',
  'search',
  'sentence',
  'session',
  'user',
  'world-location',
] as const;

export type ApiDomain = (typeof API_DOMAINS)[number];
