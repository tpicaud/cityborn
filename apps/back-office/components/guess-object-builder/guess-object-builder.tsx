'use client';

import type { GuessObjectDraftEditor } from '@cityborn/client/admin';
import { useEffect, useState } from 'react';
import { backOfficeClientConfig } from '@/config/client';
import GuessObjectCard from './guess-object-card';
import { GuessObjectSearchInput } from './guess-object-search-input';
import { WorldLocationSearchInput } from './world-location-search-input';
import { WorldLocationViewer } from './world-location-viewer';

export function GuessObjectBuilder({
  guessObjectDraftEditor,
}: {
  guessObjectDraftEditor: GuessObjectDraftEditor;
}) {
  const {
    guessObjectDraft,
    isLoadingGuessObject: isLoadingFullObject,
    isLoadingWorldLocation: isLoadingLocation,
    updateGuessObjectDraft,
    selectGuessObjectSearchResult,
    selectWorldLocationSearchResult,
  }: GuessObjectDraftEditor = guessObjectDraftEditor;
  const [worldLocationQuery, setWorldLocationQuery] = useState('');

  useEffect(() => {
    setWorldLocationQuery(
      guessObjectDraft?.world_location
        ? (guessObjectDraft.world_location.display_name ??
            guessObjectDraft.world_location.name)
        : '',
    );
  }, [guessObjectDraft?.world_location]);

  if (!guessObjectDraft)
    return (
      <p className="text-base text-center text-gray-300">
        Veuillez sélectionner ou créer un objet
      </p>
    );

  return (
    <div className="flex flex-col gap-8 w-full h-full min-h-0">
      <form className="flex flex-col z-10 h-full w-full">
        <div className="flex flex-col gap-4">
          <div className="flex flex-row gap-12">
            <div className="h-full w-[30%] min-w-40 flex flex-col">
              <label htmlFor="name">Nom</label>
              <GuessObjectSearchInput
                type="text"
                id="name"
                name={guessObjectDraft?.name}
                placeholder="e.g. Justin Timberlake"
                value={guessObjectDraft ? guessObjectDraft.name : undefined}
                disabled={isLoadingFullObject}
                onChange={(e) =>
                  updateGuessObjectDraft({ name: e.target.value })
                }
                onSelect={selectGuessObjectSearchResult}
                className={`rounded-md shadow-lg text-gray-800
                                      mt-3 p-2 h-10 w-full max-w-96
                                      ${isLoadingFullObject ? 'bg-neutral-300 ' : 'bg-white'}`}
                popoverClassName="text-gray-800 bg-white rounded-md shadow-md min-w-full"
              />
            </div>

            <div className="h-full flex flex-col w-[70%] min-w-72">
              <label htmlFor="short_description">Courte description</label>
              <input
                type="text"
                name="short_description"
                id="short_description"
                placeholder="e.g. Tennisman"
                value={guessObjectDraft?.short_description ?? ''}
                disabled={isLoadingFullObject}
                onChange={(e) =>
                  updateGuessObjectDraft({
                    short_description: e.target.value,
                  })
                }
                className={`text-gray-800 rounded-md mt-3 p-2 w-full
                                          ${isLoadingFullObject ? 'bg-neutral-300' : 'bg-white'}`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="short_description">Lien de l'image</label>
            <input
              type="text"
              name="short_description"
              id="short_description"
              placeholder="e.g. Tennisman"
              value={guessObjectDraft?.image ?? ''}
              disabled={isLoadingFullObject}
              onChange={(e) =>
                updateGuessObjectDraft({
                  image: e.target.value,
                })
              }
              className={`text-gray-800 rounded-md mt-3 p-2 w-full
                                          ${isLoadingFullObject ? 'bg-neutral-300' : 'bg-white'}`}
            />
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          <label htmlFor="short_description" className="flex items-center h-14">
            Localisation
          </label>
          <div className="relative h-full">
            <WorldLocationSearchInput
              type="text"
              id="world_location_id"
              name={guessObjectDraft?.world_location?.id}
              placeholder="e.g. Paris"
              value={worldLocationQuery}
              disabled={isLoadingFullObject}
              onChange={(e) => setWorldLocationQuery(e.target.value)}
              onSelect={selectWorldLocationSearchResult}
              className={`rounded-md shadow-xl text-gray-800
                                      p-2 h-10 w-full max-w-[50%]
                                      absolute left-0 m-3 z-40
                                      ${isLoadingFullObject || isLoadingLocation ? 'bg-neutral-300' : 'bg-white'}`}
              popoverClassName="text-gray-800 bg-white
                                            rounded-lg shadow-lg min-w-full z-[9999]
                                            max-h-60 overflow-y-auto"
            />

            <div className="flex justify-end absolute m-3 right-0 z-70 pointer-events-none">
              <GuessObjectCard guessObject={guessObjectDraft} />
            </div>

            <div className="inset-0 z-0 h-full w-full">
              <WorldLocationViewer
                world_location={guessObjectDraft?.world_location}
                API_KEY={backOfficeClientConfig.googleMapsApiKey}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
