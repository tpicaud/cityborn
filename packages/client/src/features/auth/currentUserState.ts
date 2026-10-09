import {
  getFriendlyErrorMessage,
  parseApiError,
  resolveErrorMessage,
  type User,
} from '@cityborn/api';
import type { QueryObserverResult } from '@tanstack/react-query';

export type CurrentUserState =
  | { status: 'loading' }
  | { status: 'ready'; user: User | null }
  | { status: 'failed'; errorMessage: string };

export function toCurrentUserState(
  currentUserQuery: QueryObserverResult<User | null>,
): CurrentUserState {
  if (currentUserQuery.data !== undefined) {
    return { status: 'ready', user: currentUserQuery.data };
  }
  if (!currentUserQuery.isError || currentUserQuery.isFetching) {
    return { status: 'loading' };
  }
  return {
    status: 'failed',
    errorMessage: resolveErrorMessage(
      currentUserQuery.error,
      getFriendlyErrorMessage(parseApiError(0, currentUserQuery.error)),
    ),
  };
}
