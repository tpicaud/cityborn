import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildFullPack,
  buildGuessObject,
  buildPack,
  buildUser,
  type FullPack,
  type GuessObjectId,
  type Pack,
  type ThemeId,
  ThemeIdSchema,
  type UpdatePack,
  type User,
} from '@cityborn/api';
import { QueryClient } from '@tanstack/react-query';
import {
  clearCacheAfterSignOut,
  setCurrentUser,
} from '../../../domains/auth/authQueries';
import type { PackApi } from '../../../domains/pack/packApi';
import {
  fullPackQueryOptions,
  packsQueryOptions,
} from '../../../domains/pack/packQueries';
import { synchronizePackDraft } from '../packEditorState';
import {
  getPackPersistence,
  type PackFields,
  type PackPersistence,
} from './packPersistence';
import { getPackSaveRegistry } from './packSaveRegistry';

type PersistenceFixture = {
  persistence: PackPersistence;
  requests: UpdatePack[];
  deletedPacks: string[];
  queryClient: QueryClient;
  packApi: PackApi;
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
  const pack: FullPack = buildFullPack({
    isPublished: false,
    description: '',
    parentId: null,
  });
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
  queryClient.setQueryData(
    fullPackQueryOptions({ packApi, packId: pack.id }).queryKey,
    pack,
  );
  return {
    persistence: getPackPersistence({ packApi, queryClient, pack }),
    requests,
    deletedPacks,
    queryClient,
    packApi,
  };
}

describe('getPackPersistence', () => {
  it('counts successful writes without counting initial reads, empty flushes or failed writes', async (context: TestContext) => {
    const networkError: TypeError = new TypeError('Network request failed');
    let fails: boolean = true;
    const { persistence }: PersistenceFixture = createFixture({
      context,
      updatePack: async ({ pack }) => {
        if (fails) throw networkError;
        return buildPack(pack);
      },
    });

    assert.equal(persistence.getSnapshot().successfulSaveCount, 0);
    await persistence.flush();
    await assert.rejects(persistence.publish(true), networkError);

    assert.equal(persistence.getSnapshot().successfulSaveCount, 0);

    fails = false;
    await persistence.publish(true);
    await persistence.flush();

    assert.equal(persistence.getSnapshot().successfulSaveCount, 1);
  });

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
      successfulSaveCount: 1,
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
      successfulSaveCount: 0,
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

  it('keeps fields reverted to their initial values after a slow save and a rejected final save', async (context: TestContext) => {
    const started: PromiseWithResolvers<void> = Promise.withResolvers();
    const response: PromiseWithResolvers<Pack> = Promise.withResolvers();
    const networkError: TypeError = new TypeError('Network request failed');
    let requestCount: number = 0;
    const { persistence, requests, queryClient, packApi }: PersistenceFixture =
      createFixture({
        context,
        updatePack: async ({ pack }) => {
          requestCount += 1;
          if (requestCount === 1) {
            started.resolve();
            return response.promise;
          }
          if (requestCount === 2) throw networkError;
          return buildPack(pack);
        },
      });
    const initialPack: FullPack = buildFullPack({
      isPublished: false,
      description: '',
      parentId: null,
    });
    const initialFields: PackFields = {
      name: initialPack.name,
      description: initialPack.description,
      parentId: initialPack.parentId,
      themeId: initialPack.themeId,
    };
    const intermediateFields: PackFields = {
      name: 'Intermediate name',
      description: 'Intermediate description',
      parentId: buildPack({ id: '00000000-0000-4000-8000-000000000020' }).id,
      themeId: lastThemeId,
    };
    let displayedPack: FullPack = initialPack;
    let loadedPack: FullPack = initialPack;
    context.after(
      queryClient.getQueryCache().subscribe(() => {
        const editedPack: FullPack | null | undefined =
          queryClient.getQueryData(
            fullPackQueryOptions({ packApi, packId: initialPack.id }).queryKey,
          );
        if (!editedPack || editedPack === loadedPack) return;
        displayedPack = synchronizePackDraft({
          pack: displayedPack,
          loadedPack,
          editedPack,
          pendingFields: persistence.getPendingFields(),
        });
        loadedPack = editedPack;
      }),
    );

    displayedPack = { ...displayedPack, ...intermediateFields };
    persistence.updateFields(intermediateFields);
    const save: Promise<void> = persistence.flush();
    await started.promise;
    displayedPack = { ...displayedPack, ...initialFields };
    persistence.updateFields(initialFields);
    response.resolve(buildPack({ ...initialPack, ...intermediateFields }));
    await assert.rejects(save, networkError);

    assert.equal(requests.length, 2);
    assert.equal(loadedPack.themeId, lastThemeId);
    assert.deepEqual(displayedPack, initialPack);
    assert.deepEqual(persistence.getPendingFields(), initialFields);
    assert.equal(persistence.getSnapshot().status, 'failed');

    await persistence.flush();

    assert.equal(requests.length, 3);
    assert.equal(requests[2]?.name, 'Monuments');
    assert.equal(requests[2]?.description, '');
    assert.equal(requests[2]?.parentId, null);
    assert.equal(requests[2]?.themeId, initialPack.themeId);
    assert.deepEqual(displayedPack, initialPack);
    assert.deepEqual(persistence.getPendingFields(), {});
    assert.equal(persistence.getSnapshot().status, 'saved');
  });

  it('restores failed edits and retries after an immediate departure and reopening', async (context: TestContext) => {
    const response: PromiseWithResolvers<Pack> = Promise.withResolvers();
    const started: PromiseWithResolvers<void> = Promise.withResolvers();
    const networkError: TypeError = new TypeError('Network request failed');
    let requestCount: number = 0;
    const { persistence, requests, queryClient, packApi }: PersistenceFixture =
      createFixture({
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
    const stopObserving: () => void = persistence.subscribe(() => undefined);

    persistence.updateFields({ name: 'Name entered before going back' });
    stopObserving();
    const departureSave: Promise<void> = persistence.flush();
    await started.promise;
    response.reject(networkError);
    await assert.rejects(departureSave, networkError);
    const cachedPack: FullPack | null | undefined = queryClient.getQueryData(
      fullPackQueryOptions({ packApi, packId: buildPack().id }).queryKey,
    );
    assert.ok(cachedPack);
    const reopenedPersistence: PackPersistence = getPackPersistence({
      queryClient,
      packApi,
      pack: cachedPack,
    });
    reopenedPersistence.synchronize(cachedPack);
    const reopenedPack: FullPack = synchronizePackDraft({
      pack: cachedPack,
      loadedPack: cachedPack,
      editedPack: cachedPack,
      pendingFields: reopenedPersistence.getPendingFields(),
    });

    assert.equal(cachedPack.name, 'Monuments');
    assert.equal(reopenedPack.name, 'Name entered before going back');
    assert.equal(reopenedPersistence.getSnapshot().status, 'failed');

    await reopenedPersistence.flush();

    assert.equal(requests.length, 2);
    assert.equal(requests[1]?.name, 'Name entered before going back');
    assert.equal(reopenedPersistence.getSnapshot().status, 'saved');
    assert.equal(
      queryClient.getQueryData<FullPack>(
        fullPackQueryOptions({ packApi, packId: cachedPack.id }).queryKey,
      )?.name,
      'Name entered before going back',
    );
  });

  it('reuses a pending request when reopening before the departure save completes', async (context: TestContext) => {
    const response: PromiseWithResolvers<Pack> = Promise.withResolvers();
    const started: PromiseWithResolvers<void> = Promise.withResolvers();
    const { persistence, requests, queryClient, packApi }: PersistenceFixture =
      createFixture({
        context,
        updatePack: async () => {
          started.resolve();
          return response.promise;
        },
      });
    const initialPack: FullPack = buildFullPack({
      isPublished: false,
      description: '',
      parentId: null,
    });

    persistence.updateFields({ themeId: lastThemeId });
    const departureSave: Promise<void> = persistence.flush();
    await started.promise;
    const reopenedPersistence: PackPersistence = getPackPersistence({
      queryClient,
      packApi,
      pack: initialPack,
    });
    const reopenedPack: FullPack = synchronizePackDraft({
      pack: initialPack,
      loadedPack: initialPack,
      editedPack: initialPack,
      pendingFields: reopenedPersistence.getPendingFields(),
    });
    const reopenedSave: Promise<void> = reopenedPersistence.flush();
    response.resolve(buildPack({ ...initialPack, themeId: lastThemeId }));
    await Promise.all([departureSave, reopenedSave]);

    assert.equal(reopenedPack.themeId, lastThemeId);
    assert.equal(requests.length, 1);
    assert.equal(reopenedPersistence.getSnapshot().status, 'saved');
  });

  it('drops failed drafts at sign-out before another account edits the pack', async (context: TestContext) => {
    let rejects: boolean = true;
    const { persistence, requests, queryClient, packApi }: PersistenceFixture =
      createFixture({
        context,
        updatePack: async ({ pack }) => {
          if (rejects) throw new TypeError('Network request failed');
          return buildPack(pack);
        },
      });
    persistence.updateFields({ name: 'First account draft' });
    await assert.rejects(persistence.flush());

    await clearCacheAfterSignOut(queryClient);
    rejects = false;
    const nextPersistence: PackPersistence = getPackPersistence({
      queryClient,
      packApi,
      pack: buildFullPack({ name: 'Server name' }),
    });
    persistence.updateFields({ name: 'Stale editor' });
    await persistence.flush();
    nextPersistence.updateFields({ description: 'Second account description' });
    await nextPersistence.flush();

    assert.notEqual(nextPersistence, persistence);
    assert.deepEqual(persistence.getPendingFields(), {});
    assert.equal(requests.length, 2);
    assert.equal(requests[1]?.name, 'Server name');
    assert.equal(requests[1]?.description, 'Second account description');
  });

  it('cancels delayed saves and departure flushes at sign-out', async (context: TestContext) => {
    const { persistence, requests, queryClient }: PersistenceFixture =
      createFixture({ context });
    const registry: ReturnType<typeof getPackSaveRegistry> =
      getPackSaveRegistry(queryClient);
    persistence.updateFields({ name: 'First account draft' });

    await clearCacheAfterSignOut(queryClient);
    context.mock.timers.tick(1000);
    await persistence.flush();

    assert.equal(requests.length, 0);
    assert.deepEqual(persistence.getPendingFields(), {});
    assert.equal(registry.getSnapshot(), false);
  });

  it('ignores late responses and follow-up writes from a signed-out account', async (context: TestContext) => {
    const response: PromiseWithResolvers<Pack> = Promise.withResolvers();
    const started: PromiseWithResolvers<void> = Promise.withResolvers();
    const { persistence, requests, queryClient, packApi }: PersistenceFixture =
      createFixture({
        context,
        updatePack: async () => {
          started.resolve();
          return response.promise;
        },
      });
    const registry: ReturnType<typeof getPackSaveRegistry> =
      getPackSaveRegistry(queryClient);
    const nextPack: FullPack = buildFullPack({ name: 'Second account pack' });
    persistence.updateFields({ name: 'First account draft' });
    const save: Promise<void> = persistence.flush();
    await started.promise;
    persistence.updateFields({ description: 'First account follow-up' });
    const publication: Promise<void> = persistence.publish(true);

    await clearCacheAfterSignOut(queryClient);
    queryClient.setQueryData(packsQueryOptions(packApi).queryKey, [nextPack]);
    queryClient.setQueryData(
      fullPackQueryOptions({ packApi, packId: nextPack.id }).queryKey,
      nextPack,
    );
    response.resolve(buildPack({ name: 'First account draft' }));
    await assert.rejects(save, { name: 'AbortError' });
    await assert.rejects(publication, { name: 'AbortError' });

    assert.equal(requests.length, 1);
    assert.deepEqual(persistence.getPendingFields(), {});
    assert.equal(registry.getSnapshot(), false);
    assert.deepEqual(
      queryClient.getQueryData(packsQueryOptions(packApi).queryKey),
      [nextPack],
    );
    assert.deepEqual(
      queryClient.getQueryData(
        fullPackQueryOptions({ packApi, packId: nextPack.id }).queryKey,
      ),
      nextPack,
    );
  });

  it('keeps the next session draft when an old request fails after sign-out', async (context: TestContext) => {
    const response: PromiseWithResolvers<Pack> = Promise.withResolvers();
    const started: PromiseWithResolvers<void> = Promise.withResolvers();
    const { persistence, queryClient, packApi }: PersistenceFixture =
      createFixture({
        context,
        updatePack: async () => {
          started.resolve();
          return response.promise;
        },
      });
    const registry: ReturnType<typeof getPackSaveRegistry> =
      getPackSaveRegistry(queryClient);
    persistence.updateFields({ name: 'First account draft' });
    const save: Promise<void> = persistence.flush();
    await started.promise;

    await clearCacheAfterSignOut(queryClient);
    const nextPersistence: PackPersistence = getPackPersistence({
      queryClient,
      packApi,
      pack: buildPack(),
    });
    nextPersistence.updateFields({ name: 'Second account draft' });
    response.reject(new TypeError('Network request failed'));
    await assert.rejects(save);

    assert.deepEqual(persistence.getPendingFields(), {});
    assert.equal(registry.getSnapshot(), true);
    assert.equal(registry.get(buildPack().id), nextPersistence);
    assert.deepEqual(nextPersistence.getPendingFields(), {
      name: 'Second account draft',
    });

    await clearCacheAfterSignOut(queryClient);
  });

  it('keeps drafts for the same account and drops them when signing in as another account', async (context: TestContext) => {
    const { queryClient, packApi }: PersistenceFixture = createFixture({
      context,
    });
    const user: User = buildUser();
    await setCurrentUser({ queryClient, user });
    const persistence: PackPersistence = getPackPersistence({
      queryClient,
      packApi,
      pack: buildPack(),
    });
    const registry: ReturnType<typeof getPackSaveRegistry> =
      getPackSaveRegistry(queryClient);
    persistence.updateFields({ name: 'First account draft' });

    await setCurrentUser({ queryClient, user });

    assert.equal(registry.getSnapshot(), true);
    assert.deepEqual(persistence.getPendingFields(), {
      name: 'First account draft',
    });

    await setCurrentUser({
      queryClient,
      user: buildUser({ id: '00000000-0000-4000-8000-000000000099' }),
    });

    assert.equal(registry.getSnapshot(), false);
    assert.deepEqual(persistence.getPendingFields(), {});
  });

  it('keeps failed saves visible to the application after the editor unsubscribes', async (context: TestContext) => {
    let rejects: boolean = true;
    const { persistence, queryClient }: PersistenceFixture = createFixture({
      context,
      updatePack: async ({ pack }) => {
        if (rejects) throw new TypeError('Network request failed');
        return buildPack(pack);
      },
    });
    const registry: ReturnType<typeof getPackSaveRegistry> =
      getPackSaveRegistry(queryClient);
    const applicationSnapshots: boolean[] = [];
    context.after(
      registry.subscribe(() =>
        applicationSnapshots.push(registry.getSnapshot()),
      ),
    );
    const stopObservingEditor: () => void = persistence.subscribe(
      () => undefined,
    );

    persistence.updateFields({ name: 'Draft before going back' });
    stopObservingEditor();
    assert.equal(await registry.flush(), false);

    assert.equal(registry.getSnapshot(), true);
    assert.equal(applicationSnapshots.at(-1), true);

    rejects = false;
    assert.equal(await registry.flush(), true);

    assert.equal(registry.getSnapshot(), false);
    assert.equal(applicationSnapshots.at(-1), false);
  });

  it('keeps unload protection until every pending pack is saved', async (context: TestContext) => {
    const { persistence, queryClient, packApi }: PersistenceFixture =
      createFixture({ context });
    const secondPersistence: PackPersistence = getPackPersistence({
      queryClient,
      packApi,
      pack: buildPack({ id: '00000000-0000-4000-8000-000000000020' }),
    });
    const registry: ReturnType<typeof getPackSaveRegistry> =
      getPackSaveRegistry(queryClient);
    persistence.updateFields({ name: 'First draft' });
    secondPersistence.updateFields({ name: 'Second draft' });

    await persistence.flush();

    assert.equal(registry.getSnapshot(), true);

    assert.equal(await registry.flush(), true);

    assert.equal(registry.getSnapshot(), false);
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
