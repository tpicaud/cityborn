'use client';

import type {
  Category,
  CategoryId,
  FullCategory,
  GuessObject,
  GuessObjectDraft,
  GuessObjectId,
  UpdateCategory,
  WorldLocationId,
} from '@cityborn/api';
import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';
import type { AdminApi } from './api/adminApi';
import {
  categoriesQueryOptions,
  fullCategoryQueryOptions,
  guessObjectQueryOptions,
  invalidateCategories,
  invalidateCategoriesAfterDeletion,
  invalidateGuessObjects,
} from './api/adminQueries';
import {
  type CategoryEditorState,
  toCategoryEditorState,
} from './categoryEditorState';
import {
  type GuessObjectDraftEditor,
  useGuessObjectDraft,
} from './useGuessObjectDraft';

type CategoryEditorLoadOptions = {
  categoryId: CategoryId;
};

export type CategoryEditorLoad = {
  categoryEditorState: CategoryEditorState;
  retry: () => void;
};

type CategoryEditorOptions = {
  editedCategory: FullCategory;
  onCategoryDeleted: () => void;
};

type CategoryFields = Partial<
  Pick<FullCategory, 'name' | 'description' | 'parentId'>
>;

export type CategoryEditor = {
  category: FullCategory;
  isSaving: boolean;
  updateCategory: (fields: CategoryFields) => void;
  saveCategory: () => Promise<void>;
  publishCategory: (isPublished: boolean) => Promise<void>;
  deleteCategory: () => Promise<void>;
  removeGuessObject: (guessObject: GuessObject) => Promise<void>;
  saveGuessObjectDraft: () => Promise<void>;
  addImportedGuessObject: (guessObjectId: GuessObjectId) => Promise<void>;
  guessObjectDraftEditor: GuessObjectDraftEditor;
};

type GuessObjectUpsert = {
  guessObjects: GuessObject[];
  guessObject: GuessObject;
};

type GuessObjectDraftSave = {
  adminApi: AdminApi;
  guessObjectDraft: GuessObjectDraft;
  worldLocationId: WorldLocationId;
};

const unexpectedErrorMessage: string = 'Erreur inattendue';

const invalidGuessObjectMessage: string = 'Objet non valide';

const invalidWorldLocationMessage: string =
  'Localisation non valide, veuillez resélectionner';

function upsertGuessObject({
  guessObjects,
  guessObject,
}: GuessObjectUpsert): GuessObject[] {
  const isInCategory: boolean = guessObjects.some(
    (categoryGuessObject: GuessObject) =>
      categoryGuessObject.id === guessObject.id,
  );
  if (!isInCategory) return [...guessObjects, guessObject];
  return guessObjects.map((categoryGuessObject: GuessObject) =>
    categoryGuessObject.id === guessObject.id
      ? guessObject
      : categoryGuessObject,
  );
}

function saveGuessObject({
  adminApi,
  guessObjectDraft,
  worldLocationId,
}: GuessObjectDraftSave): Promise<GuessObjectId> {
  const {
    id: guessObjectId,
    world_location: _worldLocation,
    ...guessObjectFields
  }: GuessObjectDraft = guessObjectDraft;
  if (!guessObjectId) {
    return adminApi.createGuessObject({
      ...guessObjectFields,
      world_location_id: worldLocationId,
    });
  }
  return adminApi.updateGuessObject({
    guessObjectId,
    guessObject: { ...guessObjectFields, world_location_id: worldLocationId },
  });
}

export function useCategoryEditorLoad({
  categoryId,
}: CategoryEditorLoadOptions): CategoryEditorLoad {
  const { adminApi }: DomainApis = useDomainApis();
  const fullCategoryQuery: UseQueryResult<FullCategory | null> = useQuery(
    fullCategoryQueryOptions({ adminApi, categoryId }),
  );
  const categoriesQuery: UseQueryResult<Category[]> = useQuery(
    categoriesQueryOptions(adminApi),
  );

  return {
    categoryEditorState: toCategoryEditorState({
      fullCategoryQuery,
      categoriesQuery,
    }),
    retry: () => {
      fullCategoryQuery.refetch();
      categoriesQuery.refetch();
    },
  };
}

export function useCategoryEditor({
  editedCategory,
  onCategoryDeleted,
}: CategoryEditorOptions): CategoryEditor {
  const { adminApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { invokeError } = useError();
  const guessObjectDraftEditor: GuessObjectDraftEditor = useGuessObjectDraft();
  const [category, setCategory] = useState<FullCategory>(editedCategory);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const sendCategoryUpdate = async (
    categoryUpdate: UpdateCategory,
  ): Promise<void> => {
    await adminApi.updateCategory({
      categoryId: categoryUpdate.id,
      category: categoryUpdate,
    });
    await invalidateCategories(queryClient);
  };

  const saveCategoryPublication = async (
    isPublished: boolean,
  ): Promise<void> => {
    setIsSaving(true);
    try {
      await sendCategoryUpdate({
        id: category.id,
        name: category.name,
        isPublished,
        description: category.description,
        parentId: category.parentId,
      });
      setCategory((currentCategory: FullCategory) => ({
        ...currentCategory,
        isPublished,
      }));
    } catch (error: unknown) {
      invokeError(error, unexpectedErrorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const connectGuessObject = async (
    guessObjectId: GuessObjectId,
  ): Promise<GuessObject | null> => {
    try {
      const guessObject: GuessObject | null = await queryClient.fetchQuery(
        guessObjectQueryOptions({ adminApi, guessObjectId }),
      );
      if (!guessObject) return null;

      await sendCategoryUpdate({
        id: category.id,
        name: category.name,
        isPublished: category.isPublished,
        connectIds: [guessObjectId],
      });
      setCategory((currentCategory: FullCategory) => ({
        ...currentCategory,
        guessObjects: upsertGuessObject({
          guessObjects: currentCategory.guessObjects,
          guessObject,
        }),
      }));
      return guessObject;
    } catch (error: unknown) {
      invokeError(error, unexpectedErrorMessage);
      return null;
    }
  };

  const saveGuessObjectDraft = async (): Promise<void> => {
    const { guessObjectDraft }: GuessObjectDraftEditor =
      guessObjectDraftEditor;
    if (!guessObjectDraft) {
      invokeError(invalidGuessObjectMessage);
      return;
    }
    const worldLocationId: WorldLocationId | undefined =
      guessObjectDraft.world_location?.id;
    if (!worldLocationId) {
      invokeError(invalidWorldLocationMessage);
      return;
    }

    try {
      const savedGuessObjectId: GuessObjectId = await saveGuessObject({
        adminApi,
        guessObjectDraft,
        worldLocationId,
      });
      await invalidateGuessObjects(queryClient);
      await connectGuessObject(savedGuessObjectId);
      guessObjectDraftEditor.startGuessObjectCreation();
    } catch (error: unknown) {
      invokeError(error, unexpectedErrorMessage);
    }
  };

  const removeGuessObject = async (guessObject: GuessObject): Promise<void> => {
    const isInCategory: boolean = category.guessObjects.some(
      (categoryGuessObject: GuessObject) =>
        categoryGuessObject.id === guessObject.id,
    );
    if (!isInCategory) return;

    setCategory((currentCategory: FullCategory) => ({
      ...currentCategory,
      guessObjects: currentCategory.guessObjects.filter(
        (categoryGuessObject: GuessObject) =>
          categoryGuessObject.id !== guessObject.id,
      ),
    }));
    try {
      await sendCategoryUpdate({
        id: category.id,
        name: category.name,
        isPublished: category.isPublished,
        disconnectIds: [guessObject.id],
      });
      guessObjectDraftEditor.showGuessObjectDraft(undefined);
    } catch (error: unknown) {
      invokeError(error, unexpectedErrorMessage);
    }
  };

  return {
    category,
    isSaving,
    updateCategory: (fields: CategoryFields) =>
      setCategory((currentCategory: FullCategory) => ({
        ...currentCategory,
        ...fields,
      })),
    saveCategory: () => saveCategoryPublication(category.isPublished),
    publishCategory: saveCategoryPublication,
    deleteCategory: async () => {
      setIsSaving(true);
      try {
        await adminApi.deleteCategory(category.id);
        await invalidateCategoriesAfterDeletion(queryClient);
        onCategoryDeleted();
      } catch (error: unknown) {
        invokeError(error, unexpectedErrorMessage);
      } finally {
        setIsSaving(false);
      }
    },
    removeGuessObject,
    saveGuessObjectDraft,
    addImportedGuessObject: async (guessObjectId: GuessObjectId) => {
      const guessObject: GuessObject | null =
        await connectGuessObject(guessObjectId);
      if (guessObject) guessObjectDraftEditor.showGuessObjectDraft(guessObject);
    },
    guessObjectDraftEditor,
  };
}
