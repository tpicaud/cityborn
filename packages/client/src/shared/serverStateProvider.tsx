'use client';

import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { type ReactNode, useEffect, useState } from 'react';
import type { AppFocus } from '../platform/appFocus';
import { type ErrorReporter, useErrorReporter } from './errorReporter';
import { createErrorReportingQueryCache } from './queryErrorReporting';

type ServerStateProviderProps = {
  appFocus?: AppFocus;
  children: ReactNode;
};

export function ServerStateProvider({
  appFocus,
  children,
}: ServerStateProviderProps) {
  const { reportError }: ErrorReporter = useErrorReporter();
  const [queryClient] = useState<QueryClient>(
    () =>
      new QueryClient({
        queryCache: createErrorReportingQueryCache(reportError),
      }),
  );

  useEffect(() => {
    if (!appFocus) return;
    focusManager.setEventListener((setFocused) =>
      appFocus.subscribe(setFocused),
    );
  }, [appFocus]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
