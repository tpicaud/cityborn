import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  ApiResponseError,
  buildCatalogSection,
  buildTheme,
  type CatalogSection,
  type CatalogSectionId,
  CatalogSectionMoveDirection,
  type CreateCatalogSection,
  ErrorCode,
  type SaveCatalogSection,
  SaveCatalogSectionSchema,
  type ThemeId,
} from '@cityborn/api';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  QueryClient,
  type QueryKey,
  QueryObserver,
} from '@tanstack/react-query';
import { createFormControl } from 'react-hook-form';
import type { CatalogSectionApi } from '../../../domains/catalog-section/catalogSectionApi';
import { catalogSectionsQueryOptions } from '../../../domains/catalog-section/catalogSectionQueries';
import {
  initialOrderedListEditorState,
  type OrderedListEditorState,
  orderedListEditorReducer,
} from '../ordered-list-editor/orderedListEditorState';
import {
  createOrderedListMutations,
  type OrderedListMutations,
} from '../ordered-list-editor/orderedListMutations';
import { allPacksFilterValue } from './catalogSectionGroups';
import {
  type CatalogSectionCreationFormInput,
  CatalogSectionCreationFormSchema,
  type CatalogSectionFormInput,
  createCatalogSectionList,
  createNextCatalogSectionCreationValues,
} from './catalogSectionList';

type CatalogSectionForm = ReturnType<
  typeof createFormControl<
    CatalogSectionFormInput,
    undefined,
    SaveCatalogSection
  >
>;

type CatalogSectionCreationForm = ReturnType<
  typeof createFormControl<
    CatalogSectionCreationFormInput,
    undefined,
    CreateCatalogSection
  >
>;

type MutationsFixture = {
  queryClient: QueryClient;
  sectionsKey: QueryKey;
  creationForm: CatalogSectionCreationForm;
  editForm: CatalogSectionForm;
  mutations: OrderedListMutations<CatalogSection>;
  state: OrderedListEditorState<CatalogSectionId>;
  reportedErrors: unknown[];
};

const news: CatalogSection = buildCatalogSection({
  id: '00000000-0000-4000-8000-000000000060',
  name: 'Nouveautés',
});
const events: CatalogSection = buildCatalogSection({
  id: '00000000-0000-4000-8000-000000000061',
  name: 'Événements',
});
const duplicateNameError: ApiResponseError = new ApiResponseError({
  code: ErrorCode.CATALOG_SECTION_NAME_ALREADY_EXISTS,
  statusCode: 409,
  message: 'duplicate name',
});

const networkError: TypeError = new TypeError('Network request failed');

function unexpectedCall(): never {
  throw new Error('unexpected catalog section call');
}

function createCatalogSectionForm(context: TestContext): CatalogSectionForm {
  const form: CatalogSectionForm = createFormControl<
    CatalogSectionFormInput,
    undefined,
    SaveCatalogSection
  >({
    resolver: zodResolver(SaveCatalogSectionSchema),
    defaultValues: { name: '' },
  });
  context.after(
    form.subscribe({ formState: { values: true }, callback: () => undefined }),
  );
  return form;
}

function createCatalogSectionCreationForm(
  context: TestContext,
): CatalogSectionCreationForm {
  const form: CatalogSectionCreationForm = createFormControl<
    CatalogSectionCreationFormInput,
    undefined,
    CreateCatalogSection
  >({
    resolver: zodResolver(CatalogSectionCreationFormSchema),
    defaultValues: { name: '', themeId: allPacksFilterValue },
  });
  context.after(
    form.subscribe({ formState: { values: true }, callback: () => undefined }),
  );
  return form;
}

function observeSections({
  context,
  queryClient,
  catalogSectionApi,
}: {
  context: TestContext;
  queryClient: QueryClient;
  catalogSectionApi: CatalogSectionApi;
}): void {
  const observer: QueryObserver<CatalogSection[]> = new QueryObserver(
    queryClient,
    catalogSectionsQueryOptions(catalogSectionApi),
  );
  context.after(observer.subscribe(() => undefined));
}

function createMutationsFixture({
  context,
  catalogSectionApi: overrides,
  state = initialOrderedListEditorState,
  isLoadingSections = false,
}: {
  context: TestContext;
  catalogSectionApi: Partial<CatalogSectionApi>;
  state?: OrderedListEditorState<CatalogSectionId>;
  isLoadingSections?: boolean;
}): MutationsFixture {
  const catalogSectionApi: CatalogSectionApi = {
    getPlayableCatalogSections: unexpectedCall,
    getCatalogSections: unexpectedCall,
    createCatalogSection: unexpectedCall,
    renameCatalogSection: unexpectedCall,
    moveCatalogSection: unexpectedCall,
    deleteCatalogSection: unexpectedCall,
    addPackToCatalogSection: unexpectedCall,
    removePackFromCatalogSection: unexpectedCall,
    movePackInCatalogSection: unexpectedCall,
    ...overrides,
  };
  const queryClient: QueryClient = new QueryClient();
  context.after(() => queryClient.clear());
  const sectionsKey: QueryKey =
    catalogSectionsQueryOptions(catalogSectionApi).queryKey;
  if (isLoadingSections)
    observeSections({ context, queryClient, catalogSectionApi });
  if (!isLoadingSections) queryClient.setQueryData(sectionsKey, [news, events]);
  const creationForm: CatalogSectionCreationForm =
    createCatalogSectionCreationForm(context);
  const editForm: CatalogSectionForm = createCatalogSectionForm(context);
  let currentState: OrderedListEditorState<CatalogSectionId> = state;
  const reportedErrors: unknown[] = [];
  const mutations: OrderedListMutations<CatalogSection> =
    createOrderedListMutations({
      list: createCatalogSectionList({ catalogSectionApi, queryClient }),
      creationForm,
      editForm,
      nextCreationValues: createNextCatalogSectionCreationValues,
      editedId: state.editedId,
      dispatch: (action) => {
        currentState = orderedListEditorReducer(currentState, action);
      },
      reportError: (error) => {
        reportedErrors.push(error);
      },
      setIsMoving: () => undefined,
      setIsDeleting: () => undefined,
    });
  return {
    queryClient,
    sectionsKey,
    creationForm,
    editForm,
    mutations,
    reportedErrors,
    get state() {
      return currentState;
    },
  };
}

describe('createCatalogSectionList', () => {
  it('appends a created section at the end of the list and clears the input', async (context: TestContext) => {
    const classics: CatalogSection = buildCatalogSection({
      id: '00000000-0000-4000-8000-000000000062',
      name: 'Classiques',
    });
    let submitted: CreateCatalogSection | undefined;
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      catalogSectionApi: {
        createCatalogSection: async (section: CreateCatalogSection) => {
          submitted = section;
          return classics;
        },
      },
    });
    fixture.creationForm.setValue('name', '  Classiques  ');

    await fixture.mutations.create();

    assert.deepEqual(submitted, { name: 'Classiques', themeId: null });
    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      events,
      classics,
    ]);
    assert.equal(fixture.creationForm.getValues('name'), '');
  });

  it('creates a section in the selected theme and keeps the theme selected', async (context: TestContext) => {
    const sportThemeId: ThemeId = buildTheme({
      id: '00000000-0000-4000-8000-000000000050',
    }).id;
    const tennis: CatalogSection = buildCatalogSection({
      id: '00000000-0000-4000-8000-000000000062',
      name: 'Tennis',
      themeId: sportThemeId,
    });
    let submitted: CreateCatalogSection | undefined;
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      catalogSectionApi: {
        createCatalogSection: async (section: CreateCatalogSection) => {
          submitted = section;
          return tennis;
        },
      },
    });
    fixture.creationForm.setValue('name', 'Tennis');
    fixture.creationForm.setValue('themeId', sportThemeId);

    await fixture.mutations.create();

    assert.deepEqual(submitted, { name: 'Tennis', themeId: sportThemeId });
    assert.equal(fixture.creationForm.getValues('name'), '');
    assert.equal(fixture.creationForm.getValues('themeId'), sportThemeId);
  });

  it('adds a created section to the sections loaded during its request', async (context: TestContext) => {
    let finishLoading: (sections: CatalogSection[]) => void = () => {};
    const loading: Promise<CatalogSection[]> = new Promise((resolve) => {
      finishLoading = resolve;
    });
    let finishCreation: () => void = () => {};
    const creating: Promise<void> = new Promise((resolve) => {
      finishCreation = resolve;
    });
    const loads: Promise<CatalogSection[]>[] = [
      loading,
      Promise.resolve([news, events]),
    ];
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      isLoadingSections: true,
      catalogSectionApi: {
        getCatalogSections: () => loads.shift() ?? unexpectedCall(),
        createCatalogSection: async () => {
          await creating;
          return events;
        },
      },
    });
    fixture.creationForm.setValue('name', 'Événements');
    const creation: Promise<void> = fixture.mutations.create();
    finishLoading([news]);
    await new Promise<void>((resolve) => setImmediate(resolve));
    finishCreation();

    await creation;

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      events,
    ]);
  });

  it('ignores sections loaded before a creation that responds after it', async (context: TestContext) => {
    let finishLoading: (sections: CatalogSection[]) => void = () => {};
    const loads: Promise<CatalogSection[]>[] = [
      new Promise((resolve) => {
        finishLoading = resolve;
      }),
      Promise.resolve([news, events]),
    ];
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      isLoadingSections: true,
      catalogSectionApi: {
        getCatalogSections: () => loads.shift() ?? unexpectedCall(),
        createCatalogSection: async () => events,
      },
    });
    fixture.creationForm.setValue('name', 'Événements');

    await fixture.mutations.create();
    finishLoading([news]);
    await new Promise<void>((resolve) => setImmediate(resolve));

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      events,
    ]);
  });

  it('keeps the input and the list after a rejected creation', async (context: TestContext) => {
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      catalogSectionApi: {
        createCatalogSection: async () => {
          throw duplicateNameError;
        },
      },
    });
    fixture.creationForm.setValue('name', 'nouveautés');

    await fixture.mutations.create();

    assert.equal(fixture.creationForm.getValues('name'), 'nouveautés');
    assert.deepEqual(fixture.reportedErrors, [duplicateNameError]);
    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      events,
    ]);
  });

  it('shows a renamed section in place and closes its edit', async (context: TestContext) => {
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      state: {
        ...initialOrderedListEditorState,
        editedId: events.id,
      },
      catalogSectionApi: {
        renameCatalogSection: async ({ id, section }) => ({
          id,
          name: section.name,
          isDefault: false,
          themeId: null,
          packIds: [],
        }),
      },
    });
    fixture.editForm.setValue('name', 'Évènements');

    await fixture.mutations.update();

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      { ...events, name: 'Évènements' },
    ]);
    assert.equal(fixture.state.editedId, null);
  });

  it('keeps the edit open and the name unchanged after a rejected rename', async (context: TestContext) => {
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      state: {
        ...initialOrderedListEditorState,
        editedId: events.id,
      },
      catalogSectionApi: {
        renameCatalogSection: async () => {
          throw duplicateNameError;
        },
      },
    });
    fixture.editForm.setValue('name', 'NOUVEAUTÉS');

    await fixture.mutations.update();

    assert.equal(fixture.state.editedId, events.id);
    assert.deepEqual(fixture.reportedErrors, [duplicateNameError]);
    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      events,
    ]);
  });

  it('shows the order returned for a moved section', async (context: TestContext) => {
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      catalogSectionApi: {
        moveCatalogSection: async ({ id, move }) => {
          assert.equal(id, events.id);
          assert.deepEqual(move, { direction: CatalogSectionMoveDirection.UP });
          return [events, news];
        },
      },
    });

    await fixture.mutations.move({ item: events, direction: 'UP' });

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      events,
      news,
    ]);
  });

  it('keeps the order and reports the error of a rejected move', async (context: TestContext) => {
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      catalogSectionApi: {
        moveCatalogSection: async () => {
          throw networkError;
        },
      },
    });

    await fixture.mutations.move({ item: events, direction: 'UP' });

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      events,
    ]);
    assert.deepEqual(fixture.reportedErrors, [networkError]);
  });

  it('removes a deleted section and closes its confirmation', async (context: TestContext) => {
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      state: {
        ...initialOrderedListEditorState,
        deletionId: events.id,
      },
      catalogSectionApi: {
        deleteCatalogSection: async (id) => {
          assert.equal(id, events.id);
        },
      },
    });

    await fixture.mutations.delete(events);

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
    ]);
    assert.equal(fixture.state.deletionId, null);
  });

  it('keeps the section and reports the error of a rejected deletion', async (context: TestContext) => {
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      state: {
        ...initialOrderedListEditorState,
        deletionId: events.id,
      },
      catalogSectionApi: {
        deleteCatalogSection: async () => {
          throw networkError;
        },
      },
    });

    await fixture.mutations.delete(events);

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      events,
    ]);
    assert.deepEqual(fixture.reportedErrors, [networkError]);
  });
});
