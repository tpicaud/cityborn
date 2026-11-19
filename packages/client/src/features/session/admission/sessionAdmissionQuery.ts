import {
  type PlayerId,
  type Session,
  type SessionId,
  SessionMode,
} from '@cityborn/api';
import { queryOptions } from '@tanstack/react-query';
import type { SessionApi } from '../../../domains/session/sessionApi';
import { sessionQueryOptions } from '../../../domains/session/sessionQueries';
import { hasSessionStarted } from '../sessionState';
import {
  isSessionEntryRejected,
  type SessionAdmission,
} from './sessionAdmission';

type SessionAdmissionQueryOptions = {
  sessionApi: SessionApi;
  sessionID: SessionId;
  hasSnapshot: boolean;
  admission: SessionAdmission;
  automaticPlayerID: PlayerId | undefined;
};

const guestAdmissionRefreshMs: number = 1_500;
const guestAdmissionRetryMs: number = 5_000;

export function sessionAdmissionQueryOptions({
  sessionApi,
  sessionID,
  hasSnapshot,
  admission,
  automaticPlayerID,
}: SessionAdmissionQueryOptions) {
  const isAwaitingGuest: boolean =
    automaticPlayerID === undefined &&
    (admission.status === 'idle' ||
      (admission.status === 'rejected' &&
        !isSessionEntryRejected(admission.error)));

  const refreshInterval = ({
    data,
    error,
  }: {
    data: Session | undefined;
    error: Error | null;
  }): number | false => {
    if (
      !isAwaitingGuest ||
      data?.mode !== SessionMode.MULTI ||
      hasSessionStarted(data) ||
      isSessionEntryRejected(error)
    ) {
      return false;
    }
    return error ? guestAdmissionRetryMs : guestAdmissionRefreshMs;
  };

  return queryOptions({
    ...sessionQueryOptions({ sessionApi, sessionId: sessionID }),
    enabled: ({ state }) => !hasSnapshot || refreshInterval(state) !== false,
    refetchInterval: ({ state }) => refreshInterval(state),
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}
