'use client';

import {
  type Category,
  type CategoryId,
  type FullCategory,
  type GuessObject,
  type GuessObjectDraft,
  type GuessObjectId,
  type UpdateCategory,
  UserFacingError,
  type WorldLocationId,
} from '@cityborn/api';
import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useState } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import {
  categoriesQueryOptions,
  fullCategoryQueryOptions,
  markCategoriesStale,
  removeDeletedCategory,
} from '../../domains/category/categoryQueries';
import { guessObjectQueryOptions } from '../../domains/guess-object/guessObjectQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import {
  type CategoryEditorState,
  toCategoryEditorState,
} from './categoryEditorState';
import { saveGuessObject } from './guessObjectSave';
import {
  type GuessObjectDraftEditor,
  useGuessObjectDraftEditor,
} from './useGuessObjectDraftEditor';

export type CategoryEditorLoadOptions = {
  categoryId: CategoryId;
};

export type CategoryEditorLoad = {
  categoryEditorState: CategoryEditorState;
  retry: () => void;
};

export type CategoryEditorOptions = {
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

export function useCategoryEditorLoad({
  categoryId,
}: CategoryEditorLoadOptions): CategoryEditorLoad {
  const { categoryApi }: DomainApis = useDomainApis();
  const fullCategoryQuery: UseQueryResult<FullCategory | null> = useQuery(
    fullCategoryQueryOptions({ categoryApi, categoryId }),
  );
  const categoriesQuery: UseQueryResult<Category[]> = useQuery(
    categoriesQueryOptions(categoryApi),
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
  const { categoryApi, guessObjectApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const guessObjectDraftEditor: GuessObjectDraftEditor =
    useGuessObjectDraftEditor();
  const [category, setCategory] = useState<FullCategory>(editedCategory);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const sendCategoryUpdate = async (
    categoryUpdate: UpdateCategory,
  ): Promise<void> => {
    await categoryApi.updateCategory({
      categoryId: categoryUpdate.id,
      category: categoryUpdate,
    });
    await markCategoriesStale(queryClient);
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
      reportError(error, unexpectedErrorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const connectGuessObject = async (
    guessObjectId: GuessObjectId,
  ): Promise<GuessObject | null> => {
    try {
      const guessObject: GuessObject | null = await queryClient.query(
        guessObjectQueryOptions({ guessObjectApi, guessObjectId }),
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
      reportError(error, unexpectedErrorMessage);
      return null;
    }
  };

  const saveGuessObjectDraft = async (): Promise<void> => {
    const { guessObjectDraft }: GuessObjectDraftEditor = guessObjectDraftEditor;
    if (!guessObjectDraft) {
      reportError(new UserFacingError(invalidGuessObjectMessage));
      return;
    }
    const worldLocationId: WorldLocationId | undefined =
      guessObjectDraft.world_location?.id;
    if (!worldLocationId) {
      reportError(new UserFacingError(invalidWorldLocationMessage));
      return;
    }

    try {
      const {
        id: guessObjectId,
        world_location: _worldLocation,
        ...guessObjectFields
      }: GuessObjectDraft = guessObjectDraft;
      const savedGuessObjectId: GuessObjectId = await saveGuessObject({
        guessObjectApi,
        queryClient,
        guessObjectId,
        guessObject: {
          ...guessObjectFields,
          world_location_id: worldLocationId,
        },
      });
      await connectGuessObject(savedGuessObjectId);
      guessObjectDraftEditor.startGuessObjectCreation();
    } catch (error: unknown) {
      reportError(error, unexpectedErrorMessage);
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
      reportError(error, unexpectedErrorMessage);
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
        await categoryApi.deleteCategory(category.id);
        await removeDeletedCategory({ queryClient, categoryId: category.id });
        onCategoryDeleted();
      } catch (error: unknown) {
        reportError(error, unexpectedErrorMessage);
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
