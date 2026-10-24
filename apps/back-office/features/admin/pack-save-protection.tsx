'use client';

import {
  type PendingPackSaves,
  usePendingPackSaves,
} from '@cityborn/client/admin';
import { useEffect } from 'react';

export function PackSaveProtection() {
  const { hasUnsavedChanges, flushPendingPackChanges }: PendingPackSaves =
    usePendingPackSaves();

  useEffect(() => {
    if (!hasUnsavedChanges) return;

    const preventUnload = (event: BeforeUnloadEvent): void => {
      void flushPendingPackChanges();
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', preventUnload);
    return () => window.removeEventListener('beforeunload', preventUnload);
  }, [hasUnsavedChanges, flushPendingPackChanges]);

  return null;
}
