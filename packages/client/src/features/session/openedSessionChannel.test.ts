import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  ApiResponseError,
  ErrorCode,
  resolveErrorMessage,
  sessionWsEvent,
} from '@cityborn/api';
import type { SessionChannel } from '../../domains/session/sessionApi';
import { requireOpenedSessionChannel } from './openedSessionChannel';

const idleChannel: SessionChannel = {
  emit: () => new Promise(() => {}),
  on: () => () => {},
};

describe('requireOpenedSessionChannel', () => {
  it('returns the opened session channel', () => {
    const openedChannel: SessionChannel = requireOpenedSessionChannel({
      sessionChannel: idleChannel,
      event: sessionWsEvent.startGame,
    });

    assert.equal(openedChannel, idleChannel);
  });

  it('rejects with the real-time connection message when no channel is opened', () => {
    const requirement: () => SessionChannel = () =>
      requireOpenedSessionChannel({
        sessionChannel: null,
        event: sessionWsEvent.startGame,
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
