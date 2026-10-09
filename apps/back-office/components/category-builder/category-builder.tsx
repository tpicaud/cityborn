'use client';

import {
  type Category,
  CategoryIdSchema,
  type FullCategory,
  type GuessObject,
} from '@cityborn/api';
import {
  type CategoryEditor,
  type GuessObjectDraftEditor,
  useCategoryEditor,
} from '@cityborn/client/admin';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { GuessObjectBuilder } from '../guess-object-builder/guess-object-builder';
import { Button } from '../ui/Button';
import Loader from '../ui/Loader';
import { DeleteCategoryPopup } from './delete-category-popup';
import { GuessObjectsList } from './guess-objects-list';
import { ImportCSVPopup } from './import-csv-popup';
import { PublishCategoryPopup } from './publish-category-popup';

type CategoryBuilderProps = {
  editedCategory: FullCategory;
  categories: Category[];
};

export function CategoryBuilder({
  editedCategory,
  categories,
}: CategoryBuilderProps) {
  const router = useRouter();
  const {
    category,
    isSaving,
    updateCategory,
    saveCategory,
    publishCategory,
    deleteCategory,
    removeGuessObject,
    saveGuessObjectDraft,
    addImportedGuessObject,
    guessObjectDraftEditor,
  }: CategoryEditor = useCategoryEditor({
    editedCategory,
    onCategoryDeleted: () => router.push('/dashboard'),
  });
  const {
    guessObjectDraft,
    startGuessObjectCreation,
    toggleGuessObjectSelection,
  }: GuessObjectDraftEditor = guessObjectDraftEditor;
  const [searchObjectValue, setSearchObjectValue] = useState('');

  const filteredGuessObjects: GuessObject[] = useMemo(
    () =>
      category.guessObjects.filter((guessObject: GuessObject) =>
        guessObject.name
          .toLowerCase()
          .includes(searchObjectValue.toLowerCase()),
      ),
    [category, searchObjectValue],
  );

  return (
    <div className="flex-1 w-full flex flex-row gap-12">
      <div className="flex-1 flex flex-col gap-8 w-full">
        <div className="flex flex-col w-full">
          <div className="flex flex-row gap-4 mb-2 items-center h-8 ">
            <h2 className="text-xl font-bold">Editeur de catégorie</h2>
            <div className="flex flex-row items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={saveCategory}>
                {isSaving ? <Loader /> : <p>Enregistrer</p>}
              </Button>
              <PublishCategoryPopup
                isPublished={category.isPublished}
                handlePublishCategory={publishCategory}
              />
              <DeleteCategoryPopup handleDeleteCategory={deleteCategory} />
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
                    updateCategory({
                      parentId: e.target.value
                        ? CategoryIdSchema.parse(e.target.value)
                        : null,
                    })
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
                onClick={startGuessObjectCreation}
                className="h-full font-bold p-auto"
              >
                +
              </Button>
              <ImportCSVPopup onGuessObjectImported={addImportedGuessObject} />
            </div>

            <div className="relative flex-1 min-h-0 rounded-xl border border-gray-300 overflow-hidden">
              <div
                className="h-full overflow-y-auto 
                                            [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
              >
                <div className="p-3">
                  <GuessObjectsList
                    guessObjects={filteredGuessObjects}
                    selectedGuessObjectId={guessObjectDraft?.id}
                    handleSelectGuessObject={toggleGuessObjectSelection}
                    handleRemoveFromCategory={removeGuessObject}
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
                  onClick={saveGuessObjectDraft}
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
        <GuessObjectBuilder guessObjectDraftEditor={guessObjectDraftEditor} />
      </div>
    </div>
  );
}
