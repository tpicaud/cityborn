'use client';

import { ErrorProvider } from '@cityborn/client';
import type { ReactNode } from 'react';
import { ErrorDialog } from '@/components/ui/ErrorDialog';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorProvider ErrorDialogComponent={ErrorDialog}>{children}</ErrorProvider>
  );
}
