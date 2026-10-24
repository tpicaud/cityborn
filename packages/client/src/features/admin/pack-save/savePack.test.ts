import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildAdminTheme,
  buildFullPack,
  buildGuessObject,
  buildPack,
  type FullPack,
  type Pack,
} from '@cityborn/api';
import { QueryClient, QueryObserver } from '@tanstack/react-query';
import type { PackApi } from '../../../domains/pack/packApi';
import {
  fullPackQueryOptions,
  packsQueryOptions,
} from '../../../domains/pack/packQueries';
import type { ThemeApi } from '../../../domains/theme/themeApi';
import { themesQueryOptions } from '../../../domains/theme/themeQueries';
import { savePack } from './savePack';

function unexpectedCall(): never {
  throw new Error('unexpected api call');
}

function createPackApi(
  operations: Partial<Pick<PackApi, 'getPacks' | 'getFullPack' | 'updatePack'>>,
): PackApi {
  return {
    getPackTrees: unexpectedCall,
    getPacks: unexpectedCall,
    getFullPack: unexpectedCall,
    createPack: unexpectedCall,
    updatePack: unexpectedCall,
    deletePack: unexpectedCall,
    ...operations,
  };
}

const themeApi: ThemeApi = {
  getThemes: unexpectedCall,
  createTheme: unexpectedCall,
  updateTheme: unexpectedCall,
  deleteTheme: unexpectedCall,
};

describe('savePack', () => {
  it('shows the saved theme immediately in the catalog and when reopening the pack', async (context: TestContext) => {
    const originalPack: FullPack = buildFullPack({
      guessObjects: [buildGuessObject()],
    });
    const savedPack: Pack = buildPack({
      name: 'Updated pack',
      themeId: '00000000-0000-4000-8000-000000000099',
    });
    const keptPack: Pack = buildPack({ id: 'another-pack' });
    const packApi: PackApi = createPackApi({
      updatePack: async ({ packId, pack }) => {
        assert.equal(packId, originalPack.id);
        assert.equal(pack.themeId, savedPack.themeId);
        return savedPack;
      },
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    queryClient.setQueryData(packsQueryOptions(packApi).queryKey, [
      originalPack,
      keptPack,
    ]);
    queryClient.setQueryData(
      fullPackQueryOptions({ packApi, packId: originalPack.id }).queryKey,
      originalPack,
    );
    queryClient.setQueryData(themesQueryOptions(themeApi).queryKey, [
      buildAdminTheme(),
    ]);

    await savePack({ packApi, queryClient, pack: savedPack });
    const catalog: QueryObserver<Pack[]> = new QueryObserver(
      queryClient,
      packsQueryOptions(packApi),
    );
    const editor: QueryObserver<FullPack | null> = new QueryObserver(
      queryClient,
      fullPackQueryOptions({ packApi, packId: originalPack.id }),
    );

    assert.deepEqual(catalog.getCurrentResult().data, [savedPack, keptPack]);
    assert.deepEqual(editor.getCurrentResult().data, {
      ...savedPack,
      guessObjects: originalPack.guessObjects,
    });
    assert.equal(
      queryClient.getQueryState(themesQueryOptions(themeApi).queryKey)
        ?.isInvalidated,
      true,
    );
  });

  it('keeps the saved theme when reads started before the save finish later', async (context: TestContext) => {
    const originalPack: FullPack = buildFullPack();
    const savedPack: Pack = buildPack({
      themeId: '00000000-0000-4000-8000-000000000099',
    });
    let resolvePacks: (packs: Pack[]) => void = () => undefined;
    let resolveFullPack: (pack: FullPack) => void = () => undefined;
    const packApi: PackApi = createPackApi({
      getPacks: () =>
        new Promise<Pack[]>((resolve) => {
          resolvePacks = resolve;
        }),
      getFullPack: () =>
        new Promise<FullPack>((resolve) => {
          resolveFullPack = resolve;
        }),
      updatePack: async () => savedPack,
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    queryClient.setQueryData(packsQueryOptions(packApi).queryKey, [
      originalPack,
    ]);
    queryClient.setQueryData(
      fullPackQueryOptions({ packApi, packId: originalPack.id }).queryKey,
      originalPack,
    );
    const stalePacksRead: Promise<Pack[] | null> = queryClient
      .query(packsQueryOptions(packApi))
      .catch(() => null);
    const staleFullPackRead: Promise<FullPack | null> = queryClient
      .query(fullPackQueryOptions({ packApi, packId: originalPack.id }))
      .catch(() => null);

    await savePack({ packApi, queryClient, pack: savedPack });
    resolvePacks([originalPack]);
    resolveFullPack(originalPack);
    await Promise.all([stalePacksRead, staleFullPackRead]);

    assert.deepEqual(
      queryClient.getQueryData(packsQueryOptions(packApi).queryKey),
      [savedPack],
    );
    assert.deepEqual(
      queryClient.getQueryData(
        fullPackQueryOptions({ packApi, packId: originalPack.id }).queryKey,
      ),
      { ...savedPack, guessObjects: [] },
    );
  });

  it('keeps the cache unchanged when the save fails', async (context: TestContext) => {
    const originalPack: FullPack = buildFullPack();
    const networkError: TypeError = new TypeError('Network request failed');
    const packApi: PackApi = createPackApi({
      updatePack: async () => {
        throw networkError;
      },
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    queryClient.setQueryData(packsQueryOptions(packApi).queryKey, [
      originalPack,
    ]);
    queryClient.setQueryData(
      fullPackQueryOptions({ packApi, packId: originalPack.id }).queryKey,
      originalPack,
    );
    queryClient.setQueryData(themesQueryOptions(themeApi).queryKey, [
      buildAdminTheme(),
    ]);

    await assert.rejects(
      savePack({ packApi, queryClient, pack: originalPack }),
      networkError,
    );

    assert.deepEqual(
      queryClient.getQueryData(packsQueryOptions(packApi).queryKey),
      [originalPack],
    );
    assert.deepEqual(
      queryClient.getQueryData(
        fullPackQueryOptions({ packApi, packId: originalPack.id }).queryKey,
      ),
      originalPack,
    );
    assert.equal(
      queryClient.getQueryState(themesQueryOptions(themeApi).queryKey)
        ?.isInvalidated,
      false,
    );
  });

  it('leaves unloaded lists and full packs for their next server read', async (context: TestContext) => {
    const savedPack: Pack = buildPack();
    const packApi: PackApi = createPackApi({
      updatePack: async () => savedPack,
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());

    await savePack({ packApi, queryClient, pack: savedPack });

    assert.equal(
      queryClient.getQueryData(packsQueryOptions(packApi).queryKey),
      undefined,
    );
    assert.equal(
      queryClient.getQueryData(
        fullPackQueryOptions({ packApi, packId: savedPack.id }).queryKey,
      ),
      undefined,
    );
  });
});
