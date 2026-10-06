import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { SafeParseReturnType } from 'zod';
import { type ResetPassword, ResetPasswordSchema } from './user.schema';

describe('ResetPasswordSchema', () => {
  const token: string = 'a'.repeat(64);
  const invalidPasswords: {
    scenario: string;
    password: string;
    confirmPassword: string;
    field: 'password' | 'confirmPassword';
  }[] = [
    {
      scenario: 'fewer than six characters',
      password: 'Abc1x',
      confirmPassword: 'Abc1x',
      field: 'password',
    },
    {
      scenario: 'more than thirty-two characters',
      password: `A1${'a'.repeat(31)}`,
      confirmPassword: `A1${'a'.repeat(31)}`,
      field: 'password',
    },
    {
      scenario: 'no uppercase letter',
      password: 'lowercase1',
      confirmPassword: 'lowercase1',
      field: 'password',
    },
    {
      scenario: 'no digit',
      password: 'NoDigits',
      confirmPassword: 'NoDigits',
      field: 'password',
    },
    {
      scenario: 'mismatched confirmation',
      password: 'ValidPass1',
      confirmPassword: 'Different1',
      field: 'confirmPassword',
    },
  ];

  invalidPasswords.forEach(({ scenario, password, confirmPassword, field }) => {
    it(`rejects ${scenario}`, () => {
      const result: SafeParseReturnType<unknown, ResetPassword> =
        ResetPasswordSchema.safeParse({ token, password, confirmPassword });

      assert.ok(!result.success);
      assert.ok(result.error.issues.some((issue) => issue.path[0] === field));
    });
  });

  [6, 32].forEach((length: number) => {
    it(`accepts matching passwords with ${length} characters`, () => {
      const password: string = `A1${'a'.repeat(length - 2)}`;
      const input: ResetPassword = {
        token,
        password,
        confirmPassword: password,
      };

      assert.deepEqual(ResetPasswordSchema.parse(input), input);
    });
  });
});
