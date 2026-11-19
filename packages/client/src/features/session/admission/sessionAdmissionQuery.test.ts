import assert from 'node:assert/strict';
import { describe, it, type Mock, type TestContext } from 'node:test';
import {
  ApiResponseError,
  buildGame,
  buildSession,
  ErrorCode,
  type Session,
  SessionStatus,
} from '@cityborn/api';
import {
  environmentManager,
  QueryClient,
  QueryObserver,
  type QueryObserverResult,
} from '@tanstack/react-query';
import type { SessionApi } from '../../../domains/session/sessionApi';
import {
  createSessionAdmissionDecision,
  isSessionEntryRejected,
  type SessionAdmission,
  type SessionAdmissionDecision,
} from './sessionAdmission';
import { sessionAdmissionQueryOptions } from './sessionAdmissionQuery';

type SessionAdmissionObserver = QueryObserver<
  Session,
  Error,
  Session,
  Session,
  string[]
>;

function waitForSessionFetch(
  observer: SessionAdmissionObserver,
): Promise<QueryObserverResult<Session>> {
  return new Promise((resolve) => {
    const unsubscribe: () => void = observer.subscribe((result) => {
      if (result.isFetching) return;
      unsubscribe();
      resolve(result);
    });
  });
}

describe('sessionAdmissionQueryOptions', () => {
  it('detects a game starting after a refused nickname and a transient GET failure', async (context: TestContext) => {
    context.mock.timers.enable({ apis: ['setInterval'] });
    const isServer: boolean = environmentManager.isServer();
    environmentManager.setIsServer(() => false);
    const queryClient: QueryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Number.POSITIVE_INFINITY } },
    });
    context.after(() => {
      queryClient.clear();
      environmentManager.setIsServer(() => isServer);
    });
    const lobby: Session = buildSession();
    const started: Session = buildSession({
      currentGame: buildGame(),
      status: SessionStatus.IN_GAME,
    });
    const fetchSession: Mock<SessionApi['fetchSession']> = context.mock.fn(
      async () => started,
    );
    fetchSession.mock.mockImplementationOnce(async () => lobby, 0);
    fetchSession.mock.mockImplementationOnce(async () => {
      throw new TypeError('fetch failed');
    }, 1);
    const sessionApi: SessionApi = {
      fetchSession,
      createSession: async () => lobby,
    };
    const admission: SessionAdmission = {
      status: 'rejected',
      error: new Error('nickname already taken'),
    };
    const options: ReturnType<typeof sessionAdmissionQueryOptions> =
      sessionAdmissionQueryOptions({
        sessionApi,
        sessionID: lobby.id,
        hasSnapshot: false,
        admission,
        automaticPlayerID: undefined,
      });
    queryClient.setQueryData(options.queryKey, started);
    const observer: SessionAdmissionObserver = new QueryObserver(
      queryClient,
      options,
    );
    context.after(observer.subscribe(() => undefined));
    assert.equal(observer.getCurrentResult().isFetchedAfterMount, false);
    const initial: QueryObserverResult<Session> =
      await waitForSessionFetch(observer);
    assert.equal(initial.isFetchedAfterMount, true);
    assert.deepEqual(initial.data, lobby);
    observer.setOptions(
      sessionAdmissionQueryOptions({
        sessionApi,
        sessionID: lobby.id,
        hasSnapshot: true,
        admission,
        automaticPlayerID: undefined,
      }),
    );

    const failedFetch: Promise<QueryObserverResult<Session>> =
      waitForSessionFetch(observer);
    context.mock.timers.tick(1_500);
    const transient: QueryObserverResult<Session> = await failedFetch;

    assert.equal(transient.data, initial.data);
    assert.equal(isSessionEntryRejected(transient.error), false);
    assert.equal(fetchSession.mock.callCount(), 2);
    context.mock.timers.tick(4_999);
    assert.equal(fetchSession.mock.callCount(), 2);

    const refreshed: Promise<QueryObserverResult<Session>> =
      waitForSessionFetch(observer);
    context.mock.timers.tick(1);
    const result: QueryObserverResult<Session> = await refreshed;
    const decision: SessionAdmissionDecision = createSessionAdmissionDecision({
      session: result.data,
      admission,
      automaticPlayerID: undefined,
    });

    assert.equal(result.data?.status, SessionStatus.IN_GAME);
    assert.equal(decision.isAdmitting, true);
    assert.equal(decision.returnToHome, true);
    assert.equal(decision.localPlayerID, undefined);
    context.mock.timers.tick(5_000);
    assert.equal(fetchSession.mock.callCount(), 3);
  });

  it('stops polling when a lobby expires', async (context: TestContext) => {
    context.mock.timers.enable({ apis: ['setInterval'] });
    const isServer: boolean = environmentManager.isServer();
    environmentManager.setIsServer(() => false);
    const queryClient: QueryClient = new QueryClient({
      defaultOptions: { queries: { gcTime: Number.POSITIVE_INFINITY } },
    });
    context.after(() => {
      queryClient.clear();
      environmentManager.setIsServer(() => isServer);
    });
    const lobby: Session = buildSession();
    const expired: ApiResponseError = new ApiResponseError({
      code: ErrorCode.SESSION_NOT_FOUND,
      statusCode: 404,
      message: 'Session not found',
    });
    const fetchSession: Mock<SessionApi['fetchSession']> = context.mock.fn(
      async () => {
        throw expired;
      },
    );
    fetchSession.mock.mockImplementationOnce(async () => lobby, 0);
    const observer: SessionAdmissionObserver = new QueryObserver(
      queryClient,
      sessionAdmissionQueryOptions({
        sessionApi: { fetchSession, createSession: async () => lobby },
        sessionID: lobby.id,
        hasSnapshot: true,
        admission: { status: 'idle' },
        automaticPlayerID: undefined,
      }),
    );
    context.after(observer.subscribe(() => undefined));
    const initial: QueryObserverResult<Session> = await observer.refetch();

    const refreshed: Promise<QueryObserverResult<Session>> =
      waitForSessionFetch(observer);
    context.mock.timers.tick(1_500);
    const result: QueryObserverResult<Session> = await refreshed;

    assert.equal(initial.data, lobby);
    assert.equal(result.error, expired);
    assert.equal(isSessionEntryRejected(result.error), true);
    context.mock.timers.tick(5_000);
    assert.equal(fetchSession.mock.callCount(), 2);
  });
});
