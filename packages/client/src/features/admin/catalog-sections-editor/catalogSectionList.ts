import {
  type CatalogSection,
  CatalogSectionMoveDirection,
  type CreateCatalogSection,
  type SaveCatalogSection,
  SaveCatalogSectionSchema,
  ThemeIdSchema,
} from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import type { CatalogSectionApi } from '../../../domains/catalog-section/catalogSectionApi';
import { updateCatalogSectionsCache } from '../../../domains/catalog-section/catalogSectionQueries';
import type { OrderedListOperations } from '../ordered-list-editor/orderedListMutations';
import { allPacksFilterValue } from './catalogSectionGroups';

export type CatalogSectionFormInput = z.input<typeof SaveCatalogSectionSchema>;

export const CatalogSectionCreationFormSchema = SaveCatalogSectionSchema.extend(
  {
    themeId: z
      .literal(allPacksFilterValue)
      .transform((): null => null)
      .or(ThemeIdSchema),
  },
);

export type CatalogSectionCreationFormInput = z.input<
  typeof CatalogSectionCreationFormSchema
>;

export function createNextCatalogSectionCreationValues(
  section: CreateCatalogSection,
): CatalogSectionCreationFormInput {
  return { name: '', themeId: section.themeId ?? allPacksFilterValue };
}

export function createCatalogSectionList({
  catalogSectionApi,
  queryClient,
}: {
  catalogSectionApi: CatalogSectionApi;
  queryClient: QueryClient;
}): OrderedListOperations<
  CatalogSection,
  CreateCatalogSection,
  SaveCatalogSection
> {
  return {
    create: (section) => catalogSectionApi.createCatalogSection(section),
    update: ({ id, edit }) =>
      catalogSectionApi.renameCatalogSection({ id, section: edit }),
    move: ({ id, direction }) =>
      catalogSectionApi.moveCatalogSection({
        id,
        move: { direction: CatalogSectionMoveDirection[direction] },
      }),
    delete: (id) => catalogSectionApi.deleteCatalogSection(id),
    updateCache: (update) =>
      updateCatalogSectionsCache({ queryClient, update }),
  };
}
