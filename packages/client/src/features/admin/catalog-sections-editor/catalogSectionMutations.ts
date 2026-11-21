import {
  type CatalogSection,
  type CatalogSectionId,
  type CatalogSectionMoveDirection,
  resolveErrorMessage,
  type SaveCatalogSection,
  type SaveCatalogSectionSchema,
} from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';
import type { CatalogSectionApi } from '../../../domains/catalog-section/catalogSectionApi';
import { updateCatalogSectionsCache } from '../../../domains/catalog-section/catalogSectionQueries';
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
  sections,
  editedSectionId,
  creationForm,
  editForm,
  dispatch,
  setIsMoving,
  setIsDeleting,
}: {
  catalogSectionApi: CatalogSectionApi;
  queryClient: QueryClient;
  sections: CatalogSection[];
  editedSectionId: CatalogSectionId | null;
  creationForm: CatalogSectionForm;
  editForm: CatalogSectionForm;
  dispatch: (action: Parameters<typeof catalogSectionEditorReducer>[1]) => void;
  setIsMoving: (isMoving: boolean) => void;
  setIsDeleting: (isDeleting: boolean) => void;
}): CatalogSectionMutations {
  return {
    createCatalogSection: creationForm.handleSubmit(
      async (data: SaveCatalogSection) => {
        dispatch({ type: 'creationError', message: null });
        try {
          const section: CatalogSection =
            await catalogSectionApi.createCatalogSection(data);
          updateCatalogSectionsCache({
            queryClient,
            sections: [...sections, section],
          });
          creationForm.reset();
        } catch (error: unknown) {
          dispatch({
            type: 'creationError',
            message: resolveErrorMessage(error),
          });
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
          updateCatalogSectionsCache({
            queryClient,
            sections: sections.map((section) =>
              section.id === id ? renamedSection : section,
            ),
          });
          dispatch({ type: 'saved', id });
        } catch (error: unknown) {
          dispatch({
            type: 'rowError',
            id,
            message: resolveErrorMessage(error),
          });
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
        updateCatalogSectionsCache({ queryClient, sections: movedSections });
        dispatch({ type: 'moved', id: section.id });
      } catch (error: unknown) {
        dispatch({
          type: 'rowError',
          id: section.id,
          message: resolveErrorMessage(error),
        });
      } finally {
        setIsMoving(false);
      }
    },
    deleteCatalogSection: async (section) => {
      setIsDeleting(true);
      try {
        await catalogSectionApi.deleteCatalogSection(section.id);
        updateCatalogSectionsCache({
          queryClient,
          sections: sections.filter((item) => item.id !== section.id),
        });
        dispatch({ type: 'saved', id: section.id });
      } catch (error: unknown) {
        dispatch({
          type: 'rowError',
          id: section.id,
          message: resolveErrorMessage(error),
        });
      } finally {
        setIsDeleting(false);
      }
    },
  };
}
