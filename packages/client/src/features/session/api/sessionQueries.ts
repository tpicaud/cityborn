import type { SessionId } from '@cityborn/api';
import { queryOptions } from '@tanstack/react-query';
import type { SessionApi } from './sessionApi';

type SessionQuery = {
  sessionApi: SessionApi;
  sessionId: SessionId;
};

export function sessionQueryOptions({ sessionApi, sessionId }: SessionQuery) {
  return queryOptions({
    queryKey: ['session', sessionId],
    queryFn: () => sessionApi.fetchSession(sessionId),
    staleTime: 0,
    retry: false,
    meta: { reportsError: false },
  });
}
