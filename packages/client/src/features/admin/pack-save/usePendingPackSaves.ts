'use client';

import { type QueryClient, useQueryClient } from '@tanstack/react-query';
import { useSyncExternalStore } from 'react';
import { getPackSaveRegistry } from './packSaveRegistry';

export type PendingPackSaves = {
  hasUnsavedChanges: boolean;
  flushPendingPackChanges: () => Promise<boolean>;
};

export function usePendingPackSaves(): PendingPackSaves {
  const queryClient: QueryClient = useQueryClient();
  const registry: ReturnType<typeof getPackSaveRegistry> =
    getPackSaveRegistry(queryClient);
  const hasUnsavedChanges: boolean = useSyncExternalStore(
    registry.subscribe,
    registry.getSnapshot,
    registry.getSnapshot,
  );
  return { hasUnsavedChanges, flushPendingPackChanges: registry.flush };
}
