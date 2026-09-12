import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ApiResponseError, ErrorCode } from '@cityborn/api';
import { emitSessionEvent, toSessionAckError } from './session-socket-protocol';

function fakeConnection() {
  const calls: { event: string; args: unknown[] }[] = [];
  return {
    calls,
    emit(event: string, ...args: unknown[]) {
      calls.push({ event, args });
    },
    acknowledgeLast(ack: unknown) {
      const lastCall = calls[calls.length - 1];
      const acknowledge = lastCall.args[lastCall.args.length - 1];
      if (typeof acknowledge !== 'function') {
        throw new Error('Last emitted argument is not an acknowledgement');
      }
      acknowledge(ack);
    },
  };
}

describe('toSessionAckError', () => {
  it('keeps a well formed api error', () => {
    const apiError = toSessionAckError({
      success: false,
      error: {
        code: ErrorCode.SESSION_NOT_FOUND,
        message: 'nope',
        statusCode: 404,
      },
    });

    assert.equal(apiError.code, ErrorCode.SESSION_NOT_FOUND);
    assert.equal(apiError.statusCode, 404);
  });

  it('falls back to an unknown error keeping the status code', () => {
    const apiError = toSessionAckError({
      success: false,
      error: { code: 'NOT_AN_ERROR_CODE', statusCode: 418 },
    });

    assert.equal(apiError.code, ErrorCode.UNKNOWN_ERROR);
    assert.equal(apiError.statusCode, 418);
  });

  it('falls back to 500 when the ack carries no status code', () => {
    const apiError = toSessionAckError({ success: false });

    assert.equal(apiError.code, ErrorCode.UNKNOWN_ERROR);
    assert.equal(apiError.statusCode, 500);
  });
});

describe('emitSessionEvent', () => {
  it('emits the payload before the acknowledgement callback', async () => {
    const connection = fakeConnection();
    const emitted = emitSessionEvent(connection, 'session:join', {
      sessionID: 'session-1',
      playerID: 'player-1',
    });
    connection.acknowledgeLast({ success: true });

    await emitted;
    assert.equal(connection.calls[0].event, 'session:join');
    assert.deepEqual(connection.calls[0].args[0], {
      sessionID: 'session-1',
      playerID: 'player-1',
    });
  });

  it('emits only the acknowledgement callback for payload-less events', async () => {
    const connection = fakeConnection();
    const emitted = emitSessionEvent(connection, 'session:startGame');
    connection.acknowledgeLast({ success: true });

    await emitted;
    assert.equal(connection.calls[0].args.length, 1);
  });

  it('rejects with an ApiResponseError when the ack fails', async () => {
    const connection = fakeConnection();
    const emitted = emitSessionEvent(connection, 'session:nextRound');
    connection.acknowledgeLast({
      success: false,
      error: {
        code: ErrorCode.SESSION_FORBIDDEN_HOST,
        message: 'not host',
        statusCode: 403,
      },
    });

    await assert.rejects(emitted, (error: unknown) => {
      assert.ok(error instanceof ApiResponseError);
      assert.equal(error.apiError.code, ErrorCode.SESSION_FORBIDDEN_HOST);
      return true;
    });
  });

  it('rejects when the server answers with an unexpected shape', async () => {
    const connection = fakeConnection();
    const emitted = emitSessionEvent(connection, 'session:playAgain');
    connection.acknowledgeLast(undefined);

    await assert.rejects(emitted, ApiResponseError);
  });
});
