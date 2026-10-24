'use client';

import { installFrenchZodErrorMap } from '@cityborn/api';
import { ApiProvider, ErrorReporterProvider } from '@cityborn/client';
import type { ReactNode } from 'react';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { AuthBootstrap } from '@/features/auth/auth-bootstrap';
import { authApi } from '@/lib/api/auth';
import { contractClient } from '@/lib/api/contract-client';

installFrenchZodErrorMap();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ErrorReporterProvider ErrorDialogComponent={ErrorDialog}>
      <ApiProvider contractClient={contractClient} authApi={authApi}>
        <AuthBootstrap>{children}</AuthBootstrap>
      </ApiProvider>
    </ErrorReporterProvider>
  );
}
