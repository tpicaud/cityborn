'use client';

import { installFrenchZodErrorMap } from '@cityborn/api';
import { ErrorProvider } from '@cityborn/client';
import type { ReactNode } from 'react';
import { ErrorDialog } from '@/components/ui/ErrorDialog';

installFrenchZodErrorMap();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorProvider ErrorDialogComponent={ErrorDialog}>{children}</ErrorProvider>
  );
}
