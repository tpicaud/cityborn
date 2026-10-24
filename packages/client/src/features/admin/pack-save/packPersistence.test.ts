import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildGuessObject,
  buildPack,
  type GuessObjectId,
  type Pack,
  type ThemeId,
  ThemeIdSchema,
  type UpdatePack,
} from '@cityborn/api';
import { QueryClient } from '@tanstack/react-query';
import type { PackApi } from '../../../domains/pack/packApi';
import { packsQueryOptions } from '../../../domains/pack/packQueries';
import { createPackPersistence, type PackPersistence } from './packPersistence';

type PersistenceFixture = {
  persistence: PackPersistence;
  requests: UpdatePack[];
  deletedPacks: string[];
  queryClient: QueryClient;
};

const firstThemeId: ThemeId = ThemeIdSchema.parse(
  '00000000-0000-4000-8000-000000000091',
);
const lastThemeId: ThemeId = ThemeIdSchema.parse(
  '00000000-0000-4000-8000-000000000099',
);

function unexpectedCall(): never {
  throw new Error('unexpected api call');
}

function createFixture({
  context,
  updatePack,
}: {
  context: TestContext;
  updatePack?: PackApi['updatePack'];
}): PersistenceFixture {
  context.mock.timers.enable({ apis: ['setTimeout'] });
  const requests: UpdatePack[] = [];
  const deletedPacks: string[] = [];
  const pack: Pack = buildPack({ isPublished: false });
  const packApi: PackApi = {
    getPackTrees: unexpectedCall,
    getPacks: unexpectedCall,
    getFullPack: unexpectedCall,
    createPack: unexpectedCall,
    deletePack: async (packId) => {
      deletedPacks.push(packId);
    },
    updatePack: async (input) => {
      requests.push(input.pack);
      return updatePack ? updatePack(input) : buildPack(input.pack);
    },
  };
  const queryClient: QueryClient = new QueryClient();
  context.after(() => queryClient.clear());
  queryClient.setQueryData(packsQueryOptions(packApi).queryKey, [pack]);
  return {
    persistence: createPackPersistence({ packApi, queryClient, pack }),
    requests,
    deletedPacks,
    queryClient,
  };
}

describe('createPackPersistence', () => {
  it('saves text fields after a pause and coalesces successive keystrokes', async (context: TestContext) => {
    const { persistence, requests }: PersistenceFixture = createFixture({
      context,
    });

    persistence.updateFields({ name: 'First name' });
    context.mock.timers.tick(400);
    persistence.updateFields({
      name: 'Final name',
      description: 'Description',
    });
    context.mock.timers.tick(499);
    assert.equal(requests.length, 0);
    assert.equal(persistence.getSnapshot().status, 'pending');
    context.mock.timers.tick(1);
    await persistence.flush();

    assert.equal(requests.length, 1);
    assert.equal(requests[0]?.name, 'Final name');
    assert.equal(requests[0]?.description, 'Description');
    assert.equal(requests[0]?.isPublished, false);
    assert.deepEqual(persistence.getSnapshot(), {
      status: 'saved',
      errorMessage: null,
    });
  });

  it('saves theme and parent selections without waiting for the text delay', async (context: TestContext) => {
    const { persistence, requests }: PersistenceFixture = createFixture({
      context,
    });
    const started: PromiseWithResolvers<void> = Promise.withResolvers();
    const stop: () => void = persistence.subscribe(() => {
      if (persistence.getSnapshot().status === 'saved') started.resolve();
    });
    context.after(stop);

    persistence.updateFields({ themeId: lastThemeId });
    await started.promise;
    persistence.updateFields({ parentId: buildPack().id });
    await persistence.flush();

    assert.equal(requests.length, 2);
    assert.equal(requests[0]?.themeId, lastThemeId);
    assert.equal(requests[1]?.parentId, '00000000-0000-4000-8000-000000000010');
    assert.equal(requests[1]?.themeId, lastThemeId);
    assert.equal(requests[1]?.isPublished, false);
  });

  it('flushes text edits immediately before leaving the field or page', async (context: TestContext) => {
    const { persistence, requests }: PersistenceFixture = createFixture({
      context,
    });

    persistence.updateFields({ name: 'Saved on departure' });
    await persistence.flush();
    context.mock.timers.tick(500);

    assert.equal(requests.length, 1);
    assert.equal(requests[0]?.name, 'Saved on departure');
    assert.equal(persistence.getSnapshot().status, 'saved');
  });

  it('serializes rapid edits and an explicit publication behind a slow save', async (context: TestContext) => {
    const started: PromiseWithResolvers<void> = Promise.withResolvers();
    const response: PromiseWithResolvers<Pack> = Promise.withResolvers();
    let requestCount: number = 0;
    const { persistence, requests }: PersistenceFixture = createFixture({
      context,
      updatePack: async ({ pack }) => {
        requestCount += 1;
        if (requestCount === 1) {
          started.resolve();
          return response.promise;
        }
        return buildPack(pack);
      },
    });

    persistence.updateFields({ themeId: firstThemeId });
    await started.promise;
    persistence.updateFields({ themeId: lastThemeId });
    persistence.updateFields({
      name: 'Latest name',
      description: 'Latest text',
    });
    const publication: Promise<void> = persistence.publish(true);
    assert.equal(requests.length, 1);
    response.resolve(buildPack({ themeId: firstThemeId, isPublished: false }));
    await publication;

    assert.equal(requests.length, 3);
    assert.equal(requests[1]?.themeId, lastThemeId);
    assert.equal(requests[1]?.name, 'Latest name');
    assert.equal(requests[1]?.description, 'Latest text');
    assert.deepEqual(
      requests.map((request) => request.isPublished),
      [false, false, true],
    );
    assert.equal(requests[2]?.themeId, lastThemeId);
    assert.equal(requests[2]?.name, 'Latest name');
    assert.equal(persistence.getSnapshot().status, 'saved');
  });

  it('keeps newer edits after a rejected save and retries the latest values', async (context: TestContext) => {
    const started: PromiseWithResolvers<void> = Promise.withResolvers();
    const response: PromiseWithResolvers<Pack> = Promise.withResolvers();
    const networkError: TypeError = new TypeError('Network request failed');
    let requestCount: number = 0;
    const { persistence, requests }: PersistenceFixture = createFixture({
      context,
      updatePack: async ({ pack }) => {
        requestCount += 1;
        if (requestCount === 1) {
          started.resolve();
          return response.promise;
        }
        return buildPack(pack);
      },
    });

    persistence.updateFields({ themeId: firstThemeId });
    const initialSave: Promise<void> = persistence.flush();
    await started.promise;
    persistence.updateFields({ themeId: lastThemeId, name: 'Latest name' });
    response.reject(networkError);
    await assert.rejects(initialSave, networkError);
    assert.deepEqual(persistence.getSnapshot(), {
      status: 'failed',
      errorMessage: "Quelque chose s'est mal passé.",
    });
    await persistence.flush();

    assert.equal(requests.length, 2);
    assert.equal(requests[1]?.themeId, lastThemeId);
    assert.equal(requests[1]?.name, 'Latest name');
    assert.equal(persistence.getSnapshot().status, 'saved');
  });

  it('rejects a departure flush and does not publish when saving fields fails', async (context: TestContext) => {
    const networkError: TypeError = new TypeError('Network request failed');
    const { persistence, requests }: PersistenceFixture = createFixture({
      context,
      updatePack: async () => {
        throw networkError;
      },
    });

    persistence.updateFields({ name: 'Pending name' });
    await assert.rejects(persistence.publish(true), networkError);

    assert.equal(requests.length, 1);
    assert.equal(requests[0]?.isPublished, false);
    assert.equal(persistence.getSnapshot().status, 'failed');
  });

  it('retains publication and saved fields when explicitly connecting and removing objects', async (context: TestContext) => {
    const { persistence, requests }: PersistenceFixture = createFixture({
      context,
    });
    const guessObjectId: GuessObjectId = buildGuessObject().id;

    persistence.updateFields({ name: 'Updated name', themeId: lastThemeId });
    await persistence.publish(true);
    await persistence.connect(guessObjectId);
    persistence.updateFields({ description: 'New description' });
    await persistence.disconnect(guessObjectId);

    assert.deepEqual(requests[2]?.connectIds, [guessObjectId]);
    assert.deepEqual(requests[4]?.disconnectIds, [guessObjectId]);
    assert.equal(requests[4]?.name, 'Updated name');
    assert.equal(requests[4]?.themeId, lastThemeId);
    assert.equal(requests[4]?.description, 'New description');
    assert.equal(requests[4]?.isPublished, true);
  });

  it('uses refreshed server metadata for the next edit', async (context: TestContext) => {
    const { persistence, requests }: PersistenceFixture = createFixture({
      context,
    });

    persistence.synchronize(
      buildPack({ isPublished: true, themeId: lastThemeId }),
    );
    persistence.updateFields({ name: 'New name' });
    await persistence.flush();

    assert.equal(requests[0]?.themeId, lastThemeId);
    assert.equal(requests[0]?.isPublished, true);
  });

  it('stops delayed writes after deleting the pack', async (context: TestContext) => {
    const { persistence, requests, deletedPacks }: PersistenceFixture =
      createFixture({ context });

    persistence.updateFields({ name: 'Last name' });
    await persistence.delete();
    persistence.updateFields({ name: 'Too late' });
    context.mock.timers.tick(1000);
    await persistence.flush();

    assert.equal(requests.length, 1);
    assert.deepEqual(deletedPacks, ['00000000-0000-4000-8000-000000000010']);
  });
});
