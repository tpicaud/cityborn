import assert from 'node:assert/strict';
import { test } from 'node:test';
import { notifyManager, QueryClient } from '@tanstack/react-query';
import { reportQueryErrors } from './queryErrorReporting';

notifyManager.setScheduler((notify: () => void) => notify());

type QueryErrorReportingHarness = {
  queryClient: QueryClient;
  reportedErrors: unknown[];
  stopReporting: () => void;
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

test('reportQueryErrors reports the final error of a query that reports its errors', async () => {
  const {
    queryClient,
    reportedErrors,
    stopReporting,
  }: QueryErrorReportingHarness = createQueryErrorReportingHarness();
  const queryError: Error = new Error('category trees unavailable');

  await assert.rejects(
    queryClient.fetchQuery({
      queryKey: ['reported'],
      queryFn: () => Promise.reject(queryError),
      retry: 1,
      retryDelay: 0,
      meta: { reportsError: true },
    }),
  );

  assert.deepEqual(reportedErrors, [queryError]);
  stopReporting();
  queryClient.clear();
});

test('reportQueryErrors ignores a query that does not report its errors', async () => {
  const {
    queryClient,
    reportedErrors,
    stopReporting,
  }: QueryErrorReportingHarness = createQueryErrorReportingHarness();

  await assert.rejects(
    queryClient.fetchQuery({
      queryKey: ['silent'],
      queryFn: () => Promise.reject(new Error('silent failure')),
      retry: false,
      meta: { reportsError: false },
    }),
  );

  assert.deepEqual(reportedErrors, []);
  stopReporting();
  queryClient.clear();
});
