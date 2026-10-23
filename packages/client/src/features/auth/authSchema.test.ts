import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  type CreateUser,
  type ResetPassword,
  UsernameSchema,
} from '@cityborn/api';
import {
  type PasswordResetFormValues,
  type SignUpFormValues,
  toCreateUser,
  toResetPassword,
} from './authSchema';

describe('toCreateUser', () => {
  it('drops confirmPassword from the sign-up payload', () => {
    const signUpFormValues: SignUpFormValues = {
      username: UsernameSchema.parse('citizen'),
      email: 'citizen@cityborn.fr',
      password: 'Password1',
      confirmPassword: 'Password1',
    };

    const createUser: CreateUser = toCreateUser(signUpFormValues);

    assert.deepEqual(createUser, {
      username: 'citizen',
      email: 'citizen@cityborn.fr',
      password: 'Password1',
    });
  });
});

describe('toResetPassword', () => {
  it('sends the new password with the reset token', () => {
    const values: PasswordResetFormValues = {
      newPassword: 'Password1',
      confirmPassword: 'Password1',
    };

    const resetPassword: ResetPassword = toResetPassword({
      passwordResetToken: 'reset-token',
      values,
    });

    assert.deepEqual(resetPassword, {
      passwordResetToken: 'reset-token',
      newPassword: 'Password1',
    });
  });
});
