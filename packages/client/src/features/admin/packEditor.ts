'use client';

import {
  type FullPack,
  type GuessObject,
  type GuessObjectDraft,
  type GuessObjectId,
  type Pack,
  type PackId,
  type Theme,
  UserFacingError,
  type WorldLocationId,
} from '@cityborn/api';
import {
  type QueryClient,
  type UseQueryResult,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { type DomainApis, useDomainApis } from '../../domains/apiProvider';
import { guessObjectQueryOptions } from '../../domains/guess-object/guessObjectQueries';
import {
  fullPackQueryOptions,
  packsQueryOptions,
} from '../../domains/pack/packQueries';
import { themesQueryOptions } from '../../domains/theme/themeQueries';
import {
  type ErrorReporter,
  useErrorReporter,
} from '../../shared/errorReporter';
import { saveGuessObject } from './guessObjectSave';
import {
  createPackPersistence,
  type PackFields,
  type PackPersistence,
  type PackSaveState,
} from './pack-save/packPersistence';
import {
  type PackEditorState,
  synchronizePackDraft,
  toPackEditorState,
} from './packEditorState';
import {
  type GuessObjectDraftEditor,
  useGuessObjectDraftEditor,
} from './useGuessObjectDraftEditor';

export type PackEditorLoadOptions = {
  packId: PackId;
};

export type PackEditorLoad = {
  packEditorState: PackEditorState;
  retry: () => void;
};

export type PackEditorOptions = {
  editedPack: FullPack;
  onPackDeleted: () => void;
};

export type PackEditor = {
  pack: FullPack;
  saveState: PackSaveState;
  updatePack: (fields: PackFields) => void;
  flushPackChanges: () => Promise<boolean>;
  publishPack: (isPublished: boolean) => Promise<void>;
  deletePack: () => Promise<void>;
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
  const isInPack: boolean = guessObjects.some(
    (packGuessObject: GuessObject) => packGuessObject.id === guessObject.id,
  );
  if (!isInPack) return [...guessObjects, guessObject];
  return guessObjects.map((packGuessObject: GuessObject) =>
    packGuessObject.id === guessObject.id ? guessObject : packGuessObject,
  );
}

export function usePackEditorLoad({
  packId,
}: PackEditorLoadOptions): PackEditorLoad {
  const { packApi, themeApi }: DomainApis = useDomainApis();
  const fullPackQuery: UseQueryResult<FullPack | null> = useQuery(
    fullPackQueryOptions({ packApi, packId }),
  );
  const packsQuery: UseQueryResult<Pack[]> = useQuery(
    packsQueryOptions(packApi),
  );
  const themesQuery: UseQueryResult<Theme[]> = useQuery(
    themesQueryOptions(themeApi),
  );

  return {
    packEditorState: toPackEditorState({
      fullPackQuery,
      packsQuery,
      themesQuery,
    }),
    retry: () => {
      fullPackQuery.refetch();
      packsQuery.refetch();
      themesQuery.refetch();
    },
  };
}

export function usePackEditor({
  editedPack,
  onPackDeleted,
}: PackEditorOptions): PackEditor {
  const { packApi, guessObjectApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const { reportError }: ErrorReporter = useErrorReporter();
  const guessObjectDraftEditor: GuessObjectDraftEditor =
    useGuessObjectDraftEditor();
  const [pack, setPack] = useState<FullPack>(editedPack);
  const [loadedPack, setLoadedPack] = useState<FullPack>(editedPack);
  const [persistence] = useState<PackPersistence>(() =>
    createPackPersistence({ packApi, queryClient, pack: editedPack }),
  );
  const saveState: PackSaveState = useSyncExternalStore(
    persistence.subscribe,
    persistence.getSnapshot,
    persistence.getSnapshot,
  );
  const flushPackChanges: () => Promise<boolean> = useCallback(
    () =>
      persistence.flush().then(
        () => true,
        () => false,
      ),
    [persistence],
  );

  useEffect(() => {
    persistence.synchronize(editedPack);
  }, [persistence, editedPack]);

  useEffect(
    () => () => {
      void persistence.flush().catch(reportError);
    },
    [persistence, reportError],
  );

  if (loadedPack !== editedPack) {
    setLoadedPack(editedPack);
    setPack(synchronizePackDraft({ pack, loadedPack, editedPack }));
  }

  const savePackPublication = async (isPublished: boolean): Promise<void> => {
    try {
      await persistence.publish(isPublished);
      setPack((currentPack: FullPack) => ({
        ...currentPack,
        isPublished,
      }));
    } catch (error: unknown) {
      reportError(error, unexpectedErrorMessage);
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

      await persistence.connect(guessObjectId);
      setPack((currentPack: FullPack) => ({
        ...currentPack,
        guessObjects: upsertGuessObject({
          guessObjects: currentPack.guessObjects,
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
    const isInPack: boolean = pack.guessObjects.some(
      (packGuessObject: GuessObject) => packGuessObject.id === guessObject.id,
    );
    if (!isInPack) return;

    setPack((currentPack: FullPack) => ({
      ...currentPack,
      guessObjects: currentPack.guessObjects.filter(
        (packGuessObject: GuessObject) => packGuessObject.id !== guessObject.id,
      ),
    }));
    try {
      await persistence.disconnect(guessObject.id);
      guessObjectDraftEditor.showGuessObjectDraft(undefined);
    } catch (error: unknown) {
      reportError(error, unexpectedErrorMessage);
    }
  };

  return {
    pack,
    saveState,
    flushPackChanges,
    updatePack: (fields: PackFields) => {
      setPack((currentPack: FullPack) => ({
        ...currentPack,
        ...fields,
      }));
      persistence.updateFields(fields);
    },
    publishPack: savePackPublication,
    deletePack: async () => {
      try {
        await persistence.delete();
        onPackDeleted();
      } catch (error: unknown) {
        reportError(error, unexpectedErrorMessage);
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
