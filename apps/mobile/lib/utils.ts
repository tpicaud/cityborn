import { type ClassValue, clsx } from 'clsx';
import Constants from 'expo-constants';
import { twMerge } from 'tailwind-merge';
import { mobileClientConfig } from '@/config/client';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export function getBaseUrl(): string {
  return mobileClientConfig.restBackendUrl;
}

export function getAppVersion(): string | undefined {
  return Constants.expoConfig?.version ?? undefined;
}
