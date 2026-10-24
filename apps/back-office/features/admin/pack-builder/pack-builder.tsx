'use client';

import {
  type FullPack,
  type GuessObject,
  type Pack,
  PackIdSchema,
  type Theme,
  ThemeIdSchema,
} from '@cityborn/api';
import {
  type GuessObjectDraftEditor,
  type PackEditor,
  usePackEditor,
} from '@cityborn/client/admin';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import Loader from '@/components/ui/Loader';
import { GuessObjectBuilder } from '../guess-object-builder/guess-object-builder';
import { ThemeBadge } from '../theme-badge';
import { DeletePackPopup } from './delete-pack-popup';
import { GuessObjectsList } from './guess-objects-list';
import { ImportCSVPopup } from './import-csv-popup';
import { PublishPackPopup } from './publish-pack-popup';

type PackBuilderProps = {
  editedPack: FullPack;
  packs: Pack[];
  themes: Theme[];
};

export function PackBuilder({ editedPack, packs, themes }: PackBuilderProps) {
  const router = useRouter();
  const {
    pack,
    isSaving,
    updatePack,
    savePack,
    publishPack,
    deletePack,
    removeGuessObject,
    saveGuessObjectDraft,
    addImportedGuessObject,
    guessObjectDraftEditor,
  }: PackEditor = usePackEditor({
    editedPack,
    onPackDeleted: () => router.push('/dashboard'),
  });
  const {
    guessObjectDraft,
    startGuessObjectCreation,
    toggleGuessObjectSelection,
  }: GuessObjectDraftEditor = guessObjectDraftEditor;
  const [searchObjectValue, setSearchObjectValue] = useState('');

  const filteredGuessObjects: GuessObject[] = useMemo(
    () =>
      pack.guessObjects.filter((guessObject: GuessObject) =>
        guessObject.name
          .toLowerCase()
          .includes(searchObjectValue.toLowerCase()),
      ),
    [pack, searchObjectValue],
  );

  return (
    <fieldset
      disabled={isSaving}
      className="flex-1 min-w-0 w-full flex flex-row gap-12"
    >
      <div className="flex-1 flex flex-col gap-8 w-full">
        <div className="flex flex-col w-full">
          <div className="flex flex-row gap-4 mb-2 items-center h-8 ">
            <h2 className="text-xl font-bold">Editeur de pack</h2>
            <ThemeBadge themes={themes} themeId={pack.themeId} />
            <div className="flex flex-row items-center justify-center gap-2">
              <Button size="sm" variant="outline" onClick={savePack}>
                {isSaving ? <Loader /> : <p>Enregistrer</p>}
              </Button>
              <PublishPackPopup
                isPublished={pack.isPublished}
                handlePublishPack={publishPack}
              />
              <DeletePackPopup handleDeletePack={deletePack} />
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
                  name={pack.name}
                  placeholder="e.g. Rolland Garros 2024"
                  value={pack.name}
                  onChange={(e) => updatePack({ name: e.target.value })}
                  className="bg-white text-gray-800 rounded-md mt-3 p-2 w-full"
                />
              </div>
              <div className="h-full flex flex-col w-[70%] min-w-72">
                <label htmlFor="description">Description</label>
                <input
                  type="text"
                  id="Description"
                  name={pack.name}
                  placeholder="e.g. Rolland Garros 2024"
                  value={pack.description}
                  onChange={(e) => updatePack({ description: e.target.value })}
                  className="bg-white text-gray-800 rounded-md mt-3 p-2 w-full"
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="w-full flex flex-row gap-12">
              <div className="h-full flex flex-col w-[40%] min-w-40">
                <label htmlFor="parent">Parent</label>
                <select
                  id="parent"
                  value={pack.parentId ?? ''}
                  onChange={(e) =>
                    updatePack({
                      parentId: e.target.value
                        ? PackIdSchema.parse(e.target.value)
                        : null,
                    })
                  }
                  className="bg-white text-gray-800 rounded-md mt-3 p-2 w-full"
                >
                  <option value="">Aucun</option>
                  {packs
                    .filter((candidateParent) => candidateParent.id !== pack.id)
                    .map((candidateParent) => (
                      <option
                        key={candidateParent.id}
                        value={candidateParent.id}
                      >
                        {candidateParent.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="h-full flex flex-col w-[30%] min-w-40">
                <label htmlFor="theme">Thème</label>
                <select
                  id="theme"
                  value={pack.themeId}
                  onChange={(e) =>
                    updatePack({ themeId: ThemeIdSchema.parse(e.target.value) })
                  }
                  className="bg-white text-gray-800 rounded-md mt-3 p-2 w-full"
                >
                  {themes.map((theme: Theme) => (
                    <option key={theme.id} value={theme.id}>
                      {theme.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="h-full flex flex-col w-[30%] min-w-40">
                <span>Visibilité</span>
                <p
                  className={`
                            w-fit p-2 mt-3 text-xs rounded-md border
                            ${pack.isPublished ? 'text-green-600 border-green-500' : 'text-orange-500 border-orange-500'}
                            `}
                >
                  {pack.isPublished ? 'Publié' : 'Non publié'}
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
                    (pack.guessObjects ? pack.guessObjects.length : 0) +
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
                    handleRemoveFromPack={removeGuessObject}
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
    </fieldset>
  );
}
