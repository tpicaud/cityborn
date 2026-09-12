'use client';

import { useSyncExternalStore } from 'react';
import {
  getMinSupportedApiVersion,
  subscribeToMinSupportedApiVersion,
} from '../min-supported-api-version';

export function useMinSupportedApiVersion(): number | null {
  return useSyncExternalStore(
    subscribeToMinSupportedApiVersion,
    getMinSupportedApiVersion,
    getMinSupportedApiVersion,
  );
}
