import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type CreateUser, UsernameSchema } from '@cityborn/api';
import { type SignUpFormValues, toCreateUser } from './authSchema';

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
