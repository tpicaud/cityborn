import { type Query, QueryCache } from '@tanstack/react-query';

type QueryErrorReportingMeta = {
  reportsError: boolean;
};

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: QueryErrorReportingMeta;
  }
}

type InvokeError = (error: unknown) => void;

function shouldReportQueryError(
  query: Query<unknown, unknown, unknown>,
): boolean {
  if (!query.meta?.reportsError) return false;
  if (query.state.data !== undefined) return false;
  return query.getObserversCount() > 0;
}

export function createErrorReportingQueryCache(
  invokeError: InvokeError,
): QueryCache {
  return new QueryCache({
    onError: (error, query) => {
      if (!shouldReportQueryError(query)) return;
      invokeError(error);
    },
  });
}
