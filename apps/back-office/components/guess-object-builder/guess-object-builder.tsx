'use client';

import type { GuessObjectDraft, WorldLocation } from '@cityborn/api';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import {
  createWorldLocation,
  getFullGuessObject,
  searchGuessObjectByExternalId,
  searchWorldLocationById,
} from '@/server/actions/guess-object';
import GuessObjectCard from './guess-object-card';
import { GuessObjectSearchInput } from './guess-object-search-input';
import { WorldLocationSearchInput } from './world-location-search-input';
import { WorldLocationViewer } from './world-location-viewer';

export function GuessObjectBuilder({
  guessObjectDraft,
  setGuessObjectDraft,
}: {
  guessObjectDraft: GuessObjectDraft | undefined;
  setGuessObjectDraft: Dispatch<SetStateAction<GuessObjectDraft | undefined>>;
}) {
  const [isLoadingFullObject, setIsLoadingFullObject] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    const updateGuessObjectDraft = async () => {
      if (!guessObjectDraft?.id) return;
      try {
        const result = await getFullGuessObject(guessObjectDraft.id);
        if (result?.ok) {
          setGuessObjectDraft(result.data as GuessObjectDraft);
        }
      } catch {}
    };

    updateGuessObjectDraft();
  }, [guessObjectDraft?.id, setGuessObjectDraft]);

  const updateGuessObjectDraft = (update: Partial<GuessObjectDraft>) => {
    setGuessObjectDraft((prev) =>
      prev ? { ...prev, ...update } : (update as GuessObjectDraft),
    );
  };

  async function handleFetchGuessObjectDraft(
    guessObjectDraftPreview: GuessObjectDraft | undefined,
  ) {
    try {
      setIsLoadingFullObject(true);
      if (!guessObjectDraftPreview?.source?.external_id) return;

      const result = await searchGuessObjectByExternalId(
        guessObjectDraftPreview.source?.external_id,
      );
      if (!result.ok) throw new Error(result.error.message);
      const fullDraft = result.data;

      if (fullDraft) {
        let world_location_id = fullDraft.world_location_id;
        if (fullDraft.world_location?.source) {
          const created = await createWorldLocation({
            ...fullDraft.world_location,
            source: fullDraft.world_location.source,
          });
          if (!created.ok) throw new Error(created.error.message);
          world_location_id = created.data;
        }

        setGuessObjectDraft({
          ...fullDraft,
          id: guessObjectDraft ? guessObjectDraft.id : fullDraft.id,
          world_location_id,
        });
      }
    } catch (error) {
      alert("Erreur lors de la récupération de l'objet sur Wikidata");
      console.error(error);
    } finally {
      setIsLoadingFullObject(false);
    }
  }

  async function handleFetchWorldLocationCandidate(
    world_location: WorldLocation | undefined,
  ) {
    try {
      setIsLoadingLocation(true);
      if (!world_location?.id) return;

      const result = await searchWorldLocationById(
        world_location.id,
        world_location.osm_type,
      );
      if (!result.ok) throw new Error(result.error.message);
      const fullCandidate = result.data;
      if (!fullCandidate?.source) return;

      const created = await createWorldLocation({
        ...fullCandidate,
        source: fullCandidate.source,
      });
      if (!created.ok) throw new Error(created.error.message);

      updateGuessObjectDraft({
        world_location_id: created.data,
        world_location: fullCandidate,
      });
    } catch (error) {
      alert('Erreur lors de la récupération de la localisation');
      console.error(error);
    } finally {
      setIsLoadingLocation(false);
    }
  }

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
                onSelect={handleFetchGuessObjectDraft}
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
              name={guessObjectDraft?.world_location_id}
              placeholder="e.g. Paris"
              value={
                guessObjectDraft?.world_location
                  ? (guessObjectDraft.world_location.display_name ??
                    guessObjectDraft.world_location.name)
                  : ''
              }
              disabled={isLoadingFullObject}
              onChange={(e) =>
                updateGuessObjectDraft({
                  world_location: {
                    id: '',
                    osm_type: 'relation',
                    name: e.target.value,
                    display_name: e.target.value,
                    centroid: [0, 0],
                    source: { provider: '', external_id: '' },
                    geometry: {
                      type: 'Point',
                      coordinates: [],
                    },
                  },
                })
              }
              onSelect={handleFetchWorldLocationCandidate}
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
                API_KEY={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
