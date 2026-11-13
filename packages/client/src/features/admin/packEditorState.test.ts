import assert from 'node:assert/strict';
import {
  type AdminTheme,
  buildAdminTheme,
  buildFullPack,
  buildGuessObject,
  type FullPack,
  type PackId,
  PackIdSchema,
} from '@cityborn/api';
import {
  QueryClient,
  QueryObserver,
  type QueryObserverResult,
} from '@tanstack/react-query';
import { describe, it, type TestContext } from 'vitest';
import type { PackApi } from '../../domains/pack/packApi';
import { fullPackQueryOptions } from '../../domains/pack/packQueries';
import type { ThemeApi } from '../../domains/theme/themeApi';
import { themesQueryOptions } from '../../domains/theme/themeQueries';
import {
  type PackEditorState,
  selectPackImagePreview,
  synchronizePackDraft,
  toPackEditorState,
} from './packEditorState';

type PackReads = Pick<PackApi, 'getFullPack'>;

type PackEditorObservation = {
  queryClient: QueryClient;
  packApi: PackApi;
  themeApi?: ThemeApi;
};

type PackEditorObservers = {
  fullPackObserver: QueryObserver<FullPack | null>;
  themesObserver: QueryObserver<AdminTheme[]>;
};

const editedPackId: PackId = PackIdSchema.parse('pack-1');

const editedPack: FullPack = buildFullPack({
  id: editedPackId,
  name: 'Paris',
  isPublished: false,
});

const themes: AdminTheme[] = [buildAdminTheme()];

const networkError: TypeError = new TypeError('Network request failed');

const loadedThemeApi: ThemeApi = {
  getPlayableThemes: unexpectedCall,
  getThemes: async () => themes,
  createTheme: unexpectedCall,
  updateTheme: unexpectedCall,
  moveTheme: unexpectedCall,
  deleteTheme: unexpectedCall,
};

function unexpectedCall(): never {
  throw new Error('unexpected pack call');
}

function createFakePackApi({ getFullPack }: PackReads): PackApi {
  return {
    getPublishedPacks: unexpectedCall,
    getPacks: unexpectedCall,
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
    themesObserver: new QueryObserver(
      queryClient,
      themesQueryOptions(themeApi),
    ),
  };
}

function readPackEditorState({
  fullPackObserver,
  themesObserver,
}: PackEditorObservers): PackEditorState {
  return toPackEditorState({
    fullPackQuery: fullPackObserver.getCurrentResult(),
    themesQuery: themesObserver.getCurrentResult(),
  });
}

describe('toPackEditorState', () => {
  it('reports a pack answered as not found as missing', async (context: TestContext) => {
    const packApi: PackApi = createFakePackApi({
      getFullPack: async () => null,
    });
    const queryClient: QueryClient = new QueryClient();
    context.onTestFinished(() => queryClient.clear());
    await loadPackEditorIgnoringFailure({ queryClient, packApi });

    const packEditorState: PackEditorState = readPackEditorState(
      createPackEditorObservers({ queryClient, packApi }),
    );

    assert.deepEqual(packEditorState, { status: 'missing' });
  });

  it('reports a failed first load of the themes as failed', async (context: TestContext) => {
    const packApi: PackApi = createFakePackApi({
      getFullPack: async () => editedPack,
    });
    const themeApi: ThemeApi = {
      ...loadedThemeApi,
      getThemes: async () => {
        throw networkError;
      },
    };
    const queryClient: QueryClient = new QueryClient();
    context.onTestFinished(() => queryClient.clear());
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
    });
    const queryClient: QueryClient = new QueryClient();
    context.onTestFinished(() => queryClient.clear());
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
    context.onTestFinished(() => {
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

  it('keeps an unsaved image when another field is refreshed', () => {
    const refreshedPack: FullPack = buildFullPack({
      ...editedPack,
      name: 'Paris refreshed',
    });

    const pack: FullPack = synchronizePackDraft({
      pack: { ...editedPack, image: 'https://example.com/unsaved.png' },
      loadedPack: editedPack,
      editedPack: refreshedPack,
    });

    assert.deepEqual(pack, {
      ...refreshedPack,
      image: 'https://example.com/unsaved.png',
    });
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

describe('selectPackImagePreview', () => {
  const storedPack: FullPack = buildFullPack({
    ...editedPack,
    image: 'https://example.com/stored.png',
  });

  it('previews the image typed in the draft', () => {
    const imagePreview: string | undefined = selectPackImagePreview({
      pack: { ...storedPack, image: 'https://example.com/typed.png' },
      editedPack: storedPack,
    });

    assert.equal(imagePreview, 'https://example.com/typed.png');
  });

  it('previews the stored image when the draft image is cleared', () => {
    const imagePreview: string | undefined = selectPackImagePreview({
      pack: { ...storedPack, image: '' },
      editedPack: storedPack,
    });

    assert.equal(imagePreview, 'https://example.com/stored.png');
  });

  it('previews no image when the pack has none', () => {
    const packWithoutImage: FullPack = buildFullPack({
      ...editedPack,
      image: undefined,
    });

    const imagePreview: string | undefined = selectPackImagePreview({
      pack: { ...packWithoutImage, image: '' },
      editedPack: packWithoutImage,
    });

    assert.equal(imagePreview, undefined);
  });
});
