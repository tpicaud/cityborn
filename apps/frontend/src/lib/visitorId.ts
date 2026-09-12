import { createVisitorIdResolver } from '@cityborn/client/infrastructure';
import type { KeyValueStorage } from '@cityborn/client/ports';

const browserStorage: KeyValueStorage = {
  get: (key) => localStorage.getItem(key),
  set: (key, value) => localStorage.setItem(key, value),
};

export const getOrCreateVisitorId = createVisitorIdResolver(browserStorage);
