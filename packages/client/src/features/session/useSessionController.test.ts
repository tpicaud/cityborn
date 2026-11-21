import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  type ApiError,
  ErrorCode,
  type PlayerId,
  PlayerIdSchema,
} from '@cityborn/api';
import { enterSession, reconnectJoinedPlayer } from './useSessionController';

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

describe('reconnectJoinedPlayer', () => {
  it('leaves the session of a player kicked while disconnected', async () => {
    const playerNotFound: ApiError = {
      code: ErrorCode.SESSION_PLAYER_NOT_FOUND,
      message: 'Player not found in session',
      statusCode: 404,
    };
    const actions: string[] = [];

    await reconnectJoinedPlayer({
      reconnect: () => Promise.reject(playerNotFound),
      leaveKickedSession: () => {
        actions.push('leaveKickedSession');
      },
    });

    assert.deepEqual(actions, ['leaveKickedSession']);
  });

  it('rethrows any other reconnection failure', async () => {
    const reconnectForbidden: ApiError = {
      code: ErrorCode.SESSION_RECONNECT_FORBIDDEN,
      message: 'Invalid or missing reconnect token',
      statusCode: 403,
    };
    const actions: string[] = [];

    await assert.rejects(
      reconnectJoinedPlayer({
        reconnect: () => Promise.reject(reconnectForbidden),
        leaveKickedSession: () => {
          actions.push('leaveKickedSession');
        },
      }),
      { code: ErrorCode.SESSION_RECONNECT_FORBIDDEN },
    );

    assert.deepEqual(actions, []);
  });
});
