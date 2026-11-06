import assert from 'node:assert/strict';
import { describe, it, type TestContext } from 'node:test';
import {
  buildGame,
  buildSession,
  ErrorCode,
  type PlayerId,
  PlayerIdSchema,
  resolveErrorMessage,
  type Session,
  sessionWsEvent,
} from '@cityborn/api';
import { act, type RenderHookResult, renderHook } from '@testing-library/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { installDom } from '../../../test/dom';
import {
  type ContractClient,
  createCookieContractClient,
} from '../../api/contractClient';
import { ApiProvider } from '../../domains/apiProvider';
import { type AuthApi, createCookieAuthApi } from '../../domains/auth/authApi';
import type { Navigation, NavigationPath } from '../../platform/navigation';
import { ErrorReporterProvider } from '../../shared/errorReporter';
import type { SocketConnection } from '../../ws/socketConnection';
import type { SocketFactory } from '../../ws/socketFactory';
import { WsProvider } from '../../ws/wsProvider';
import { AuthProvider } from '../auth/authContext';
import {
  enterSession,
  type SessionController,
  useSessionController,
} from './useSessionController';

const playerID: PlayerId = PlayerIdSchema.parse('guest');

describe('enterSession', () => {
  it('starts the game of a quick play once the player has joined', async () => {
    const actions: string[] = [];

    await enterSession({
      session: { quickPlay: true },
      playerID,
      join: async () => {
        actions.push('join');
      },
      startGame: async () => {
        actions.push('startGame');
      },
    });

    assert.deepEqual(actions, ['join', 'startGame']);
  });

  it('leaves a classic session in its lobby', async () => {
    const actions: string[] = [];

    await enterSession({
      session: { quickPlay: false },
      playerID,
      join: async () => {
        actions.push('join');
      },
      startGame: async () => {
        actions.push('startGame');
      },
    });

    assert.deepEqual(actions, ['join']);
  });

  it('does not start a quick play the player could not join', async () => {
    const actions: string[] = [];

    await assert.rejects(
      enterSession({
        session: { quickPlay: true },
        playerID,
        join: async () => {
          throw new Error('Solo session already has its player');
        },
        startGame: async () => {
          actions.push('startGame');
        },
      }),
    );

    assert.deepEqual(actions, []);
  });
});

type SessionControllerTest = {
  hook: RenderHookResult<SessionController, unknown>;
  returnPaths: NavigationPath[];
  acknowledgeDeparture: (success: boolean) => void;
};

function isAcknowledgement(value: unknown): value is (ack: unknown) => void {
  return typeof value === 'function';
}

async function renderSessionController(
  context: TestContext,
): Promise<SessionControllerTest> {
  installDom(context);
  const session: Session = buildSession({ currentGame: buildGame() });
  context.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify(session), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
  );
  const returnPaths: NavigationPath[] = [];
  const navigation: Navigation = {
    push: () => {},
    back: () => {},
    returnTo: (path: NavigationPath) => {
      returnPaths.push(path);
    },
  };
  let departureAcknowledgement: ((ack: unknown) => void) | undefined;
  const socket: SocketConnection = {
    connected: true,
    active: true,
    connect: () => {},
    disconnect: () => {},
    emit: (event, ...args) => {
      const acknowledge: unknown = args.at(-1);
      if (!isAcknowledgement(acknowledge))
        throw new Error('Missing acknowledgement');
      if (event === sessionWsEvent.leaveGame) {
        departureAcknowledgement = acknowledge;
        return;
      }
      acknowledge({ success: true });
    },
    on: () => {},
    off: () => {},
    onReconnection: () => {},
    offReconnection: () => {},
  };
  const createSocket: SocketFactory = async () => socket;
  const contractClient: ContractClient = createCookieContractClient(
    'https://cityborn.test',
  );
  const authApi: AuthApi = createCookieAuthApi(contractClient);
  const wrapper: (props: PropsWithChildren) => ReactNode = ({ children }) => (
    <ErrorReporterProvider
      ErrorDialogComponent={({ open, errorMessage }) =>
        open ? <div>{errorMessage}</div> : null
      }
    >
      <ApiProvider contractClient={contractClient} authApi={authApi}>
        <AuthProvider user={null}>
          <WsProvider createSocket={createSocket}>{children}</WsProvider>
        </AuthProvider>
      </ApiProvider>
    </ErrorReporterProvider>
  );
  const hook: RenderHookResult<SessionController, unknown> = renderHook(
    () => useSessionController({ sessionID: session.id, navigation }),
    { wrapper },
  );
  await act(async () => {});
  assert.equal(hook.result.current.connectionStatus, 'connected');

  return {
    hook,
    returnPaths,
    acknowledgeDeparture: (success: boolean) => {
      assert.ok(departureAcknowledgement);
      departureAcknowledgement(
        success
          ? { success: true }
          : {
              success: false,
              error: {
                code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
                statusCode: 404,
                message: 'Player not found',
              },
            },
      );
    },
  };
}

describe('useSessionController.leaveGame', () => {
  it('returns home only after the server acknowledges the departure', async (context: TestContext) => {
    const { hook, returnPaths, acknowledgeDeparture }: SessionControllerTest =
      await renderSessionController(context);
    const departure: Promise<void> = hook.result.current.leaveGame();
    assert.deepEqual(returnPaths, []);

    await act(async () => {
      acknowledgeDeparture(true);
      await departure;
    });

    assert.deepEqual(returnPaths, ['/']);
  });

  it('reports a refused departure and keeps the player in the game', async (context: TestContext) => {
    const { hook, returnPaths, acknowledgeDeparture }: SessionControllerTest =
      await renderSessionController(context);
    const departure: Promise<void> = hook.result.current.leaveGame();

    await act(async () => {
      acknowledgeDeparture(false);
      await departure;
    });

    assert.deepEqual(returnPaths, []);
    assert.equal(
      document.body.textContent,
      resolveErrorMessage({
        code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
        statusCode: 404,
        message: 'Player not found',
      }),
    );
    assert.ok(hook.result.current.session?.currentGame);
  });
});
