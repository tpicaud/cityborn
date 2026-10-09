'use client';

import {
  type QueryCache,
  type QueryCacheNotifyEvent,
  type QueryClient,
  useQueryClient,
} from '@tanstack/react-query';
import { useEffect } from 'react';

type QueryErrorReportingMeta = {
  reportsError: boolean;
};

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: QueryErrorReportingMeta;
  }
}

type InvokeError = (error: unknown) => void;

type QueryErrorReportingOptions = {
  queryCache: QueryCache;
  invokeError: InvokeError;
};

export function reportQueryErrors({
  queryCache,
  invokeError,
}: QueryErrorReportingOptions): () => void {
  return queryCache.subscribe((event: QueryCacheNotifyEvent) => {
    if (event.type !== 'updated' || event.action.type !== 'error') return;
    if (!event.query.meta?.reportsError) return;
    if (event.query.state.data !== undefined) return;
    if (event.query.getObserversCount() === 0) return;
    invokeError(event.action.error);
  });
}

export function useQueryErrorReporting(invokeError: InvokeError): void {
  const queryClient: QueryClient = useQueryClient();

  useEffect(
    () =>
      reportQueryErrors({
        queryCache: queryClient.getQueryCache(),
        invokeError,
      }),
    [queryClient, invokeError],
  );
}
