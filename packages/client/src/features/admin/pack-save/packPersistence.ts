import {
  type GuessObjectId,
  type Pack,
  resolveErrorMessage,
  type UpdatePack,
} from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { PackApi } from '../../../domains/pack/packApi';
import { removeDeletedPack } from '../../../domains/pack/packQueries';
import { registerSessionResource } from '../../../shared/sessionResources';
import { getPackSaveRegistry } from './packSaveRegistry';
import { savePack } from './savePack';

export type PackFields = Partial<
  Pick<Pack, 'name' | 'description' | 'parentId' | 'themeId'>
>;

export type PackSaveState = {
  status: 'saved' | 'pending' | 'saving' | 'failed';
  errorMessage: string | null;
  successfulSaveCount: number;
};

export type PackPersistence = {
  updateFields: (fields: PackFields) => void;
  flush: () => Promise<void>;
  publish: (isPublished: boolean) => Promise<void>;
  connect: (guessObjectId: GuessObjectId) => Promise<void>;
  disconnect: (guessObjectId: GuessObjectId) => Promise<void>;
  delete: () => Promise<void>;
  synchronize: (pack: Pack) => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => PackSaveState;
  getPendingFields: () => PackFields;
};

const textSaveDelayMs: number = 500;

export function getPackPersistence({
  packApi,
  queryClient,
  pack,
}: {
  packApi: PackApi;
  queryClient: QueryClient;
  pack: Pack;
}): PackPersistence {
  const registry: ReturnType<typeof getPackSaveRegistry> =
    getPackSaveRegistry(queryClient);
  const existingPersistence: PackPersistence | undefined = registry.get(
    pack.id,
  );
  if (existingPersistence) return existingPersistence;

  const abortController: AbortController = new AbortController();
  let inFlightFields: PackFields = {};
  let savedPack: Pack = pack;
  let pendingFields: PackFields = {};
  let timer: ReturnType<typeof setTimeout> | undefined;
  let tail: Promise<void> = Promise.resolve();
  let fieldSave: Promise<void> | undefined;
  let queuedWrites: number = 0;
  let isDeleted: boolean = false;
  let errorMessage: string | null = null;
  let successfulSaveCount: number = 0;
  let state: PackSaveState = {
    status: 'saved',
    errorMessage: null,
    successfulSaveCount,
  };
  const listeners: Set<() => void> = new Set();

  const hasPendingFields: () => boolean = () =>
    Object.keys(pendingFields).length > 0;

  const notify: () => void = () => {
    const status: PackSaveState['status'] = abortController.signal.aborted
      ? 'saved'
      : errorMessage
        ? 'failed'
        : queuedWrites > 0
          ? 'saving'
          : hasPendingFields()
            ? 'pending'
            : 'saved';
    state = { status, errorMessage, successfulSaveCount };
    registry.update({ packId: pack.id, persistence });
    listeners.forEach((listener) => {
      listener();
    });
  };

  const cancelTimer: () => void = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  const enqueue = (write: () => Promise<void>): Promise<void> => {
    if (abortController.signal.aborted) return Promise.resolve();
    queuedWrites += 1;
    notify();
    const result: Promise<void> = tail.then(async () => {
      if (!isDeleted && !abortController.signal.aborted) await write();
    });
    tail = result.then(
      () => {
        queuedWrites -= 1;
        notify();
      },
      (error: unknown) => {
        queuedWrites -= 1;
        errorMessage = hasPendingFields() ? resolveErrorMessage(error) : null;
        notify();
      },
    );
    return result;
  };

  const persist = async (changes: Partial<UpdatePack>): Promise<void> => {
    savedPack = await savePack({
      packApi,
      queryClient,
      signal: abortController.signal,
      pack: {
        id: savedPack.id,
        name: savedPack.name,
        description: savedPack.description,
        parentId: savedPack.parentId,
        themeId: savedPack.themeId,
        isPublished: savedPack.isPublished,
        ...changes,
      },
    });
    successfulSaveCount += 1;
  };

  const drainFields: () => Promise<void> = async () => {
    if (!hasPendingFields()) return;
    const fields: PackFields = pendingFields;
    pendingFields = {};
    inFlightFields = fields;
    try {
      await persist(fields);
    } catch (error: unknown) {
      if (!abortController.signal.aborted) {
        pendingFields = { ...fields, ...pendingFields };
      }
      throw error;
    } finally {
      inFlightFields = {};
    }
    await drainFields();
  };

  const flush: () => Promise<void> = () => {
    cancelTimer();
    if (abortController.signal.aborted) return Promise.resolve();
    if (fieldSave) return fieldSave;
    if (!hasPendingFields() || isDeleted) return tail;
    errorMessage = null;
    const result: Promise<void> = enqueue(drainFields);
    fieldSave = result;
    void result.then(
      () => {
        fieldSave = undefined;
      },
      () => {
        fieldSave = undefined;
      },
    );
    return result;
  };

  const mutate = async (changes: Partial<UpdatePack>): Promise<void> => {
    await flush();
    errorMessage = null;
    await enqueue(() => persist(changes));
  };

  const persistence: PackPersistence = {
    updateFields: (fields) => {
      if (isDeleted || abortController.signal.aborted) return;
      pendingFields = { ...pendingFields, ...fields };
      errorMessage = null;
      cancelTimer();
      notify();
      if ('themeId' in fields || 'parentId' in fields) {
        void flush().catch(() => undefined);
        return;
      }
      timer = setTimeout(() => {
        void flush().catch(() => undefined);
      }, textSaveDelayMs);
    },
    flush,
    publish: (isPublished) => mutate({ isPublished }),
    connect: (guessObjectId) => mutate({ connectIds: [guessObjectId] }),
    disconnect: (guessObjectId) => mutate({ disconnectIds: [guessObjectId] }),
    delete: async () => {
      await flush();
      await enqueue(async () => {
        await packApi.deletePack(savedPack.id);
        abortController.signal.throwIfAborted();
        await removeDeletedPack({ queryClient, packId: savedPack.id });
        isDeleted = true;
        pendingFields = {};
        cancelTimer();
      });
    },
    synchronize: (currentPack) => {
      if (queuedWrites === 0) savedPack = currentPack;
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => state,
    getPendingFields: () => ({ ...inFlightFields, ...pendingFields }),
  };
  registerSessionResource({
    queryClient,
    dispose: () => {
      abortController.abort();
      cancelTimer();
      pendingFields = {};
      inFlightFields = {};
      errorMessage = null;
      notify();
    },
  });
  return persistence;
}
