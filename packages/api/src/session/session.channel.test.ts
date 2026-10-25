import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { sessionWsChannel } from './session.channel';

const guessPayload: typeof sessionWsChannel.clientToServer.submitGuess.payload =
  sessionWsChannel.clientToServer.submitGuess.payload;

describe('sessionWsChannel.submitGuess', () => {
  it('accepts coordinates or an empty guess', () => {
    assert.deepEqual(
      guessPayload.parse({ guess: { coordinates: { lat: 0, lng: 0 } } }),
      { guess: { coordinates: { lat: 0, lng: 0 } } },
    );
    assert.deepEqual(guessPayload.parse({ guess: {} }), { guess: {} });
  });

  it('rejects client-provided scores and distances', () => {
    assert.equal(
      guessPayload.safeParse({
        guess: {
          coordinates: { lat: 48, lng: 2 },
          distance: 0,
          points: 1000,
          win: true,
        },
      }).success,
      false,
    );
  });

  it('rejects unknown fields and coordinates outside the map', () => {
    assert.equal(
      guessPayload.safeParse({ guess: {}, points: 1000 }).success,
      false,
    );
    assert.equal(
      guessPayload.safeParse({ guess: { coordinates: { lat: 91, lng: 2 } } })
        .success,
      false,
    );
    assert.equal(
      guessPayload.safeParse({ guess: { coordinates: { lat: 48, lng: -181 } } })
        .success,
      false,
    );
    assert.equal(
      guessPayload.safeParse({
        guess: { coordinates: { lat: Number.POSITIVE_INFINITY, lng: 2 } },
      }).success,
      false,
    );
  });
});

describe('sessionWsChannel.guess', () => {
  it('preserves the published client-scored payload', () => {
    const payload: {
      guess: {
        coordinates: { lat: number; lng: number };
        distance: number;
        points: number;
        win: boolean;
      };
    } = {
      guess: {
        coordinates: { lat: 48, lng: 2 },
        distance: 123,
        points: 456,
        win: false,
      },
    };

    assert.deepEqual(
      sessionWsChannel.clientToServer.guess.payload.parse(payload),
      payload,
    );
    assert.equal(sessionWsChannel.clientToServer.guess.deprecated, true);
  });
});
