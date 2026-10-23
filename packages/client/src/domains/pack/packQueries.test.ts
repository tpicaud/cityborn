import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildFullPack,
  buildPack,
  type FullPack,
  type Pack,
  type PackId,
  PackIdSchema,
} from '@cityborn/api';
import {
  QueryClient,
  QueryObserver,
  type QueryObserverResult,
} from '@tanstack/react-query';
import type { PackApi } from './packApi';
import {
  fullPackQueryOptions,
  packsQueryOptions,
  reloadPacks,
  removeDeletedPack,
} from './packQueries';

type PackReads = Partial<Pick<PackApi, 'getFullPack' | 'getPacks'>>;

const deletedPackId: PackId = PackIdSchema.parse('pack-1');

const deletedPack: FullPack = buildFullPack({
  id: deletedPackId,
  name: 'Paris',
  isPublished: false,
});

const keptPack: Pack = buildPack({
  id: 'pack-2',
  name: 'Lyon',
  isPublished: true,
});

const packs: Pack[] = [
  buildPack({ id: deletedPackId, name: 'Paris', isPublished: false }),
  keptPack,
];

function unexpectedCall(): never {
  throw new Error('unexpected pack call');
}

function createFakePackApi({
  getFullPack = unexpectedCall,
  getPacks = unexpectedCall,
}: PackReads): PackApi {
  return {
    getPackTrees: unexpectedCall,
    getPacks,
    getFullPack,
    createPack: unexpectedCall,
    updatePack: unexpectedCall,
    deletePack: unexpectedCall,
  };
}

function waitForFirstData<TData>(
  observer: QueryObserver<TData>,
): Promise<() => void> {
  return new Promise<() => void>((resolve: (stop: () => void) => void) => {
    const stopObserving: () => void = observer.subscribe(
      (result: QueryObserverResult<TData>) => {
        if (result.data !== undefined) resolve(stopObserving);
      },
    );
  });
}

describe('removeDeletedPack', () => {
  it('drops the pack from the list and marks packs stale without refetching the displayed deleted pack', async (context: TestContext) => {
    let fullPackRequestCount: number = 0;
    const packApi: PackApi = createFakePackApi({
      getFullPack: async () => {
        fullPackRequestCount += 1;
        return deletedPack;
      },
      getPacks: async () => packs,
    });
    const queryClient: QueryClient = new QueryClient();
    const fullPackObserver: QueryObserver<FullPack | null> = new QueryObserver(
      queryClient,
      fullPackQueryOptions({
        packApi,
        packId: deletedPackId,
      }),
    );
    await queryClient.query(packsQueryOptions(packApi));
    const stopObservingFullPack: () => void =
      await waitForFirstData(fullPackObserver);
    context.after(() => {
      stopObservingFullPack();
      queryClient.clear();
    });

    await removeDeletedPack({ queryClient, packId: deletedPackId });

    assert.equal(fullPackRequestCount, 1);
    assert.deepEqual(
      queryClient.getQueryData(packsQueryOptions(packApi).queryKey),
      [keptPack],
    );
    assert.equal(
      queryClient.getQueryState(
        fullPackQueryOptions({ packApi, packId: deletedPackId }).queryKey,
      )?.isInvalidated,
      true,
    );
    assert.equal(
      queryClient.getQueryState(packsQueryOptions(packApi).queryKey)
        ?.isInvalidated,
      true,
    );
  });
});

describe('reloadPacks', () => {
  it('drops the displayed list until the new response arrives', async (context: TestContext) => {
    let resolvePacks: (reloadedPacks: Pack[]) => void = () => undefined;
    let packsResponse: () => Promise<Pack[]> = async () => packs;
    const packApi: PackApi = createFakePackApi({
      getPacks: () => packsResponse(),
    });
    const queryClient: QueryClient = new QueryClient();
    const packsObserver: QueryObserver<Pack[]> = new QueryObserver(
      queryClient,
      packsQueryOptions(packApi),
    );
    const stopObservingPacks: () => void =
      await waitForFirstData(packsObserver);
    context.after(() => {
      stopObservingPacks();
      queryClient.clear();
    });
    packsResponse = () =>
      new Promise<Pack[]>((resolve: (reloadedPacks: Pack[]) => void) => {
        resolvePacks = resolve;
      });

    const packsReload: Promise<void> = reloadPacks(queryClient);
    const isPendingDuringReload: boolean =
      packsObserver.getCurrentResult().isPending;
    resolvePacks(packs);
    await packsReload;

    assert.equal(isPendingDuringReload, true);
    assert.deepEqual(packsObserver.getCurrentResult().data, packs);
  });
});
