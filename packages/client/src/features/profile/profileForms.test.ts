import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ChangePasswordFormSchema, toUpdatePassword } from './profileForms';

test('ChangePasswordFormSchema rejects a mismatched confirmation', () => {
  const result = ChangePasswordFormSchema.safeParse({
    currentPassword: 'Password1',
    newPassword: 'Password2',
    confirmPassword: 'Password3',
  });

  assert.equal(result.success, false);
});

test('toUpdatePassword drops the confirmation from a valid form', () => {
  const values = ChangePasswordFormSchema.parse({
    currentPassword: 'Password1',
    newPassword: 'Password2',
    confirmPassword: 'Password2',
  });

  assert.deepEqual(toUpdatePassword(values), {
    currentPassword: 'Password1',
    newPassword: 'Password2',
  });
});
