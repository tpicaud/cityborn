import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ApiResponseError,
  ErrorCode,
  resolveErrorMessage,
  type sessionWsChannel,
} from '@cityborn/api';
import {
  createSessionChannel,
  type SessionChannel,
} from '../../domains/session/sessionApi';
import type { WsChannelConnection } from '../../ws/wsChannelConnection';
import { requireOpenedSessionChannel } from './openedSessionChannel';

const idleConnection: WsChannelConnection<typeof sessionWsChannel> = {
  emit: () => new Promise(() => {}),
  on: () => {},
  off: () => {},
};

describe('requireOpenedSessionChannel', () => {
  it('returns the opened session channel', () => {
    const sessionChannel: SessionChannel = createSessionChannel(idleConnection);

    const openedChannel: SessionChannel = requireOpenedSessionChannel({
      sessionChannel,
      action: 'Starting game',
    });

    assert.equal(openedChannel, sessionChannel);
  });

  it('rejects with the real-time connection message when no channel is opened', () => {
    const requirement: () => SessionChannel = () =>
      requireOpenedSessionChannel({
        sessionChannel: null,
        action: 'Starting game',
      });

    assert.throws(requirement, (error: unknown) => {
      assert.ok(error instanceof ApiResponseError);
      assert.equal(error.code, ErrorCode.WS_NOT_CONNECTED);
      assert.equal(
        resolveErrorMessage(error),
        'La connexion temps réel est fermée. Veuillez réessayer.',
      );
      return true;
    });
  });
});
