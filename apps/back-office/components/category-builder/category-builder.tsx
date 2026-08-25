'use client';

import type {
  Category,
  FullCategory,
  GuessObject,
  GuessObjectDraft,
  UpdateCategory,
} from '@cityborn/api';
import { toAppError, useError } from '@cityborn/client';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { deleteCategory, saveCategory } from '@/server/use-server/category';
import {
  getGuessObject,
  patchGuessObject,
  saveGuessObject,
} from '@/server/use-server/guess-object';
import { GuessObjectBuilder } from '../guess-object-builder/guess-object-builder';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';
import { DeleteCategoryPopup } from './delete-category-popup';
import { GuessObjectsList } from './guess-objects-list';
import { ImportCSVPopup } from './import-csv-popup';
import { PublishCategoryPopup } from './publish-category-popup';

interface CategoryBuilderProps {
  fetchedCategory: FullCategory;
  categories: Category[];
}

export function CategoryBuilder({
  fetchedCategory,
  categories,
}: CategoryBuilderProps) {
  const router = useRouter();
  const { invokeError } = useError();
  const [category, setCategory] = useState<FullCategory>(fetchedCategory);
  const [guessObjectDraft, setGuessObjectDraft] = useState<GuessObjectDraft>();
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [searchObjectValue, setSearchObjectValue] = useState('');

  const filteredGuessObjects = useMemo(() => {
    if (category?.guessObjects) {
      return category.guessObjects.filter((category) =>
        category.name.toLowerCase().includes(searchObjectValue.toLowerCase()),
      );
    } else {
      return [];
    }
  }, [category, searchObjectValue]);

  const updateCategory = (update: Partial<FullCategory>) => {
    setCategory((prev) =>
      prev ? { ...prev, ...update } : (update as FullCategory),
    );
  };

  function handleCreateGuessObject() {
    setGuessObjectDraft({
      name: '',
      id: '',
    });
  }

  function handleSelectGuessObject(guessObject: GuessObject) {
    if (guessObjectDraft?.name === guessObject.name) {
      setGuessObjectDraft(undefined);
    } else {
      setGuessObjectDraft(guessObject);
    }
  }

  async function handleSaveGuessObjectDraft(): Promise<void> {
    try {
      if (!guessObjectDraft) {
        invokeError('Objet non valide');
        return;
      }

      const locationId = guessObjectDraft.world_location?.id;
      if (!locationId) {
        invokeError('Localisation non valide, veuillez resélectionner');
        return;
      }

      const {
        id: _id,
        world_location: _world_location,
        ...rest
      } = guessObjectDraft;

      let id: string;
      if (guessObjectDraft.id) {
        const result = await patchGuessObject(guessObjectDraft.id, {
          ...rest,
          world_location_id: locationId,
        });
        if (!result.ok) {
          invokeError(toAppError(result.error));
          return;
        }
        id = result.data;
      } else {
        const result = await saveGuessObject({
          ...rest,
          world_location_id: locationId,
        });
        if (!result.ok) {
          invokeError(toAppError(result.error));
          return;
        }
        id = result.data;
      }

      if (!id) {
        invokeError("Erreur lors de l'enregistrement de l'objet");
        return;
      }

      await addOrUpdateGuessObjectToCategory(id);
      handleCreateGuessObject();
    } catch (error) {
      invokeError(error instanceof Error ? error.message : 'Erreur inattendue');
    }
  }

  async function handleSaveCategory(publish?: boolean) {
    try {
      setIsSaveLoading(true);
      const updatedCategory: UpdateCategory = {
        id: category.id,
        name: category.name,
        isPublished: publish ?? false,
        description: category.description,
        parentId: category.parentId,
      };
      const result = await saveCategory(category.id, updatedCategory);
      if (!result.ok) {
        invokeError(toAppError(result.error));
      }
    } catch (error) {
      invokeError(error instanceof Error ? error.message : 'Erreur inattendue');
    } finally {
      setIsSaveLoading(false);
    }
  }

  async function handlePublishCategory(publish: boolean) {
    await handleSaveCategory(publish);
    updateCategory({ isPublished: publish });
  }

  async function handleDeleteCategory() {
    try {
      setIsSaveLoading(true);
      const result = await deleteCategory(category.id);
      if (!result.ok) {
        invokeError(toAppError(result.error));
        return;
      }
      router.push('/dashboard');
    } catch (error) {
      invokeError(error instanceof Error ? error.message : 'Erreur inattendue');
    } finally {
      setIsSaveLoading(false);
    }
  }

  async function addOrUpdateGuessObjectToCategory(id: string) {
    try {
      const objectResult = await getGuessObject(id, ['world_location_preview']);
      if (!objectResult) return;
      if (!objectResult.ok) {
        invokeError(toAppError(objectResult.error));
        return;
      }
      const object = objectResult.data;

      const updatedCategory: UpdateCategory = {
        id: category.id,
        name: category.name,
        isPublished: category.isPublished,
        connectIds: [id],
      };

      const saveResult = await saveCategory(category.id, updatedCategory);
      if (!saveResult.ok) {
        invokeError(toAppError(saveResult.error));
        return;
      }

      setCategory((prev) => {
        if (!prev.guessObjects) prev.guessObjects = [];

        const index = prev.guessObjects.findIndex(
          (obj) => obj.id === object.id,
        );
        let updatedGuessObjects: typeof prev.guessObjects;

        if (index === -1) {
          updatedGuessObjects = [...prev.guessObjects, object];
        } else {
          updatedGuessObjects = prev.guessObjects.map((obj) =>
            obj.id === object.id ? object : obj,
          );
        }

        return { ...prev, guessObjects: updatedGuessObjects };
      });

      setGuessObjectDraft(object);
    } catch (error) {
      invokeError(error instanceof Error ? error.message : 'Erreur inattendue');
    }
  }

  async function handleRemoveFromCategory(guessObject: GuessObject) {
    try {
      if (!category.guessObjects) return;
      const index = category.guessObjects.findIndex(
        (obj) => obj.id === guessObject.id,
      );
      if (index === -1) return;
      const updatedGuessObjects: GuessObject[] = category.guessObjects.filter(
        (obj) => obj.id !== guessObject.id,
      );

      const updated_category: UpdateCategory = {
        id: category.id,
        name: category.name,
        isPublished: category.isPublished,
        disconnectIds: [guessObject.id],
      };
      setCategory({ ...category, guessObjects: updatedGuessObjects });
      const removeResult = await saveCategory(category.id, updated_category);
      if (!removeResult.ok) {
        invokeError(toAppError(removeResult.error));
        return;
      }
      setGuessObjectDraft(undefined);
    } catch (error) {
      invokeError(error instanceof Error ? error.message : 'Erreur inattendue');
    }
  }

  return (
    <div className="flex-1 w-full flex flex-row gap-12">
      <div className="flex-1 flex flex-col gap-8 w-full">
        <div className="flex flex-col w-full">
          <div className="flex flex-row gap-4 mb-2 items-center h-8 ">
            <h2 className="text-xl font-bold">Editeur de catégorie</h2>
            <div className="flex flex-row items-center justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleSaveCategory(category.isPublished)}
              >
                {isSaveLoading ? <Loader /> : <p>Enregistrer</p>}
              </Button>
              <PublishCategoryPopup
                isPublished={category.isPublished}
                handlePublishCategory={handlePublishCategory}
              />
              <DeleteCategoryPopup
                handleDeleteCategory={handleDeleteCategory}
              />
            </div>
          </div>
          <span className="h-[2px] w-full bg-foreground"></span>
        </div>
        <div className="flex-1 flex flex-col gap-8 min-h-0">
          <div className="w-full flex flex-col gap-2">
            <div className="w-full flex flex-row gap-12">
              <div className="h-full flex flex-col w-[30%] min-w-40">
                <label htmlFor="name">Nom</label>
                <input
                  type="text"
                  id="name"
                  name={category.name}
                  placeholder="e.g. Rolland Garros 2024"
                  value={category.name}
                  onChange={(e) => updateCategory({ name: e.target.value })}
                  className="bg-white text-gray-800 rounded-md mt-3 p-2 w-full"
                />
              </div>
              <div className="h-full flex flex-col w-[70%] min-w-72">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="Description"
                  name={category.name}
                  placeholder="e.g. Rolland Garros 2024"
                  value={category.description}
                  onChange={(e) =>
                    updateCategory({ description: e.target.value })
                  }
                  className="bg-white text-gray-800 rounded-md mt-3 p-2 w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="w-full flex flex-row gap-12">
              <div className="h-full flex flex-col w-[70%] min-w-40">
                <label htmlFor="parent">Parent</label>
                <select
                  id="parent"
                  value={category.parentId ?? ''}
                  onChange={(e) =>
                    updateCategory({ parentId: e.target.value || null })
                  }
                  className="bg-white text-gray-800 rounded-md mt-3 p-2 w-full"
                >
                  <option value="">Aucun</option>
                  {categories
                    .filter((c) => c.id !== category.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="h-full flex flex-col w-[30%] min-w-40">
                <span>Visibilité</span>
                <p
                  className={`
                            w-fit p-2 mt-3 text-xs rounded-md border
                            ${category.isPublished ? 'text-green-600 border-green-500' : 'text-orange-500 border-orange-500'}
                            `}
                >
                  {category.isPublished ? 'Publiée' : 'Non publiée'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 flex flex-col h-full gap-2 ">
            <div className="flex flex-row gap-2 items-center h-7">
              <h2 className="flex flex-row gap-1 items-baseline">
                Objets
                <span className="font-bold text-gray-300">
                  {'(' +
                    (category.guessObjects ? category.guessObjects.length : 0) +
                    ')'}
                </span>
              </h2>
              <input
                placeholder="Rechercher"
                value={searchObjectValue}
                onChange={(e) => setSearchObjectValue(e.target.value)}
                className="w-48 p-2 h-full rounded-md border border-gray-300"
              />
              <Button
                variant="primary"
                onClick={handleCreateGuessObject}
                className="h-full font-bold p-auto"
              >
                +
              </Button>
              <ImportCSVPopup
                addOrUpdateGuessObjectToCategory={
                  addOrUpdateGuessObjectToCategory
                }
              />
            </div>

            <div className="relative flex-1 min-h-0 rounded-xl border border-gray-300 overflow-hidden">
              <div
                className="h-full overflow-y-auto 
                                            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
              >
                <div className="p-3">
                  <GuessObjectsList
                    guessObjects={filteredGuessObjects}
                    selectedGuessObject={guessObjectDraft as GuessObject}
                    handleSelectGuessObject={handleSelectGuessObject}
                    handleRemoveFromCategory={handleRemoveFromCategory}
                  />
                </div>
              </div>

              <div
                className="pointer-events-none absolute bottom-0 left-0 right-0 h-16 
                                            bg-gradient-to-t from-neutral-800 to-transparent"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col gap-8">
        <div className="flex flex-col w-full">
          <div className="flex flex-row gap-4 mb-2 items-center h-8">
            <h2 className="text-xl font-bold">Editeur d'objet</h2>
            {guessObjectDraft && (
              <div className="flex items-center">
                <Button
                  size="sm"
                  variant={`${guessObjectDraft.id ? 'outline' : 'primary'}`}
                  onClick={handleSaveGuessObjectDraft}
                >
                  <p className="font-bold">
                    {!guessObjectDraft.id
                      ? "Ajouter l'objet"
                      : "Mettre à jour l'objet"}
                  </p>
                </Button>
              </div>
            )}
          </div>
          <span className="h-[2px] w-full bg-foreground"></span>
        </div>
        <GuessObjectBuilder
          guessObjectDraft={guessObjectDraft}
          setGuessObjectDraft={setGuessObjectDraft}
        />
      </div>
    </div>
  );
}
