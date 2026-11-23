import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  type QueryCacheNotifyEvent,
  QueryClient,
  QueryObserver,
} from '@tanstack/react-query';
import { createErrorReportingQueryCache } from '../../shared/queryErrorReporting';
import type { ThemeApi } from './themeApi';
import { themesQueryOptions } from './themeQueries';

function unexpectedCall(): never {
  throw new Error('unexpected theme call');
}

describe('themesQueryOptions', () => {
  it('reports the original error of a failed theme load', async (context: TestContext) => {
    const loadError: TypeError = new TypeError('Network request failed');
    const themeApi: ThemeApi = {
      getPlayableThemes: unexpectedCall,
      getThemes: () => Promise.reject(loadError),
      createTheme: unexpectedCall,
      updateTheme: unexpectedCall,
      moveTheme: unexpectedCall,
      deleteTheme: unexpectedCall,
    };
    const reportedErrors: unknown[] = [];
    const queryClient: QueryClient = new QueryClient({
      queryCache: createErrorReportingQueryCache((error: unknown) =>
        reportedErrors.push(error),
      ),
    });
    context.after(() => queryClient.clear());
    const loadFailed: Promise<void> = new Promise((resolve: () => void) => {
      const stopWaiting: () => void = queryClient
        .getQueryCache()
        .subscribe((event: QueryCacheNotifyEvent) => {
          if (event.type !== 'updated' || event.action.type !== 'error') return;
          stopWaiting();
          resolve();
        });
    });

    const stopObserving: () => void = new QueryObserver(
      queryClient,
      themesQueryOptions(themeApi),
    ).subscribe(() => undefined);
    context.after(stopObserving);
    await loadFailed;

    assert.deepEqual(reportedErrors, [loadError]);
  });
});
