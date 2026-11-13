import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type CreateUser, UsernameSchema } from '@cityborn/api';
import {
  GoogleEmailVerificationFormSchema,
  type SignUpFormValues,
  toCreateUser,
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

describe('GoogleEmailVerificationFormSchema', () => {
  it('requires the eight-digit code from the Google sign-in contract', () => {
    assert.equal(
      GoogleEmailVerificationFormSchema.safeParse({}).success,
      false,
    );
    ['', '1234567', '123456789', 'abcdefgh'].forEach(
      (emailVerificationCode: string) => {
        assert.equal(
          GoogleEmailVerificationFormSchema.safeParse({ emailVerificationCode })
            .success,
          false,
        );
      },
    );

    assert.deepEqual(
      GoogleEmailVerificationFormSchema.parse({
        emailVerificationCode: '12345678',
      }),
      { emailVerificationCode: '12345678' },
    );
  });
});
