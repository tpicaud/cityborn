import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { z } from 'zod';
import './zod-error-map';

function issueMessage(schema: z.ZodTypeAny, value: unknown): string {
  const result = schema.safeParse(value);
  assert.equal(result.success, false);
  if (result.success) throw new Error('unreachable');
  return result.error.issues[0].message;
}

describe('frenchZodErrorMap (installed globally on import)', () => {
  test('required field', () => {
    assert.equal(
      issueMessage(z.object({ name: z.string() }), {}),
      'Ce champ est requis',
    );
  });

  test('string too short, singular', () => {
    assert.equal(
      issueMessage(z.string().min(1), ''),
      'Doit contenir au moins 1 caractère',
    );
  });

  test('string too short, plural', () => {
    assert.equal(
      issueMessage(z.string().min(3), 'ab'),
      'Doit contenir au moins 3 caractères',
    );
  });

  test('string too long', () => {
    assert.equal(
      issueMessage(z.string().max(2), 'abc'),
      'Ne doit pas dépasser 2 caractères',
    );
  });

  test('invalid email', () => {
    assert.equal(
      issueMessage(z.string().email(), 'not-an-email'),
      'Adresse email invalide',
    );
  });

  test('invalid enum value', () => {
    assert.equal(
      issueMessage(z.enum(['email', 'google']), 'apple'),
      'Valeur invalide, attendu : email, google',
    );
  });

  test('explicit message on a constraint is not overridden', () => {
    assert.equal(
      issueMessage(z.string().min(6, 'message explicite'), 'ab'),
      'message explicite',
    );
  });
});
