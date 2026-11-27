import type {
  CatalogSection,
  CatalogSectionMoveDirection,
  Pack,
} from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { CatalogSectionApi } from '../../../../domains/catalog-section/catalogSectionApi';
import { updateCatalogSectionsCache } from '../../../../domains/catalog-section/catalogSectionQueries';
import type { ReportError } from '../../../../shared/errorReporter';

export type CatalogSectionPackMutations = {
  addPack: (pack: Pack) => Promise<void>;
  removePack: (pack: Pack) => Promise<void>;
  movePack: (move: {
    pack: Pack;
    direction: CatalogSectionMoveDirection;
  }) => Promise<void>;
};

export function createCatalogSectionPackMutations({
  catalogSectionApi,
  queryClient,
  section,
  reportError,
  setIsSaving,
}: {
  catalogSectionApi: CatalogSectionApi;
  queryClient: QueryClient;
  section: CatalogSection;
  reportError: ReportError;
  setIsSaving: (isSaving: boolean) => void;
}): CatalogSectionPackMutations {
  async function saveSectionPacks(
    write: () => Promise<CatalogSection>,
  ): Promise<void> {
    setIsSaving(true);
    try {
      const savedSection: CatalogSection = await write();
      await updateCatalogSectionsCache({
        queryClient,
        update: (sections) =>
          sections.map((cachedSection) =>
            cachedSection.id === savedSection.id ? savedSection : cachedSection,
          ),
      });
    } catch (error: unknown) {
      reportError(error);
    } finally {
      setIsSaving(false);
    }
  }

  return {
    addPack: (pack) =>
      saveSectionPacks(() =>
        catalogSectionApi.addPackToCatalogSection({
          id: section.id,
          packId: pack.id,
        }),
      ),
    removePack: (pack) =>
      saveSectionPacks(() =>
        catalogSectionApi.removePackFromCatalogSection({
          id: section.id,
          packId: pack.id,
        }),
      ),
    movePack: ({ pack, direction }) =>
      saveSectionPacks(() =>
        catalogSectionApi.movePackInCatalogSection({
          id: section.id,
          packId: pack.id,
          move: { direction },
        }),
      ),
  };
}
