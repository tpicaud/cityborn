import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { KeyValueStorage } from '../ports/key-value-storage';
import { createVisitorIdResolver } from './visitor-id';

function syncStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const store = { ...initial };
  return {
    get: (key) => store[key] ?? null,
    set: (key, value) => {
      store[key] = value;
    },
  };
}

function asyncStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const store = { ...initial };
  return {
    get: async (key) => store[key] ?? null,
    set: async (key, value) => {
      store[key] = value;
    },
  };
}

describe('createVisitorIdResolver', () => {
  it('returns the stored visitor id from a synchronous storage', async () => {
    const resolve = createVisitorIdResolver(
      syncStorage({ visitor_id: 'stored' }),
    );
    assert.equal(await resolve(), 'stored');
  });

  it('returns the stored visitor id from an asynchronous storage', async () => {
    const resolve = createVisitorIdResolver(
      asyncStorage({ visitor_id: 'stored' }),
    );
    assert.equal(await resolve(), 'stored');
  });

  it('generates and persists a visitor id once', async () => {
    const storage = asyncStorage();
    const resolve = createVisitorIdResolver(storage);

    const visitorId = await resolve();
    assert.match(visitorId, /^[0-9a-f-]{36}$/);
    assert.equal(await resolve(), visitorId);
  });
});
