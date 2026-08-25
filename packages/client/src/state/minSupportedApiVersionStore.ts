'use client';

import { useSyncExternalStore } from 'react';

let minSupportedApiVersion: number | null = null;
const listeners = new Set<() => void>();

export function setMinSupportedApiVersion(version: number): void {
  if (version === minSupportedApiVersion) {
    return;
  }
  minSupportedApiVersion = version;
  for (const listener of listeners) {
    listener();
  }
}

export function getMinSupportedApiVersion(): number | null {
  return minSupportedApiVersion;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMinSupportedApiVersion(): number | null {
  return useSyncExternalStore(
    subscribe,
    getMinSupportedApiVersion,
    getMinSupportedApiVersion,
  );
}
