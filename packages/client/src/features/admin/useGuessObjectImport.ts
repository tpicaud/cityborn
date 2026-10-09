'use client';

import {
  type GuessObjectId,
  type GuessObjectSearchResult,
  resolveErrorMessage,
  type WorldLocation,
} from '@cityborn/api';
import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { type RefObject, useRef, useState } from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import {
  guessObjectByExternalIdQueryOptions,
  guessObjectSearchQueryOptions,
  invalidateGuessObjects,
} from './api/adminQueries';
import { registerWorldLocation } from './worldLocationRegistration';

export type ImportedGuessObject = {
  name: string;
  description?: string;
};

type FailedGuessObjectImport = ImportedGuessObject & {
  errorMessage: string;
};

type GuessObjectImportRecap = {
  importedCount: number;
  failedImports: FailedGuessObjectImport[];
};

type GuessObjectImportStatus = 'idle' | 'importing' | 'finished';

type GuessObjectImportOptions = {
  onGuessObjectImported: (guessObjectId: GuessObjectId) => Promise<void>;
};

type FailedImport = {
  importedGuessObject: ImportedGuessObject;
  error: unknown;
};

type GuessObjectImportProgress = {
  importRecap: GuessObjectImportRecap;
  importTotal: number;
};

export type GuessObjectImport = {
  importStatus: GuessObjectImportStatus;
  importRecap: GuessObjectImportRecap;
  progressPercent: number;
  importGuessObjects: (
    importedGuessObjects: ImportedGuessObject[],
  ) => Promise<void>;
  stopImport: () => void;
  resetImport: () => void;
};

const delayBetweenImportsMs: number = 1000;

const missingExternalIdMessage: string = 'Identifiant externe introuvable';

const missingGuessObjectMessage: string = 'Objet introuvable';

const missingWorldLocationMessage: string = 'Localisation introuvable';

const emptyImportRecap: GuessObjectImportRecap = {
  importedCount: 0,
  failedImports: [],
};

function waitBeforeNextImport(): Promise<void> {
  return new Promise<void>((resolve: () => void) => {
    setTimeout(resolve, delayBetweenImportsMs);
  });
}

function toProgressPercent({
  importRecap,
  importTotal,
}: GuessObjectImportProgress): number {
  if (importTotal === 0) return 0;
  const processedCount: number =
    importRecap.importedCount + importRecap.failedImports.length;
  return Math.round((processedCount / importTotal) * 100);
}

export function useGuessObjectImport({
  onGuessObjectImported,
}: GuessObjectImportOptions): GuessObjectImport {
  const { adminApi }: DomainApis = useDomainApis();
  const queryClient: QueryClient = useQueryClient();
  const [importStatus, setImportStatus] =
    useState<GuessObjectImportStatus>('idle');
  const [importRecap, setImportRecap] =
    useState<GuessObjectImportRecap>(emptyImportRecap);
  const [importTotal, setImportTotal] = useState<number>(0);
  const isImportStoppedRef: RefObject<boolean> = useRef<boolean>(false);

  const importGuessObject = async ({
    name,
    description,
  }: ImportedGuessObject): Promise<void> => {
    const searchResults: GuessObjectSearchResult[] =
      await queryClient.fetchQuery(
        guessObjectSearchQueryOptions({ adminApi, searchTerm: name }),
      );
    const externalId: string | undefined =
      searchResults.at(0)?.source?.external_id;
    if (!externalId) throw new Error(missingExternalIdMessage);

    const foundGuessObject: GuessObjectSearchResult | null =
      await queryClient.fetchQuery(
        guessObjectByExternalIdQueryOptions({ adminApi, externalId }),
      );
    if (!foundGuessObject) throw new Error(missingGuessObjectMessage);
    const {
      id: _foundGuessObjectId,
      world_location: foundWorldLocation,
      ...guessObjectFields
    }: GuessObjectSearchResult = foundGuessObject;
    if (!foundWorldLocation) throw new Error(missingWorldLocationMessage);

    const worldLocation: WorldLocation = await registerWorldLocation({
      adminApi,
      queryClient,
      worldLocation: foundWorldLocation,
    });
    const guessObjectId: GuessObjectId = await adminApi.createGuessObject({
      ...guessObjectFields,
      short_description: description || guessObjectFields.short_description,
      world_location_id: worldLocation.id,
    });
    await invalidateGuessObjects(queryClient);
    await onGuessObjectImported(guessObjectId);
  };

  const recordFailedImport = ({
    importedGuessObject,
    error,
  }: FailedImport): void => {
    const errorMessage: string = resolveErrorMessage(error);
    console.error(
      `Error importing ${importedGuessObject.name}: ${errorMessage}`,
    );
    setImportRecap((recap: GuessObjectImportRecap) => ({
      ...recap,
      failedImports: [
        ...recap.failedImports,
        { ...importedGuessObject, errorMessage },
      ],
    }));
  };

  const importRemainingGuessObjects = async (
    remainingGuessObjects: ImportedGuessObject[],
  ): Promise<void> => {
    const [importedGuessObject, ...nextGuessObjects]: ImportedGuessObject[] =
      remainingGuessObjects;
    if (!importedGuessObject || isImportStoppedRef.current) return;

    try {
      await importGuessObject(importedGuessObject);
      setImportRecap((recap: GuessObjectImportRecap) => ({
        ...recap,
        importedCount: recap.importedCount + 1,
      }));
    } catch (error: unknown) {
      recordFailedImport({ importedGuessObject, error });
    }
    await waitBeforeNextImport();
    await importRemainingGuessObjects(nextGuessObjects);
  };

  return {
    importStatus,
    importRecap,
    progressPercent: toProgressPercent({ importRecap, importTotal }),
    importGuessObjects: async (importedGuessObjects: ImportedGuessObject[]) => {
      isImportStoppedRef.current = false;
      setImportRecap(emptyImportRecap);
      setImportTotal(importedGuessObjects.length);
      setImportStatus('importing');
      await importRemainingGuessObjects(importedGuessObjects);
      setImportStatus('finished');
    },
    stopImport: () => {
      isImportStoppedRef.current = true;
    },
    resetImport: () => {
      setImportStatus('idle');
      setImportRecap(emptyImportRecap);
      setImportTotal(0);
    },
  };
}
