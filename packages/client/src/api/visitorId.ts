import { validate as isUuid, v4 as uuidv4 } from 'uuid';
import type { KeyValueStorage } from '../platform/keyValueStorage';

const visitorIdStorageKey = 'visitor_id';

export type VisitorIdProvider = () => Promise<string>;

async function readOrCreateVisitorId(
  keyValueStorage: KeyValueStorage,
): Promise<string> {
  const storedVisitorId: string | null =
    await keyValueStorage.get(visitorIdStorageKey);
  if (storedVisitorId !== null && isUuid(storedVisitorId)) {
    return storedVisitorId;
  }

  const createdVisitorId: string = uuidv4();
  await keyValueStorage.set(visitorIdStorageKey, createdVisitorId);
  return createdVisitorId;
}

export function createVisitorIdProvider(
  keyValueStorage: KeyValueStorage,
): VisitorIdProvider {
  let visitorIdRequest: Promise<string> | undefined;

  return (): Promise<string> => {
    visitorIdRequest ??= readOrCreateVisitorId(keyValueStorage).catch(
      (error: unknown) => {
        visitorIdRequest = undefined;
        throw error;
      },
    );
    return visitorIdRequest;
  };
}
