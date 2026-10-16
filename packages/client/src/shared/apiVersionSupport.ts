'use client';

import { API_MIN_SUPPORTED_VERSION_HEADER_NAME } from '@cityborn/api';
import { useSyncExternalStore } from 'react';

let minSupportedApiVersion: number | null = null;
const listeners = new Set<() => void>();

function setMinSupportedApiVersion(version: number): void {
  if (version === minSupportedApiVersion) {
    return;
  }
  minSupportedApiVersion = version;
  listeners.forEach((listener: () => void) => {
    listener();
  });
}

export function recordMinSupportedApiVersion(headers: Headers): void {
  const rawMinSupportedVersion: string | null = headers.get(
    API_MIN_SUPPORTED_VERSION_HEADER_NAME,
  );
  if (rawMinSupportedVersion === null) {
    return;
  }
  const parsedMinSupportedVersion: number = Number(rawMinSupportedVersion);
  if (Number.isInteger(parsedMinSupportedVersion)) {
    setMinSupportedApiVersion(parsedMinSupportedVersion);
  }
}

function getMinSupportedApiVersion(): number | null {
  return minSupportedApiVersion;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export type ApiVersionSupport = {
  minSupportedApiVersion: number | null;
};

export function useApiVersionSupport(): ApiVersionSupport {
  return {
    minSupportedApiVersion: useSyncExternalStore(
      subscribe,
      getMinSupportedApiVersion,
      getMinSupportedApiVersion,
    ),
  };
}
