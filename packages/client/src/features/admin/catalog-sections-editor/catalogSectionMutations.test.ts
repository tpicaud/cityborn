import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  ApiResponseError,
  buildCatalogSection,
  type CatalogSection,
  CatalogSectionMoveDirection,
  ErrorCode,
  type SaveCatalogSection,
  SaveCatalogSectionSchema,
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
  type CatalogSectionEditorState,
  catalogSectionEditorReducer,
  initialCatalogSectionEditorState,
} from './catalogSectionEditorState';
import {
  type CatalogSectionFormInput,
  type CatalogSectionMutations,
  createCatalogSectionMutations,
} from './catalogSectionMutations';

type CatalogSectionForm = ReturnType<
  typeof createFormControl<
    CatalogSectionFormInput,
    undefined,
    SaveCatalogSection
  >
>;

type MutationsFixture = {
  queryClient: QueryClient;
  sectionsKey: QueryKey;
  creationForm: CatalogSectionForm;
  editForm: CatalogSectionForm;
  mutations: CatalogSectionMutations;
  state: CatalogSectionEditorState;
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
  state = initialCatalogSectionEditorState,
  isLoadingSections = false,
}: {
  context: TestContext;
  catalogSectionApi: Partial<CatalogSectionApi>;
  state?: CatalogSectionEditorState;
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
  const creationForm: CatalogSectionForm = createCatalogSectionForm(context);
  const editForm: CatalogSectionForm = createCatalogSectionForm(context);
  let currentState: CatalogSectionEditorState = state;
  const reportedErrors: unknown[] = [];
  const mutations: CatalogSectionMutations = createCatalogSectionMutations({
    catalogSectionApi,
    queryClient,
    editedSectionId: state.editedSectionId,
    creationForm,
    editForm,
    dispatch: (action) => {
      currentState = catalogSectionEditorReducer(currentState, action);
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

describe('createCatalogSectionMutations', () => {
  it('appends a created section at the end of the list and clears the input', async (context: TestContext) => {
    const classics: CatalogSection = buildCatalogSection({
      id: '00000000-0000-4000-8000-000000000062',
      name: 'Classiques',
    });
    let submitted: SaveCatalogSection | undefined;
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      catalogSectionApi: {
        createCatalogSection: async (section: SaveCatalogSection) => {
          submitted = section;
          return classics;
        },
      },
    });
    fixture.creationForm.setValue('name', '  Classiques  ');

    await fixture.mutations.createCatalogSection();

    assert.deepEqual(submitted, { name: 'Classiques' });
    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      events,
      classics,
    ]);
    assert.equal(fixture.creationForm.getValues('name'), '');
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
    const creation: Promise<void> = fixture.mutations.createCatalogSection();
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

    await fixture.mutations.createCatalogSection();
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

    await fixture.mutations.createCatalogSection();

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
        ...initialCatalogSectionEditorState,
        editedSectionId: events.id,
      },
      catalogSectionApi: {
        renameCatalogSection: async ({ id, section }) => ({
          id,
          name: section.name,
          isDefault: false,
          packIds: [],
        }),
      },
    });
    fixture.editForm.setValue('name', 'Évènements');

    await fixture.mutations.renameCatalogSection();

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      { ...events, name: 'Évènements' },
    ]);
    assert.equal(fixture.state.editedSectionId, null);
  });

  it('keeps the edit open and the name unchanged after a rejected rename', async (context: TestContext) => {
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      state: {
        ...initialCatalogSectionEditorState,
        editedSectionId: events.id,
      },
      catalogSectionApi: {
        renameCatalogSection: async () => {
          throw duplicateNameError;
        },
      },
    });
    fixture.editForm.setValue('name', 'NOUVEAUTÉS');

    await fixture.mutations.renameCatalogSection();

    assert.equal(fixture.state.editedSectionId, events.id);
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

    await fixture.mutations.moveCatalogSection({
      section: events,
      direction: CatalogSectionMoveDirection.UP,
    });

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

    await fixture.mutations.moveCatalogSection({
      section: events,
      direction: CatalogSectionMoveDirection.UP,
    });

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
        ...initialCatalogSectionEditorState,
        deletionSectionId: events.id,
      },
      catalogSectionApi: {
        deleteCatalogSection: async (id) => {
          assert.equal(id, events.id);
        },
      },
    });

    await fixture.mutations.deleteCatalogSection(events);

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
    ]);
    assert.equal(fixture.state.deletionSectionId, null);
  });

  it('keeps the section and reports the error of a rejected deletion', async (context: TestContext) => {
    const fixture: MutationsFixture = createMutationsFixture({
      context,
      state: {
        ...initialCatalogSectionEditorState,
        deletionSectionId: events.id,
      },
      catalogSectionApi: {
        deleteCatalogSection: async () => {
          throw networkError;
        },
      },
    });

    await fixture.mutations.deleteCatalogSection(events);

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      events,
    ]);
    assert.deepEqual(fixture.reportedErrors, [networkError]);
  });
});
