import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  type AdminTheme,
  buildAdminTheme,
  buildFullPack,
  buildGuessObject,
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
import type { PackApi } from '../../domains/pack/packApi';
import {
  fullPackQueryOptions,
  packsQueryOptions,
} from '../../domains/pack/packQueries';
import type { ThemeApi } from '../../domains/theme/themeApi';
import { themesQueryOptions } from '../../domains/theme/themeQueries';
import {
  type PackEditorState,
  synchronizePackDraft,
  toPackEditorState,
} from './packEditorState';

type PackReads = Pick<PackApi, 'getFullPack' | 'getPacks'>;

type PackEditorObservation = {
  queryClient: QueryClient;
  packApi: PackApi;
  themeApi?: ThemeApi;
};

type PackEditorObservers = {
  fullPackObserver: QueryObserver<FullPack | null>;
  packsObserver: QueryObserver<Pack[]>;
  themesObserver: QueryObserver<AdminTheme[]>;
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

const themes: AdminTheme[] = [buildAdminTheme()];

const networkError: TypeError = new TypeError('Network request failed');

const loadedThemeApi: ThemeApi = {
  getThemes: async () => themes,
  createTheme: unexpectedCall,
  updateTheme: unexpectedCall,
  deleteTheme: unexpectedCall,
};

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
      ...loadedThemeApi,
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

describe('synchronizePackDraft', () => {
  it('replaces the old cached theme when the editor receives refreshed data', () => {
    const refreshedPack: FullPack = buildFullPack({
      ...editedPack,
      themeId: '00000000-0000-4000-8000-000000000099',
      guessObjects: [buildGuessObject()],
    });

    const pack: FullPack = synchronizePackDraft({
      pack: editedPack,
      loadedPack: editedPack,
      editedPack: refreshedPack,
    });

    assert.deepEqual(pack, refreshedPack);
  });

  it('keeps unsaved fields when another field is refreshed', () => {
    const refreshedPack: FullPack = buildFullPack({
      ...editedPack,
      themeId: '00000000-0000-4000-8000-000000000099',
    });

    const pack: FullPack = synchronizePackDraft({
      pack: { ...editedPack, name: 'Unsaved name' },
      loadedPack: editedPack,
      editedPack: refreshedPack,
    });

    assert.deepEqual(pack, { ...refreshedPack, name: 'Unsaved name' });
  });

  it('keeps a theme selected while a refresh is in flight', () => {
    const draft: FullPack = buildFullPack({
      ...editedPack,
      themeId: '00000000-0000-4000-8000-000000000099',
      guessObjects: [buildGuessObject()],
    });

    const pack: FullPack = synchronizePackDraft({
      pack: draft,
      loadedPack: editedPack,
      editedPack: { ...editedPack, description: 'Updated description' },
    });

    assert.deepEqual(pack, { ...draft, description: 'Updated description' });
  });

  it('discards the draft when opening a different pack', () => {
    const nextPack: FullPack = buildFullPack({ id: 'next-pack' });

    const pack: FullPack = synchronizePackDraft({
      pack: { ...editedPack, name: 'Unsaved name' },
      loadedPack: editedPack,
      editedPack: nextPack,
    });

    assert.deepEqual(pack, nextPack);
  });
});
