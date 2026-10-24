import type { PackId } from '@cityborn/api';
import type { QueryClient } from '@tanstack/react-query';
import type { PackPersistence } from './packPersistence';

type PackSaveRegistry = {
  get: (packId: PackId) => PackPersistence | undefined;
  update: (options: { packId: PackId; persistence: PackPersistence }) => void;
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => boolean;
  flush: () => Promise<boolean>;
};

const registriesByClient: WeakMap<QueryClient, PackSaveRegistry> =
  new WeakMap();

export function getPackSaveRegistry(
  queryClient: QueryClient,
): PackSaveRegistry {
  const existing: PackSaveRegistry | undefined =
    registriesByClient.get(queryClient);
  if (existing) return existing;

  const pendingPacks: Map<PackId, PackPersistence> = new Map();
  const listeners: Set<() => void> = new Set();
  const registry: PackSaveRegistry = {
    get: (packId) => pendingPacks.get(packId),
    update: ({ packId, persistence }) => {
      const isSaved: boolean = persistence.getSnapshot().status === 'saved';
      if (!isSaved) {
        pendingPacks.set(packId, persistence);
      }
      if (isSaved && pendingPacks.get(packId) === persistence) {
        pendingPacks.delete(packId);
      }
      listeners.forEach((listener) => {
        listener();
      });
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => pendingPacks.size > 0,
    flush: async () => {
      const results: PromiseSettledResult<void>[] = await Promise.allSettled(
        [...pendingPacks.values()].map((persistence) => persistence.flush()),
      );
      return results.every((result) => result.status === 'fulfilled');
    },
  };
  registriesByClient.set(queryClient, registry);
  return registry;
}
