'use client';

import type {
  FullGuessObject,
  GuessObject,
  GuessObjectDraft,
  GuessObjectId,
  GuessObjectSearchResult,
  WorldLocation,
  WorldLocationSearchResult,
} from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';
import {
  fullGuessObjectQueryOptions,
  guessObjectByExternalIdQueryOptions,
  worldLocationByOsmReferenceQueryOptions,
} from './api/adminQueries';
import { registerWorldLocation } from './worldLocationRegistration';

type GuessObjectDraftFields = Partial<
  Pick<
    GuessObjectDraft,
    'name' | 'short_description' | 'image' | 'world_location'
  >
>;

export type GuessObjectDraftEditor = {
  guessObjectDraft: GuessObjectDraft | undefined;
  isLoadingGuessObject: boolean;
  isLoadingWorldLocation: boolean;
  showGuessObjectDraft: (
    guessObjectDraft: GuessObjectDraft | undefined,
  ) => void;
  startGuessObjectCreation: () => void;
  toggleGuessObjectSelection: (guessObject: GuessObject) => void;
  updateGuessObjectDraft: (fields: GuessObjectDraftFields) => void;
  selectGuessObjectSearchResult: (
    searchResult: GuessObjectSearchResult | undefined,
  ) => Promise<void>;
  selectWorldLocationSearchResult: (
    searchResult: WorldLocationSearchResult | undefined,
  ) => Promise<void>;
};

const guessObjectLoadFailureMessage: string =
  "Erreur lors de la récupération de l'objet";

const worldLocationLoadFailureMessage: string =
  'Erreur lors de la récupération de la localisation';

export function useGuessObjectDraft(): GuessObjectDraftEditor {
  const { adminApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { invokeError } = useError();
  const [guessObjectDraft, setGuessObjectDraft] = useState<
    GuessObjectDraft | undefined
  >(undefined);
  const [isLoadingGuessObject, setIsLoadingGuessObject] =
    useState<boolean>(false);
  const [isLoadingWorldLocation, setIsLoadingWorldLocation] =
    useState<boolean>(false);
  const shownGuessObjectIdRef = useRef<GuessObjectId | undefined>(undefined);

  const fetchFullGuessObject = (
    guessObjectId: GuessObjectId,
  ): Promise<FullGuessObject | null> =>
    queryClient.fetchQuery(
      fullGuessObjectQueryOptions({ adminApi, guessObjectId }),
    );

  const displayGuessObjectDraft = (
    displayedGuessObjectDraft: GuessObjectDraft | undefined,
  ): void => {
    shownGuessObjectIdRef.current = displayedGuessObjectDraft?.id;
    setGuessObjectDraft(displayedGuessObjectDraft);
  };

  const loadFullGuessObject = async (
    guessObjectId: GuessObjectId,
  ): Promise<void> => {
    try {
      const fullGuessObject: FullGuessObject | null =
        await fetchFullGuessObject(guessObjectId);
      if (!fullGuessObject) return;
      if (shownGuessObjectIdRef.current !== guessObjectId) return;
      setGuessObjectDraft(fullGuessObject);
    } catch (error: unknown) {
      invokeError(error);
    }
  };

  const showGuessObjectDraft = (
    shownGuessObjectDraft: GuessObjectDraft | undefined,
  ): void => {
    const previousGuessObjectId: GuessObjectId | undefined =
      shownGuessObjectIdRef.current;
    displayGuessObjectDraft(shownGuessObjectDraft);
    if (!shownGuessObjectDraft?.id) return;
    if (shownGuessObjectDraft.id === previousGuessObjectId) return;
    loadFullGuessObject(shownGuessObjectDraft.id);
  };

  const updateGuessObjectDraft = (fields: GuessObjectDraftFields): void => {
    setGuessObjectDraft(
      (currentGuessObjectDraft: GuessObjectDraft | undefined) =>
        currentGuessObjectDraft && { ...currentGuessObjectDraft, ...fields },
    );
  };

  const openGuessObjectSearchResult = async (
    searchResult: GuessObjectSearchResult | undefined,
  ): Promise<void> => {
    if (!searchResult) return;
    if (searchResult.id) {
      const existingGuessObject: FullGuessObject | null =
        await fetchFullGuessObject(searchResult.id);
      if (existingGuessObject) displayGuessObjectDraft(existingGuessObject);
      return;
    }

    const externalId: string | undefined = searchResult.source?.external_id;
    if (!externalId) return;
    const foundGuessObject: GuessObjectSearchResult | null =
      await queryClient.fetchQuery(
        guessObjectByExternalIdQueryOptions({ adminApi, externalId }),
      );
    if (!foundGuessObject) return;

    const worldLocation: WorldLocation | undefined =
      foundGuessObject.world_location &&
      (await registerWorldLocation({
        adminApi,
        queryClient,
        worldLocation: foundGuessObject.world_location,
      }));
    showGuessObjectDraft({
      ...foundGuessObject,
      name: searchResult.name,
      world_location: worldLocation,
    });
  };

  const attachWorldLocationSearchResult = async (
    searchResult: WorldLocationSearchResult | undefined,
  ): Promise<void> => {
    if (!searchResult?.id) return;
    const foundWorldLocation: WorldLocationSearchResult | null =
      await queryClient.fetchQuery(
        worldLocationByOsmReferenceQueryOptions({
          adminApi,
          osmWorldLocationReference: {
            osmId: searchResult.id,
            osmType: searchResult.osm_type,
          },
        }),
      );
    if (!foundWorldLocation) return;

    const worldLocation: WorldLocation = await registerWorldLocation({
      adminApi,
      queryClient,
      worldLocation: foundWorldLocation,
    });
    updateGuessObjectDraft({ world_location: worldLocation });
  };

  return {
    guessObjectDraft,
    isLoadingGuessObject,
    isLoadingWorldLocation,
    showGuessObjectDraft,
    startGuessObjectCreation: () => displayGuessObjectDraft({ name: '' }),
    toggleGuessObjectSelection: (guessObject: GuessObject) => {
      if (guessObjectDraft?.name === guessObject.name) {
        displayGuessObjectDraft(undefined);
        return;
      }
      showGuessObjectDraft(guessObject);
    },
    updateGuessObjectDraft,
    selectGuessObjectSearchResult: async (
      searchResult: GuessObjectSearchResult | undefined,
    ) => {
      setIsLoadingGuessObject(true);
      try {
        await openGuessObjectSearchResult(searchResult);
      } catch (error: unknown) {
        invokeError(error, guessObjectLoadFailureMessage);
      } finally {
        setIsLoadingGuessObject(false);
      }
    },
    selectWorldLocationSearchResult: async (
      searchResult: WorldLocationSearchResult | undefined,
    ) => {
      setIsLoadingWorldLocation(true);
      try {
        await attachWorldLocationSearchResult(searchResult);
      } catch (error: unknown) {
        invokeError(error, worldLocationLoadFailureMessage);
      } finally {
        setIsLoadingWorldLocation(false);
      }
    },
  };
}
