import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  type AdminTheme,
  ApiResponseError,
  buildAdminTheme,
  ErrorCode,
  type SaveTheme,
  SaveThemeSchema,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import { QueryClient, type QueryKey } from '@tanstack/react-query';
import { createFormControl } from 'react-hook-form';
import type { ThemeApi } from '../../../domains/theme/themeApi';
import { themesQueryOptions } from '../../../domains/theme/themeQueries';
import {
  initialThemeEditorState,
  type ThemeEditorState,
  themeEditorReducer,
} from './themeEditorState';
import { createThemeMutations, type ThemeMutations } from './themeMutations';

type ThemeForm = ReturnType<typeof createFormControl<SaveTheme>>;
type ManagementFixture = {
  queryClient: QueryClient;
  themeKey: QueryKey;
  creationForm: ThemeForm;
  renameForm: ThemeForm;
  mutations: ThemeMutations;
  state: ThemeEditorState;
  deletionStates: boolean[];
};

const divers: AdminTheme = buildAdminTheme();
const sport: AdminTheme = buildAdminTheme({
  id: '00000000-0000-4000-8000-000000000001',
  name: 'Sport',
  packCount: 0,
  isDefault: false,
});
const cinema: AdminTheme = buildAdminTheme({
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Cinéma',
  packCount: 0,
  isDefault: false,
});
const packListKey: QueryKey = ['admin', 'packs', 'list'];
const fullPackKey: QueryKey = ['admin', 'packs', 'full', 'pack-1'];
const duplicateNameError: ApiResponseError = new ApiResponseError({
  code: ErrorCode.THEME_NAME_ALREADY_EXISTS,
  statusCode: 409,
  message: 'duplicate name',
});
const attachedPacksError: ApiResponseError = new ApiResponseError({
  code: ErrorCode.THEME_HAS_PACKS,
  statusCode: 400,
  message: 'attached packs',
});

function unexpectedCall(): never {
  throw new Error('unexpected theme call');
}

function createManagementFixture({
  context,
  themeApi: overrides,
  themes = [divers, sport],
  state = initialThemeEditorState,
}: {
  context: TestContext;
  themeApi: Partial<ThemeApi>;
  themes?: AdminTheme[];
  state?: ThemeEditorState;
}): ManagementFixture {
  const themeApi: ThemeApi = {
    getThemes: unexpectedCall,
    createTheme: unexpectedCall,
    updateTheme: unexpectedCall,
    deleteTheme: unexpectedCall,
    ...overrides,
  };
  const queryClient: QueryClient = new QueryClient();
  context.after(() => queryClient.clear());
  const themeKey: QueryKey = themesQueryOptions(themeApi).queryKey;
  queryClient.setQueryData(themeKey, themes);
  queryClient.setQueryData(packListKey, []);
  queryClient.setQueryData(fullPackKey, {});
  const creationForm: ThemeForm = createFormControl<SaveTheme>({
    resolver: zodResolver(SaveThemeSchema),
    defaultValues: { name: '' },
  });
  const renameForm: ThemeForm = createFormControl<SaveTheme>({
    resolver: zodResolver(SaveThemeSchema),
    defaultValues: { name: '' },
  });
  [creationForm, renameForm].forEach((form: ThemeForm) => {
    context.after(
      form.subscribe({
        formState: { values: true },
        callback: () => undefined,
      }),
    );
  });
  let currentState: ThemeEditorState = state;
  const deletionStates: boolean[] = [];
  const mutations: ThemeMutations = createThemeMutations({
    themeApi,
    queryClient,
    themes,
    editedThemeId: state.editedThemeId,
    creationForm,
    renameForm,
    dispatch: (action) => {
      currentState = themeEditorReducer(currentState, action);
    },
    setIsDeleting: (isDeleting: boolean) => deletionStates.push(isDeleting),
  });
  return {
    queryClient,
    themeKey,
    creationForm,
    renameForm,
    mutations,
    get state() {
      return currentState;
    },
    deletionStates,
  };
}

describe('createThemeMutations', () => {
  it('inserts a created theme alphabetically, clears the input and invalidates themes and packs', async (context: TestContext) => {
    let submitted: SaveTheme | undefined;
    const fixture: ManagementFixture = createManagementFixture({
      context,
      themeApi: {
        createTheme: async (theme: SaveTheme) => {
          submitted = theme;
          return cinema;
        },
      },
    });
    fixture.creationForm.setValue('name', '  Cinéma  ');

    await fixture.mutations.createTheme();

    assert.deepEqual(submitted, { name: 'Cinéma' });
    assert.deepEqual(fixture.queryClient.getQueryData(fixture.themeKey), [
      cinema,
      divers,
      sport,
    ]);
    assert.equal(fixture.creationForm.getValues('name'), '');
    assert.equal(
      fixture.queryClient.getQueryState(fixture.themeKey)?.isInvalidated,
      true,
    );
    assert.equal(
      fixture.queryClient.getQueryState(packListKey)?.isInvalidated,
      true,
    );
    assert.equal(
      fixture.queryClient.getQueryState(fullPackKey)?.isInvalidated,
      true,
    );
  });

  it('keeps the creation input and cache after a rejected creation', async (context: TestContext) => {
    const fixture: ManagementFixture = createManagementFixture({
      context,
      themeApi: {
        createTheme: async () => {
          throw duplicateNameError;
        },
      },
    });
    fixture.creationForm.setValue('name', 'sport');

    await fixture.mutations.createTheme();

    assert.equal(fixture.creationForm.getValues('name'), 'sport');
    assert.equal(fixture.state.creationError, 'Ce thème existe déjà');
    assert.deepEqual(fixture.queryClient.getQueryData(fixture.themeKey), [
      divers,
      sport,
    ]);
    assert.equal(
      fixture.queryClient.getQueryState(packListKey)?.isInvalidated,
      false,
    );
  });

  it('reorders a renamed theme while retaining its metadata and invalidates packs', async (context: TestContext) => {
    const fixture: ManagementFixture = createManagementFixture({
      context,
      themes: [divers, { ...sport, packCount: 3 }],
      state: { ...initialThemeEditorState, editedThemeId: sport.id },
      themeApi: {
        updateTheme: async ({ id, theme }) => {
          assert.equal(id, sport.id);
          assert.deepEqual(theme, { name: 'Art' });
          return { id, name: theme.name, icon: sport.icon };
        },
      },
    });
    fixture.renameForm.setValue('name', 'Art');

    await fixture.mutations.renameTheme();

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.themeKey), [
      { ...sport, name: 'Art', packCount: 3 },
      divers,
    ]);
    assert.equal(fixture.state.editedThemeId, null);
    assert.equal(
      fixture.queryClient.getQueryState(fixture.themeKey)?.isInvalidated,
      true,
    );
    assert.equal(
      fixture.queryClient.getQueryState(packListKey)?.isInvalidated,
      true,
    );
    assert.equal(
      fixture.queryClient.getQueryState(fullPackKey)?.isInvalidated,
      true,
    );
  });

  it('keeps the rename input and row open after a rejected rename', async (context: TestContext) => {
    const fixture: ManagementFixture = createManagementFixture({
      context,
      state: { ...initialThemeEditorState, editedThemeId: sport.id },
      themeApi: {
        updateTheme: async () => {
          throw duplicateNameError;
        },
      },
    });
    fixture.renameForm.setValue('name', 'divers');

    await fixture.mutations.renameTheme();

    assert.equal(fixture.renameForm.getValues('name'), 'divers');
    assert.equal(fixture.state.editedThemeId, sport.id);
    assert.equal(fixture.state.rowErrors[sport.id], 'Ce thème existe déjà');
    assert.deepEqual(fixture.queryClient.getQueryData(fixture.themeKey), [
      divers,
      sport,
    ]);
    assert.equal(
      fixture.queryClient.getQueryState(packListKey)?.isInvalidated,
      false,
    );
  });

  it('removes a deleted theme, closes confirmation and releases the deletion state', async (context: TestContext) => {
    const fixture: ManagementFixture = createManagementFixture({
      context,
      state: { ...initialThemeEditorState, deletionThemeId: sport.id },
      themeApi: {
        deleteTheme: async (id) => {
          assert.equal(id, sport.id);
          assert.deepEqual(fixture.deletionStates, [true]);
        },
      },
    });

    await fixture.mutations.deleteTheme(sport);

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.themeKey), [
      divers,
    ]);
    assert.equal(fixture.state.deletionThemeId, null);
    assert.deepEqual(fixture.deletionStates, [true, false]);
    assert.equal(
      fixture.queryClient.getQueryState(fixture.themeKey)?.isInvalidated,
      true,
    );
    assert.equal(
      fixture.queryClient.getQueryState(packListKey)?.isInvalidated,
      true,
    );
    assert.equal(
      fixture.queryClient.getQueryState(fullPackKey)?.isInvalidated,
      true,
    );
  });

  [
    {
      count: 1,
      message:
        "Impossible de supprimer « Sport » : 1 pack y est encore rattaché. Change d'abord leur thème.",
    },
    {
      count: 3,
      message:
        "Impossible de supprimer « Sport » : 3 packs y sont encore rattachés. Change d'abord leur thème.",
    },
  ].forEach(({ count, message }: { count: number; message: string }) => {
    it(`uses the reloaded count of ${count} in a refused deletion message`, async (context: TestContext) => {
      const refreshedSport: AdminTheme = { ...sport, packCount: count };
      const fixture: ManagementFixture = createManagementFixture({
        context,
        state: { ...initialThemeEditorState, deletionThemeId: sport.id },
        themeApi: {
          deleteTheme: async () => {
            throw attachedPacksError;
          },
          getThemes: async () => [refreshedSport, divers],
        },
      });

      await fixture.mutations.deleteTheme(sport);

      assert.equal(fixture.state.rowErrors[sport.id], message);
      assert.equal(fixture.state.deletionThemeId, sport.id);
      assert.deepEqual(fixture.queryClient.getQueryData(fixture.themeKey), [
        divers,
        refreshedSport,
      ]);
      assert.deepEqual(fixture.deletionStates, [true, false]);
    });
  });

  it('keeps the known count when the refused deletion cannot reload themes', async (context: TestContext) => {
    const attachedSport: AdminTheme = { ...sport, packCount: 2 };
    const fixture: ManagementFixture = createManagementFixture({
      context,
      themes: [divers, attachedSport],
      themeApi: {
        deleteTheme: async () => {
          throw attachedPacksError;
        },
        getThemes: async () => {
          throw new TypeError('Network request failed');
        },
      },
    });

    await fixture.mutations.deleteTheme(attachedSport);

    assert.equal(
      fixture.state.rowErrors[sport.id],
      "Impossible de supprimer « Sport » : 2 packs y sont encore rattachés. Change d'abord leur thème.",
    );
    assert.deepEqual(fixture.queryClient.getQueryData(fixture.themeKey), [
      divers,
      attachedSport,
    ]);
    assert.deepEqual(fixture.deletionStates, [true, false]);
  });

  it('shows a local error and releases the deletion state after a network failure', async (context: TestContext) => {
    const fixture: ManagementFixture = createManagementFixture({
      context,
      state: { ...initialThemeEditorState, deletionThemeId: sport.id },
      themeApi: {
        deleteTheme: async () => {
          throw new TypeError('Network request failed');
        },
      },
    });

    await fixture.mutations.deleteTheme(sport);

    assert.equal(
      fixture.state.rowErrors[sport.id],
      "Quelque chose s'est mal passé.",
    );
    assert.equal(fixture.state.deletionThemeId, sport.id);
    assert.deepEqual(fixture.queryClient.getQueryData(fixture.themeKey), [
      divers,
      sport,
    ]);
    assert.deepEqual(fixture.deletionStates, [true, false]);
  });
});
