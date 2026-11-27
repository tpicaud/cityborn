import type {
  CatalogSection,
  CatalogSectionId,
  CatalogSectionMoveDirection,
  SaveCatalogSection,
  SaveCatalogSectionSchema,
} from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import type { CatalogSectionApi } from '../../../domains/catalog-section/catalogSectionApi';
import { updateCatalogSectionsCache } from '../../../domains/catalog-section/catalogSectionQueries';
import type { ReportError } from '../../../shared/errorReporter';
import type { FormSubmitHandler } from '../../../shared/formSubmitHandler';
import type { catalogSectionEditorReducer } from './catalogSectionEditorState';

export type CatalogSectionMutations = {
  createCatalogSection: FormSubmitHandler;
  renameCatalogSection: FormSubmitHandler;
  moveCatalogSection: (move: {
    section: CatalogSection;
    direction: CatalogSectionMoveDirection;
  }) => Promise<void>;
  deleteCatalogSection: (section: CatalogSection) => Promise<void>;
};

export type CatalogSectionFormInput = z.input<typeof SaveCatalogSectionSchema>;

type CatalogSectionForm = Pick<
  UseFormReturn<CatalogSectionFormInput, undefined, SaveCatalogSection>,
  'handleSubmit' | 'reset'
>;

export function createCatalogSectionMutations({
  catalogSectionApi,
  queryClient,
  editedSectionId,
  creationForm,
  editForm,
  dispatch,
  reportError,
  setIsMoving,
  setIsDeleting,
}: {
  catalogSectionApi: CatalogSectionApi;
  queryClient: QueryClient;
  editedSectionId: CatalogSectionId | null;
  creationForm: CatalogSectionForm;
  editForm: CatalogSectionForm;
  dispatch: (action: Parameters<typeof catalogSectionEditorReducer>[1]) => void;
  reportError: ReportError;
  setIsMoving: (isMoving: boolean) => void;
  setIsDeleting: (isDeleting: boolean) => void;
}): CatalogSectionMutations {
  return {
    createCatalogSection: creationForm.handleSubmit(
      async (data: SaveCatalogSection) => {
        try {
          const section: CatalogSection =
            await catalogSectionApi.createCatalogSection(data);
          await updateCatalogSectionsCache({
            queryClient,
            update: (sections) => [...sections, section],
          });
          creationForm.reset();
        } catch (error: unknown) {
          reportError(error);
        }
      },
    ),
    renameCatalogSection: editForm.handleSubmit(
      async (data: SaveCatalogSection) => {
        const id: CatalogSectionId | null = editedSectionId;
        if (!id) return;
        try {
          const renamedSection: CatalogSection =
            await catalogSectionApi.renameCatalogSection({ id, section: data });
          await updateCatalogSectionsCache({
            queryClient,
            update: (sections) =>
              sections.map((section) =>
                section.id === id ? renamedSection : section,
              ),
          });
          dispatch({ type: 'saved' });
        } catch (error: unknown) {
          reportError(error);
        }
      },
    ),
    moveCatalogSection: async ({ section, direction }) => {
      setIsMoving(true);
      try {
        const movedSections: CatalogSection[] =
          await catalogSectionApi.moveCatalogSection({
            id: section.id,
            move: { direction },
          });
        await updateCatalogSectionsCache({
          queryClient,
          update: () => movedSections,
        });
      } catch (error: unknown) {
        reportError(error);
      } finally {
        setIsMoving(false);
      }
    },
    deleteCatalogSection: async (section) => {
      setIsDeleting(true);
      try {
        await catalogSectionApi.deleteCatalogSection(section.id);
        await updateCatalogSectionsCache({
          queryClient,
          update: (sections) =>
            sections.filter((item) => item.id !== section.id),
        });
        dispatch({ type: 'saved' });
      } catch (error: unknown) {
        reportError(error);
      } finally {
        setIsDeleting(false);
      }
    },
  };
}
