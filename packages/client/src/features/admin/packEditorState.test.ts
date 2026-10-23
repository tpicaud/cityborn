import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildFullPack,
  buildPack,
  buildTheme,
  type FullPack,
  type Pack,
  type PackId,
  PackIdSchema,
  type Theme,
} from '@cityborn/api';
import {
  QueryClient,
  QueryObserver,
  type QueryObserverResult,
} from '@tanstack/react-query';
import type { PackApi } from '../../domains/pack/packApi';
import {
  fullPackQueryOptions,
  packsQueryOptions,
} from '../../domains/pack/packQueries';
import type { ThemeApi } from '../../domains/theme/themeApi';
import { themesQueryOptions } from '../../domains/theme/themeQueries';
import { type PackEditorState, toPackEditorState } from './packEditorState';

type PackReads = Pick<PackApi, 'getFullPack' | 'getPacks'>;

type PackEditorObservation = {
  queryClient: QueryClient;
  packApi: PackApi;
  themeApi?: ThemeApi;
};

type PackEditorObservers = {
  fullPackObserver: QueryObserver<FullPack | null>;
  packsObserver: QueryObserver<Pack[]>;
  themesObserver: QueryObserver<Theme[]>;
};

const editedPackId: PackId = PackIdSchema.parse('pack-1');

const editedPack: FullPack = buildFullPack({
  id: editedPackId,
  name: 'Paris',
  isPublished: false,
});

const packs: Pack[] = [
  buildPack({ id: editedPackId, name: 'Paris', isPublished: false }),
];

const themes: Theme[] = [buildTheme()];

const networkError: TypeError = new TypeError('Network request failed');

const loadedThemeApi: ThemeApi = { getThemes: async () => themes };

function unexpectedCall(): never {
  throw new Error('unexpected pack call');
}

function createFakePackApi({ getFullPack, getPacks }: PackReads): PackApi {
  return {
    getPackTrees: unexpectedCall,
    getPacks,
    getFullPack,
    createPack: unexpectedCall,
    updatePack: unexpectedCall,
    deletePack: unexpectedCall,
  };
}

async function loadPackEditorIgnoringFailure({
  queryClient,
  packApi,
  themeApi = loadedThemeApi,
}: PackEditorObservation): Promise<void> {
  await Promise.all([
    queryClient
      .query({
        ...fullPackQueryOptions({
          packApi,
          packId: editedPackId,
        }),
        staleTime: 0,
      })
      .catch(() => null),
    queryClient
      .query({ ...packsQueryOptions(packApi), staleTime: 0 })
      .catch(() => null),
    queryClient
      .query({ ...themesQueryOptions(themeApi), staleTime: 0 })
      .catch(() => null),
  ]);
}

function createPackEditorObservers({
  queryClient,
  packApi,
  themeApi = loadedThemeApi,
}: PackEditorObservation): PackEditorObservers {
  return {
    fullPackObserver: new QueryObserver(
      queryClient,
      fullPackQueryOptions({ packApi, packId: editedPackId }),
    ),
    packsObserver: new QueryObserver(queryClient, packsQueryOptions(packApi)),
    themesObserver: new QueryObserver(
      queryClient,
      themesQueryOptions(themeApi),
    ),
  };
}

function readPackEditorState({
  fullPackObserver,
  packsObserver,
  themesObserver,
}: PackEditorObservers): PackEditorState {
  return toPackEditorState({
    fullPackQuery: fullPackObserver.getCurrentResult(),
    packsQuery: packsObserver.getCurrentResult(),
    themesQuery: themesObserver.getCurrentResult(),
  });
}

describe('toPackEditorState', () => {
  it('reports a pack answered as not found as missing', async (context: TestContext) => {
    const packApi: PackApi = createFakePackApi({
      getFullPack: async () => null,
      getPacks: async () => packs,
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    await loadPackEditorIgnoringFailure({ queryClient, packApi });

    const packEditorState: PackEditorState = readPackEditorState(
      createPackEditorObservers({ queryClient, packApi }),
    );

    assert.deepEqual(packEditorState, { status: 'missing' });
  });

  it('reports a failed first load of the pack list as failed', async (context: TestContext) => {
    const packApi: PackApi = createFakePackApi({
      getFullPack: async () => editedPack,
      getPacks: async () => {
        throw networkError;
      },
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    await loadPackEditorIgnoringFailure({ queryClient, packApi });

    const packEditorState: PackEditorState = readPackEditorState(
      createPackEditorObservers({ queryClient, packApi }),
    );

    assert.deepEqual(packEditorState, { status: 'failed' });
  });

  it('reports a failed first load of the themes as failed', async (context: TestContext) => {
    const packApi: PackApi = createFakePackApi({
      getFullPack: async () => editedPack,
      getPacks: async () => packs,
    });
    const themeApi: ThemeApi = {
      getThemes: async () => {
        throw networkError;
      },
    };
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    await loadPackEditorIgnoringFailure({ queryClient, packApi, themeApi });

    const packEditorState: PackEditorState = readPackEditorState(
      createPackEditorObservers({ queryClient, packApi, themeApi }),
    );

    assert.deepEqual(packEditorState, { status: 'failed' });
  });

  it('keeps the loaded pack after a failed refresh', async (context: TestContext) => {
    let fullPackResponse: () => Promise<FullPack | null> = async () =>
      editedPack;
    const packApi: PackApi = createFakePackApi({
      getFullPack: () => fullPackResponse(),
      getPacks: async () => packs,
    });
    const queryClient: QueryClient = new QueryClient();
    context.after(() => queryClient.clear());
    await loadPackEditorIgnoringFailure({ queryClient, packApi });
    fullPackResponse = async () => {
      throw networkError;
    };
    await loadPackEditorIgnoringFailure({ queryClient, packApi });

    const packEditorState: PackEditorState = readPackEditorState(
      createPackEditorObservers({ queryClient, packApi }),
    );

    assert.deepEqual(packEditorState, {
      status: 'loaded',
      pack: editedPack,
      packs,
      themes,
    });
  });

  it('shows the loading state when retrying after a failed load', async (context: TestContext) => {
    let resolveFullPack: (pack: FullPack) => void = () => undefined;
    let fullPackResponse: () => Promise<FullPack | null> = async () => {
      throw networkError;
    };
    const packApi: PackApi = createFakePackApi({
      getFullPack: () => fullPackResponse(),
      getPacks: async () => packs,
    });
    const queryClient: QueryClient = new QueryClient();
    await loadPackEditorIgnoringFailure({ queryClient, packApi });
    const packEditorObservers: PackEditorObservers = createPackEditorObservers({
      queryClient,
      packApi,
    });
    let stopObservingFullPack: () => void = () => undefined;
    const settledFailure: Promise<void> = new Promise<void>(
      (resolve: () => void) => {
        stopObservingFullPack = packEditorObservers.fullPackObserver.subscribe(
          (fullPackQuery: QueryObserverResult<FullPack | null>) => {
            if (fullPackQuery.isError && !fullPackQuery.isFetching) {
              resolve();
            }
          },
        );
      },
    );
    context.after(() => {
      stopObservingFullPack();
      queryClient.clear();
    });
    await settledFailure;
    fullPackResponse = () =>
      new Promise<FullPack>((resolve: (pack: FullPack) => void) => {
        resolveFullPack = resolve;
      });

    const fullPackRetry: Promise<QueryObserverResult<FullPack | null>> =
      packEditorObservers.fullPackObserver.refetch();
    const packEditorState: PackEditorState =
      readPackEditorState(packEditorObservers);
    resolveFullPack(editedPack);
    await fullPackRetry;

    assert.deepEqual(packEditorState, { status: 'loading' });
  });
});
