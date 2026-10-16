import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { KeyValueStorage } from '../platform/keyValueStorage';
import { createVisitorIdProvider, type VisitorIdProvider } from './visitorId';

class InMemoryKeyValueStorage implements KeyValueStorage {
  readonly values: Map<string, string> = new Map<string, string>();

  async get(key: string): Promise<string | null> {
    return this.values.get(key) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.values.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.values.delete(key);
  }
}

const storedVisitorId: string = '0f8fad5b-d9cb-469f-a165-70867728950e';

describe('createVisitorIdProvider', () => {
  it('reuses the stored visitor id', async () => {
    const keyValueStorage: InMemoryKeyValueStorage =
      new InMemoryKeyValueStorage();
    keyValueStorage.values.set('visitor_id', storedVisitorId);
    const getVisitorId: VisitorIdProvider =
      createVisitorIdProvider(keyValueStorage);

    const visitorId: string = await getVisitorId();

    assert.equal(visitorId, '0f8fad5b-d9cb-469f-a165-70867728950e');
  });

  it('creates and stores a visitor id once when none is valid', async () => {
    const keyValueStorage: InMemoryKeyValueStorage =
      new InMemoryKeyValueStorage();
    keyValueStorage.values.set('visitor_id', `"${storedVisitorId}"`);
    const getVisitorId: VisitorIdProvider =
      createVisitorIdProvider(keyValueStorage);

    const [firstVisitorId, secondVisitorId]: string[] = await Promise.all([
      getVisitorId(),
      getVisitorId(),
    ]);

    assert.notEqual(firstVisitorId, `"${storedVisitorId}"`);
    assert.equal(firstVisitorId, secondVisitorId);
    assert.equal(keyValueStorage.values.get('visitor_id'), firstVisitorId);
  });
});
