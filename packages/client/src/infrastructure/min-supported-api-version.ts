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

export function subscribeToMinSupportedApiVersion(
  listener: () => void,
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
