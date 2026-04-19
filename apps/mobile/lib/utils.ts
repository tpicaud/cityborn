import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getBaseUrl(): string {
  const base_url = process.env.EXPO_PUBLIC_REST_BACKEND_URL;
  if (!base_url) throw new Error('Base url is undefined');
  return base_url;
}
