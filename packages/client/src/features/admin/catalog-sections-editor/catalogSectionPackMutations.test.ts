import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildCatalogSection,
  buildPack,
  type CatalogSection,
  type CatalogSectionId,
  type Pack,
  type PackId,
} from '@cityborn/api';
import { QueryClient, type QueryKey } from '@tanstack/react-query';
import type { CatalogSectionApi } from '../../../domains/catalog-section/catalogSectionApi';
import { catalogSectionsQueryOptions } from '../../../domains/catalog-section/catalogSectionQueries';
import {
  type CatalogSectionPackMutations,
  createCatalogSectionPackMutations,
} from './catalogSectionPackMutations';

type SectionPackChange = { id: CatalogSectionId; packId: PackId };

type PackMutationsFixture = {
  queryClient: QueryClient;
  sectionsKey: QueryKey;
  mutations: CatalogSectionPackMutations;
  reportedErrors: unknown[];
  savingStates: boolean[];
};

const monuments: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000070',
  name: 'Monuments',
});
const capitals: Pack = buildPack({
  id: '00000000-0000-4000-8000-000000000071',
  name: 'Capitales',
});
const news: CatalogSection = buildCatalogSection({
  id: '00000000-0000-4000-8000-000000000060',
  name: 'Nouveautés',
});
const events: CatalogSection = buildCatalogSection({
  id: '00000000-0000-4000-8000-000000000061',
  name: 'Événements',
  packIds: [monuments.id],
});

const networkError: TypeError = new TypeError('Network request failed');

function unexpectedCall(): never {
  throw new Error('unexpected catalog section call');
}

function createPackMutationsFixture({
  context,
  catalogSectionApi: overrides,
}: {
  context: TestContext;
  catalogSectionApi: Partial<CatalogSectionApi>;
}): PackMutationsFixture {
  const catalogSectionApi: CatalogSectionApi = {
    getPlayableCatalogSections: unexpectedCall,
    getCatalogSections: async () => [news, events],
    createCatalogSection: unexpectedCall,
    renameCatalogSection: unexpectedCall,
    moveCatalogSection: unexpectedCall,
    deleteCatalogSection: unexpectedCall,
    addPackToCatalogSection: unexpectedCall,
    removePackFromCatalogSection: unexpectedCall,
    ...overrides,
  };
  const queryClient: QueryClient = new QueryClient();
  context.after(() => queryClient.clear());
  const sectionsKey: QueryKey =
    catalogSectionsQueryOptions(catalogSectionApi).queryKey;
  queryClient.setQueryData(sectionsKey, [news, events]);
  const reportedErrors: unknown[] = [];
  const savingStates: boolean[] = [];
  const mutations: CatalogSectionPackMutations =
    createCatalogSectionPackMutations({
      catalogSectionApi,
      queryClient,
      section: events,
      reportError: (error) => {
        reportedErrors.push(error);
      },
      setIsSaving: (isSaving) => {
        savingStates.push(isSaving);
      },
    });
  return { queryClient, sectionsKey, mutations, reportedErrors, savingStates };
}

describe('createCatalogSectionPackMutations', () => {
  it('shows an added pack at the end of its section', async (context: TestContext) => {
    let change: SectionPackChange | undefined;
    const fixture: PackMutationsFixture = createPackMutationsFixture({
      context,
      catalogSectionApi: {
        addPackToCatalogSection: async (data: SectionPackChange) => {
          change = data;
          return { ...events, packIds: [monuments.id, capitals.id] };
        },
      },
    });

    await fixture.mutations.addPack(capitals);

    assert.deepEqual(change, { id: events.id, packId: capitals.id });
    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      { ...events, packIds: [monuments.id, capitals.id] },
    ]);
    assert.deepEqual(fixture.savingStates, [true, false]);
  });

  it('shows the section without a removed pack', async (context: TestContext) => {
    const fixture: PackMutationsFixture = createPackMutationsFixture({
      context,
      catalogSectionApi: {
        removePackFromCatalogSection: async () => ({ ...events, packIds: [] }),
      },
    });

    await fixture.mutations.removePack(monuments);

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      { ...events, packIds: [] },
    ]);
  });

  it('keeps the section and reports the error of a rejected addition', async (context: TestContext) => {
    const fixture: PackMutationsFixture = createPackMutationsFixture({
      context,
      catalogSectionApi: {
        addPackToCatalogSection: async () => {
          throw networkError;
        },
      },
    });

    await fixture.mutations.addPack(capitals);

    assert.deepEqual(fixture.queryClient.getQueryData(fixture.sectionsKey), [
      news,
      events,
    ]);
    assert.deepEqual(fixture.reportedErrors, [networkError]);
    assert.deepEqual(fixture.savingStates, [true, false]);
  });
});
