'use client';

import type { GuessObjectCandidate, WorldLocation } from '@cityborn/types';
import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';
import { getGuessObject } from '../category-builder/action';
import {
  searchGuessObjectByExternalId,
  searchWorldLocationById,
} from './action';
import GuessObjectCard from './guess-object-card';
import { GuessObjectSearchInput } from './guess-object-search-input';
import { WorldLocationSearchInput } from './world-location-search-input';
import { WorldLocationViewer } from './world-location-viewer';

export function GuessObjectBuilder({
  guessObjectCandidate,
  setGuessObjectCandidate,
}: {
  guessObjectCandidate: GuessObjectCandidate | undefined;
  setGuessObjectCandidate: Dispatch<
    SetStateAction<GuessObjectCandidate | undefined>
  >;
}) {
  const [isLoadingFullObject, setIsLoadingFullObject] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    const updateGuessObjectCandidate = async () => {
      if (guessObjectCandidate && guessObjectCandidate.id) {
        try {
          const fullObject = await getGuessObject(guessObjectCandidate.id, [
            'world_location',
          ]);
          setGuessObjectCandidate(fullObject || guessObjectCandidate);
        } catch {
          setGuessObjectCandidate(guessObjectCandidate);
        }
      }
    };

    updateGuessObjectCandidate();
  }, [guessObjectCandidate?.id]);

  const updateGuessObjectCandidate = (
    update: Partial<GuessObjectCandidate>,
  ) => {
    setGuessObjectCandidate((prev) =>
      prev ? { ...prev, ...update } : (update as GuessObjectCandidate),
    );
  };

  async function handleFetchGuessObjectCandidate(
    guessObjectCandidatePreview: GuessObjectCandidate | undefined,
  ) {
    try {
      setIsLoadingFullObject(true);
      if (!guessObjectCandidatePreview?.source?.external_id) return;

      const fullCandidate = await searchGuessObjectByExternalId(
        guessObjectCandidatePreview.source?.external_id,
      );

      if (fullCandidate) {
        setGuessObjectCandidate({
          ...fullCandidate,
          id: guessObjectCandidate ? guessObjectCandidate.id : fullCandidate.id,
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

      const fullCandidate = await searchWorldLocationById(
        world_location.id,
        world_location.osm_type,
      );

      if (fullCandidate) {
        updateGuessObjectCandidate({
          world_location_id: fullCandidate.id,
          world_location: fullCandidate,
        });
      }
    } catch (error) {
      alert('Erreur lors de la récupération de la localisation');
      console.error(error);
    } finally {
      setIsLoadingLocation(false);
    }
  }

  if (!guessObjectCandidate)
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
                name={guessObjectCandidate?.name}
                placeholder="e.g. Justin Timberlake"
                value={
                  guessObjectCandidate ? guessObjectCandidate.name : undefined
                }
                disabled={isLoadingFullObject}
                onChange={(e) =>
                  updateGuessObjectCandidate({ name: e.target.value })
                }
                onSelect={handleFetchGuessObjectCandidate}
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
                value={guessObjectCandidate?.short_description ?? ''}
                disabled={isLoadingFullObject}
                onChange={(e) =>
                  updateGuessObjectCandidate({
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
              value={guessObjectCandidate?.image ?? ''}
              disabled={isLoadingFullObject}
              onChange={(e) =>
                updateGuessObjectCandidate({
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
              name={guessObjectCandidate?.world_location_id}
              placeholder="e.g. Paris"
              value={
                guessObjectCandidate?.world_location
                  ? (guessObjectCandidate.world_location.display_name ??
                    guessObjectCandidate.world_location.name)
                  : ''
              }
              disabled={isLoadingFullObject}
              onChange={(e) =>
                updateGuessObjectCandidate({
                  world_location: {
                    id: '',
                    osm_type: 'relation',
                    name: e.target.value,
                    type: 'point',
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
              <GuessObjectCard guessObject={guessObjectCandidate} />
            </div>

            <div className="inset-0 z-0 h-full w-full">
              <WorldLocationViewer
                world_location={guessObjectCandidate?.world_location}
                API_KEY={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
