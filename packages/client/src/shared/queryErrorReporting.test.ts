import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  notifyManager,
  type QueryCacheNotifyEvent,
  QueryClient,
  type QueryKey,
  QueryObserver,
} from '@tanstack/react-query';
import { createErrorReportingQueryCache } from './queryErrorReporting';

notifyManager.setScheduler((notify: () => void) => notify());

const observedQueryKey: QueryKey = ['observed'];

type QueryErrorReportingHarness = {
  queryClient: QueryClient;
  reportedErrors: unknown[];
};

type ObservedQueryOptions = {
  queryClient: QueryClient;
  queryFn: () => Promise<string>;
  reportsError: boolean;
};

function createQueryErrorReportingHarness(): QueryErrorReportingHarness {
  const reportedErrors: unknown[] = [];
  const queryClient: QueryClient = new QueryClient({
    queryCache: createErrorReportingQueryCache((error: unknown) =>
      reportedErrors.push(error),
    ),
    defaultOptions: { queries: { gcTime: Number.POSITIVE_INFINITY } },
  });
  return { queryClient, reportedErrors };
}

function observeQuery({
  queryClient,
  queryFn,
  reportsError,
}: ObservedQueryOptions): () => void {
  const queryObserver: QueryObserver<string> = new QueryObserver(queryClient, {
    queryKey: observedQueryKey,
    queryFn,
    retry: 1,
    retryDelay: 0,
    meta: { reportsError },
  });
  return queryObserver.subscribe(() => undefined);
}

function waitForQueryError(queryClient: QueryClient): Promise<void> {
  return new Promise((resolve: () => void) => {
    const stopWaiting: () => void = queryClient
      .getQueryCache()
      .subscribe((event: QueryCacheNotifyEvent) => {
        if (event.type !== 'updated' || event.action.type !== 'error') return;
        stopWaiting();
        resolve();
      });
  });
}

test('createErrorReportingQueryCache reports the final error of an observed query that reports its errors', async () => {
  const { queryClient, reportedErrors }: QueryErrorReportingHarness =
    createQueryErrorReportingHarness();
  const queryError: Error = new Error('category trees unavailable');
  const queryErrorReceived: Promise<void> = waitForQueryError(queryClient);

  const stopObserving: () => void = observeQuery({
    queryClient,
    queryFn: () => Promise.reject(queryError),
    reportsError: true,
  });
  await queryErrorReceived;

  assert.deepEqual(reportedErrors, [queryError]);
  stopObserving();
  queryClient.clear();
});

test('createErrorReportingQueryCache ignores a query that does not report its errors', async () => {
  const { queryClient, reportedErrors }: QueryErrorReportingHarness =
    createQueryErrorReportingHarness();
  const queryErrorReceived: Promise<void> = waitForQueryError(queryClient);

  const stopObserving: () => void = observeQuery({
    queryClient,
    queryFn: () => Promise.reject(new Error('silent failure')),
    reportsError: false,
  });
  await queryErrorReceived;

  assert.deepEqual(reportedErrors, []);
  stopObserving();
  queryClient.clear();
});

test('createErrorReportingQueryCache ignores the error of a query whose last observer left during the fetch', async () => {
  const { queryClient, reportedErrors }: QueryErrorReportingHarness =
    createQueryErrorReportingHarness();
  let failCategoryTreesFetch: (error: Error) => void = () => undefined;
  const queryErrorReceived: Promise<void> = waitForQueryError(queryClient);

  const stopObserving: () => void = observeQuery({
    queryClient,
    queryFn: () =>
      new Promise<never>((_resolve, reject) => {
        failCategoryTreesFetch = reject;
      }),
    reportsError: true,
  });
  stopObserving();
  failCategoryTreesFetch(new Error('category trees unavailable'));
  await queryErrorReceived;

  assert.deepEqual(reportedErrors, []);
  queryClient.clear();
});

test('createErrorReportingQueryCache ignores the refetch error of a query that already has data', async () => {
  const { queryClient, reportedErrors }: QueryErrorReportingHarness =
    createQueryErrorReportingHarness();
  queryClient.setQueryData<string>(observedQueryKey, 'cached category trees');
  const queryErrorReceived: Promise<void> = waitForQueryError(queryClient);

  const stopObserving: () => void = observeQuery({
    queryClient,
    queryFn: () => Promise.reject(new Error('category trees unavailable')),
    reportsError: true,
  });
  await queryErrorReceived;

  assert.deepEqual(reportedErrors, []);
  stopObserving();
  queryClient.clear();
});
