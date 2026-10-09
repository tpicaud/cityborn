import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  notifyManager,
  type QueryCacheNotifyEvent,
  QueryClient,
  type QueryKey,
  QueryObserver,
} from '@tanstack/react-query';
import { reportQueryErrors } from './queryErrorReporting';

notifyManager.setScheduler((notify: () => void) => notify());

const observedQueryKey: QueryKey = ['observed'];

type QueryErrorReportingHarness = {
  queryClient: QueryClient;
  reportedErrors: unknown[];
  stopReporting: () => void;
};

type ObservedQueryOptions = {
  queryClient: QueryClient;
  queryFn: () => Promise<never>;
  reportsError: boolean;
};

function createQueryErrorReportingHarness(): QueryErrorReportingHarness {
  const queryClient: QueryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: Number.POSITIVE_INFINITY } },
  });
  const reportedErrors: unknown[] = [];
  const stopReporting: () => void = reportQueryErrors({
    queryCache: queryClient.getQueryCache(),
    invokeError: (error: unknown) => reportedErrors.push(error),
  });
  return { queryClient, reportedErrors, stopReporting };
}

function observeQuery({
  queryClient,
  queryFn,
  reportsError,
}: ObservedQueryOptions): () => void {
  const queryObserver: QueryObserver<never> = new QueryObserver(queryClient, {
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

test('reportQueryErrors reports the final error of an observed query that reports its errors', async () => {
  const {
    queryClient,
    reportedErrors,
    stopReporting,
  }: QueryErrorReportingHarness = createQueryErrorReportingHarness();
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
  stopReporting();
  queryClient.clear();
});

test('reportQueryErrors ignores a query that does not report its errors', async () => {
  const {
    queryClient,
    reportedErrors,
    stopReporting,
  }: QueryErrorReportingHarness = createQueryErrorReportingHarness();
  const queryErrorReceived: Promise<void> = waitForQueryError(queryClient);

  const stopObserving: () => void = observeQuery({
    queryClient,
    queryFn: () => Promise.reject(new Error('silent failure')),
    reportsError: false,
  });
  await queryErrorReceived;

  assert.deepEqual(reportedErrors, []);
  stopObserving();
  stopReporting();
  queryClient.clear();
});

test('reportQueryErrors ignores the error of a query whose last observer left during the fetch', async () => {
  const {
    queryClient,
    reportedErrors,
    stopReporting,
  }: QueryErrorReportingHarness = createQueryErrorReportingHarness();
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
  stopReporting();
  queryClient.clear();
});
