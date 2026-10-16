import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { UpdatePassword } from '@cityborn/api';
import {
  ChangePasswordFormSchema,
  type ChangePasswordFormValues,
  toUpdatePassword,
} from './profileForms';

describe('ChangePasswordFormSchema', () => {
  it('rejects a mismatched confirmation', () => {
    const formInput: ChangePasswordFormValues = {
      currentPassword: 'Password1',
      newPassword: 'Password2',
      confirmPassword: 'Password3',
    };

    const isValid: boolean =
      ChangePasswordFormSchema.safeParse(formInput).success;

    assert.equal(isValid, false);
  });
});

describe('toUpdatePassword', () => {
  it('drops the confirmation from a valid form', () => {
    const values: ChangePasswordFormValues = ChangePasswordFormSchema.parse({
      currentPassword: 'Password1',
      newPassword: 'Password2',
      confirmPassword: 'Password2',
    });

    const updatePassword: UpdatePassword = toUpdatePassword(values);

    assert.deepEqual(updatePassword, {
      currentPassword: 'Password1',
      newPassword: 'Password2',
    });
  });
});
