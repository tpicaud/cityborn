import assert from 'node:assert/strict';
import { after, beforeEach, describe, it, type Mock, mock } from 'node:test';
import {
  ApiResponseError,
  buildSession,
  ErrorCode,
  type PlayerId,
  PlayerIdSchema,
  resolveErrorMessage,
  type Session,
  type SessionJoinAck,
  SessionReconnectTokenSchema,
  SessionStatus,
} from '@cityborn/api';
import type {
  SessionApi,
  SessionChannel,
} from '../../domains/session/sessionApi';
import type { Navigation } from '../../platform/navigation';
import type { SessionController } from './useSessionController';

type Effect = () => undefined | (() => void);
type EffectSlot = {
  dependencies: unknown[];
  cleanup: (() => void) | undefined;
};

const states: unknown[] = [];
const refs: { current: unknown }[] = [];
const effects: EffectSlot[] = [];
let stateIndex: number = 0;
let refIndex: number = 0;
let effectIndex: number = 0;
let pendingEffects: (() => void)[] = [];
let onSessionUpdate: (session: Session) => void = () => {};
let joinResult: Promise<SessionJoinAck>;
const session: Session = buildSession();
const playerID: PlayerId = PlayerIdSchema.parse('friend');
const errors: unknown[] = [];
const returnTo: Mock<Navigation['returnTo']> =
  mock.fn<Navigation['returnTo']>();
const navigation: Navigation = { returnTo, push: () => {}, back: () => {} };
const sessionApi: Pick<SessionApi, 'fetchSession'> = {
  fetchSession: async () => session,
};
const channel: SessionChannel = {
  join: async () => joinResult,
  reconnect: async () => {},
  updateHost: async () => {},
  updateGameConfig: async () => {},
  startGame: async () => {},
  guess: async () => {},
  nextRound: async () => {},
  playAgain: async () => {},
  onSessionUpdate(listener) {
    onSessionUpdate = listener;
    return () => {
      onSessionUpdate = () => {};
    };
  },
};
const reportError: (error: unknown) => void = (error) => {
  errors.push(error);
};
const errorReporter: { reportError: typeof reportError } = { reportError };

function isStateUpdate(
  value: unknown,
): value is (previous: unknown) => unknown {
  return typeof value === 'function';
}

mock.module('react', {
  namedExports: {
    useState(initialValue: unknown) {
      const index: number = stateIndex++;
      if (!(index in states)) states[index] = initialValue;
      return [
        states[index],
        (value: unknown) => {
          states[index] = isStateUpdate(value) ? value(states[index]) : value;
        },
      ];
    },
    useRef(initialValue: unknown) {
      const index: number = refIndex++;
      refs[index] ??= { current: initialValue };
      return refs[index];
    },
    useCallback(callback: unknown) {
      return callback;
    },
    useEffect(effect: Effect, dependencies: unknown[]) {
      const index: number = effectIndex++;
      const previous: EffectSlot | undefined = effects[index];
      if (
        previous &&
        dependencies.every((value, position) =>
          Object.is(value, previous.dependencies[position]),
        )
      )
        return;
      pendingEffects.push(() => {
        previous?.cleanup?.();
        effects[index] = { dependencies, cleanup: effect() };
      });
    },
  },
});
mock.module('@tanstack/react-query', {
  namedExports: { useQueryClient: () => ({}) },
});
mock.module('../../domains/apiProvider.tsx', {
  namedExports: { useDomainApis: () => ({ sessionApi }) },
});
mock.module('../../domains/game-record/gameRecordQueries.ts', {
  namedExports: { invalidateGameRecords: () => {} },
});
mock.module('../../domains/session/useSessionChannel.ts', {
  namedExports: {
    useSessionChannel: () => ({
      channel,
      connectionStatus: 'connected',
      retryConnection: () => {},
    }),
  },
});
mock.module('../../shared/errorReporter.tsx', {
  namedExports: { useErrorReporter: () => errorReporter },
});
mock.module('../auth/authContext.tsx', {
  namedExports: { useCurrentUser: () => ({ user: null }) },
});

const { useSessionController }: typeof import('./useSessionController') =
  await import('./useSessionController');

after(() => {
  effects.forEach((effect) => {
    effect.cleanup?.();
  });
});

function SessionControllerHarness(): SessionController {
  stateIndex = 0;
  refIndex = 0;
  effectIndex = 0;
  const controller: SessionController = useSessionController({
    sessionID: session.id,
    navigation,
  });
  const scheduled: (() => void)[] = pendingEffects;
  pendingEffects = [];
  scheduled.forEach((effect) => {
    effect();
  });
  return controller;
}

beforeEach(async () => {
  effects.forEach((effect) => {
    effect.cleanup?.();
  });
  states.length = 0;
  refs.length = 0;
  effects.length = 0;
  pendingEffects = [];
  errors.length = 0;
  returnTo.mock.resetCalls();
  SessionControllerHarness();
  await Promise.resolve();
});

describe('useSessionController', () => {
  it('admits a guest when the game starts before the join acknowledgement', async () => {
    const acknowledgement: PromiseWithResolvers<SessionJoinAck> =
      Promise.withResolvers<SessionJoinAck>();
    joinResult = acknowledgement.promise;
    const pending: Promise<void> = SessionControllerHarness().join(playerID);

    onSessionUpdate(buildSession({ status: SessionStatus.IN_GAME }));
    const waiting: SessionController = SessionControllerHarness();

    assert.equal(waiting.isAdmitting, true);
    assert.equal(waiting.localPlayerID, undefined);
    assert.equal(returnTo.mock.callCount(), 0);
    assert.deepEqual(errors, []);

    acknowledgement.resolve({
      reconnectToken: SessionReconnectTokenSchema.parse('guest-token'),
    });
    await pending;
    const admitted: SessionController = SessionControllerHarness();

    assert.equal(admitted.localPlayerID, 'friend');
    assert.equal(admitted.session?.status, SessionStatus.IN_GAME);
    assert.equal(admitted.isAdmitting, false);
    assert.equal(returnTo.mock.callCount(), 0);
    assert.deepEqual(errors, []);
  });

  it('reports the product message once when the server rejects admission after the game starts', async () => {
    const acknowledgement: PromiseWithResolvers<SessionJoinAck> =
      Promise.withResolvers<SessionJoinAck>();
    joinResult = acknowledgement.promise;
    const pending: Promise<void> = SessionControllerHarness().join(playerID);
    onSessionUpdate(buildSession({ status: SessionStatus.IN_GAME }));
    SessionControllerHarness();

    acknowledgement.reject(
      new ApiResponseError({
        code: ErrorCode.SESSION_ALREADY_IN_GAME,
        statusCode: 403,
        message: 'game started',
      }),
    );
    await pending;
    const rejected: SessionController = SessionControllerHarness();

    assert.equal(rejected.localPlayerID, undefined);
    assert.equal(returnTo.mock.callCount(), 1);
    assert.deepEqual(returnTo.mock.calls[0]?.arguments, ['/']);
    assert.equal(errors.length, 1);
    assert.equal(resolveErrorMessage(errors[0]), 'La partie a déjà commencé');
  });

  it('rejects an anonymous visitor when the loaded game has already started', () => {
    SessionControllerHarness();

    onSessionUpdate(buildSession({ status: SessionStatus.IN_GAME }));
    SessionControllerHarness();

    assert.equal(returnTo.mock.callCount(), 1);
    assert.equal(errors.length, 1);
    assert.equal(resolveErrorMessage(errors[0]), 'La partie a déjà commencé');
  });
});
