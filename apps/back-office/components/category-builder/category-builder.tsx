'use client';

import type {
  Category,
  GuessObject,
  GuessObjectCandidate,
  UpdateCategory,
} from '@cityborn/api';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { GuessObjectBuilder } from '../guess-object-builder/guess-object-builder';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';
import {
  deleteCategory,
  getGuessObject,
  patchGuessObject,
  saveCategory,
  saveGuessObject,
} from './action';
import { DeleteCategoryPopup } from './delete-category-popup';
import { GuessObjectsList } from './guess-objects-list';
import { ImportCSVPopup } from './import-csv-popup';
import { PublishCategoryPopup } from './publish-category-popup';

interface CategoryBuilderProps {
  fetchedCategory: Category;
}

export function CategoryBuilder({ fetchedCategory }: CategoryBuilderProps) {
  const router = useRouter();
  const [category, setCategory] = useState<Category>(fetchedCategory);
  const [guessObjectCandidate, setGuessObjectCandidate] =
    useState<GuessObjectCandidate>();
  const [isSaveLoading, setIsSaveLoading] = useState(false);
  const [searchObjectValue, setSearchObjectValue] = useState('');

  const filteredGuessObjects = useMemo(() => {
    if (category && category.guessObjects) {
      return category.guessObjects.filter((category) =>
        category.name.toLowerCase().includes(searchObjectValue.toLowerCase()),
      );
    } else {
      return [];
    }
  }, [category, searchObjectValue]);

  const updateCategory = (update: Partial<Category>) => {
    setCategory((prev) =>
      prev ? { ...prev, ...update } : (update as Category),
    );
  };

  ///////////////////////////
  // Guess object function //
  ///////////////////////////

  function handleCreateGuessObject() {
    setGuessObjectCandidate({
      name: '',
      id: '',
      world_location_id: '',
    });
  }

  function handleSelectGuessObject(guessObject: GuessObject) {
    if (guessObjectCandidate?.name === guessObject.name) {
      setGuessObjectCandidate(undefined);
    } else {
      setGuessObjectCandidate(guessObject);
    }
  }

  async function handleSaveGuessObjectCandidate(): Promise<void> {
    try {
      if (!guessObjectCandidate) {
        alert('Objet non valide');
        return;
      }

      if (!guessObjectCandidate.world_location_id) {
        alert('Localisation non valide, veuillez resélectionner');
        return;
      }

      // If id, then update, else post
      let id: string;
      if (guessObjectCandidate.id) {
        id = await patchGuessObject(
          guessObjectCandidate.id,
          guessObjectCandidate,
        );
      } else {
        const { id: _id, ...rest } = guessObjectCandidate;
        id = await saveGuessObject({
          ...rest,
          world_location_id: String(guessObjectCandidate.world_location_id),
        });
      }

      if (!id) throw new Error('Error saving or updating object');

      await addOrUpdateGuessObjectToCategory(id);
      handleCreateGuessObject();
    } catch (error) {
      console.log(error);
      alert("Erreur lors de l'enregistrement de l'objet");
    }
  }

  ///////////////////////
  // Category function //
  ///////////////////////

  async function handleSaveCategory(publish?: boolean) {
    try {
      setIsSaveLoading(true);
      const updatedCategory: UpdateCategory = {
        ...category,
        isPublished: publish ?? false,
        guessObjects: undefined,
        guessObjectsIds: undefined,
      };
      await saveCategory(category.id, updatedCategory);
    } catch (error) {
      alert("Erreur lors de l'enregistrement de la catégorie");
      console.error(error);
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
      await deleteCategory(category.id);
      router.push('/dashboard');
    } catch (error) {
      alert('Erreur lors de la suppression de la catégorie');
      console.error(error);
      setIsSaveLoading(false);
    }
  }

  /////////////////////////////////
  // Add to category function //
  /////////////////////////////////

  async function addOrUpdateGuessObjectToCategory(id: string) {
    try {
      const object = await getGuessObject(id, ['world_location_preview']);
      if (!object) return;

      // Update remotely
      const updatedCategory: UpdateCategory = {
        id: category.id,
        name: category.name,
        isPublished: category.isPublished,
        connectIds: [id],
      };
      await saveCategory(category.id, updatedCategory);

      // Update locally
      setCategory((prev) => {
        if (!prev.guessObjects) prev.guessObjects = [];

        const index = prev.guessObjects.findIndex(
          (obj) => obj.id === object.id,
        );
        let updatedGuessObjects;

        if (index === -1) {
          // ajout
          updatedGuessObjects = [...prev.guessObjects, object];
        } else {
          // mise à jour
          updatedGuessObjects = prev.guessObjects.map((obj) =>
            obj.id === object.id ? object : obj,
          );
        }

        return { ...prev, guessObjects: updatedGuessObjects };
      });

      setGuessObjectCandidate(object);
    } catch (error) {
      alert("Erreur lors de l'ajout de l'objet");
      console.error(error);
    }
  }

  async function handleRemoveFromCategory(guessObject: GuessObject) {
    try {
      if (!category.guessObjects) return;
      const index = category.guessObjects.findIndex(
        (obj) => obj.id === guessObject.id,
      );
      let updatedGuessObjects: GuessObject[];

      if (index === -1) return;
      updatedGuessObjects = category.guessObjects.filter(
        (obj) => obj.id !== guessObject.id,
      );

      const updated_category: UpdateCategory = {
        ...category,
        guessObjects: undefined,
        guessObjectsIds: undefined,
        disconnectIds: [guessObject.id],
      };
      setCategory({ ...category, guessObjects: updatedGuessObjects });
      await saveCategory(category.id, updated_category);
      setGuessObjectCandidate(undefined);
    } catch (error) {
      alert("Erreur lors de la suppression de l'objet");
      console.error(error);
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
            <label>Visibilité</label>
            <p
              className={`
                            w-fit p-2 mt-3 text-xs rounded-md border
                            ${category.isPublished ? 'text-green-600 border-green-500' : 'text-orange-500 border-orange-500'}
                            `}
            >
              {category.isPublished ? 'Publiée' : 'Non publiée'}
            </p>
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
              {/* Contenu scrollable */}
              <div
                className="h-full overflow-y-auto 
                                            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
              >
                <div className="p-3">
                  <GuessObjectsList
                    guessObjects={filteredGuessObjects}
                    selectedGuessObject={guessObjectCandidate as GuessObject}
                    handleSelectGuessObject={handleSelectGuessObject}
                    handleRemoveFromCategory={handleRemoveFromCategory}
                  />
                </div>
              </div>

              {/* Ombre dégradée fixe en bas */}
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
            {guessObjectCandidate && (
              <div className="flex items-center">
                <Button
                  size="sm"
                  variant={`${guessObjectCandidate.id ? 'outline' : 'primary'}`}
                  onClick={handleSaveGuessObjectCandidate}
                >
                  <p className="font-bold">
                    {!guessObjectCandidate.id
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
          guessObjectCandidate={guessObjectCandidate}
          setGuessObjectCandidate={setGuessObjectCandidate}
        />
      </div>
    </div>
  );
}
