'use client';

import { installFrenchZodErrorMap } from '@cityborn/api';
import { ApiProvider, ErrorProvider } from '@cityborn/client';
import type { ReactNode } from 'react';
import { AuthBootstrap } from '@/components/auth/auth-bootstrap';
import { ErrorDialog } from '@/components/ui/ErrorDialog';
import { authApi } from '@/lib/api/auth';
import { contractClient } from '@/lib/api/contract-client';

installFrenchZodErrorMap();

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ApiProvider contractClient={contractClient} authApi={authApi}>
      <ErrorProvider ErrorDialogComponent={ErrorDialog}>
        <AuthBootstrap>{children}</AuthBootstrap>
      </ErrorProvider>
    </ApiProvider>
  );
}
