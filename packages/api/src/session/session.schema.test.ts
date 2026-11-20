import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CreateSessionSchema, SessionMode } from './session.schema';

describe('CreateSessionSchema', () => {
  it('accepts a solo quick play', () => {
    assert.equal(
      CreateSessionSchema.safeParse({ mode: SessionMode.SOLO, quickPlay: true })
        .success,
      true,
    );
  });

  it('rejects a multiplayer quick play', () => {
    assert.equal(
      CreateSessionSchema.safeParse({
        mode: SessionMode.MULTI,
        quickPlay: true,
      }).success,
      false,
    );
  });
});
