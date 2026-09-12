import { v4 as uuidv4 } from 'uuid';
import type { KeyValueStorage } from '../ports/key-value-storage';

const VISITOR_ID_KEY = 'visitor_id';

export function generateVisitorId(): string {
  return uuidv4();
}

export function createVisitorIdResolver(
  storage: KeyValueStorage,
): () => Promise<string> {
  return async () => {
    const storedVisitorId = await storage.get(VISITOR_ID_KEY);
    if (storedVisitorId) {
      return storedVisitorId;
    }

    const visitorId = generateVisitorId();
    await storage.set(VISITOR_ID_KEY, visitorId);
    return visitorId;
  };
}
