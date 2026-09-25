import { initContract } from '@ts-rest/core';
import {
  commonErrorResponses,
  PasswordResetTokenErrorSchema,
} from '../schemas/api-error.schema';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
} from '../schemas/common.schema';
import {
  AuthResponseSchema,
  CreateUserSchema,
  PasswordResetRequestResponseSchema,
  PasswordResetTokenSchema,
  PublicUserSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  SignInSchema,
  SignInWithAppleSchema,
  SignInWithGoogleSchema,
  UserSchema,
  VerifyEmailDataSchema,
} from '../schemas/user.schema';
import type { ApiDomain } from './api-domain';

const c = initContract();

export const authContract = c.router(
  {
    requestPasswordReset: {
      method: 'POST',
      path: '/request-password-reset',
      body: RequestPasswordResetSchema,
      responses: {
        200: PasswordResetRequestResponseSchema,
        ...commonErrorResponses,
      },
    },
    validatePasswordResetToken: {
      method: 'POST',
      path: '/validate-password-reset-token',
      body: PasswordResetTokenSchema,
      responses: {
        200: emptyResponseSchema,
        ...commonErrorResponses,
        401: PasswordResetTokenErrorSchema,
      },
    },
    resetPassword: {
      method: 'POST',
      path: '/reset-password',
      body: ResetPasswordSchema,
      responses: {
        200: emptyResponseSchema,
        ...commonErrorResponses,
        401: PasswordResetTokenErrorSchema,
      },
    },
    me: {
      method: 'GET',
      path: '/me',
      responses: { 200: UserSchema, ...commonErrorResponses },
    },
    refresh: {
      method: 'POST',
      path: '/refresh',
      body: emptyRequestBodySchema,
      responses: { 200: AuthResponseSchema, ...commonErrorResponses },
    },
    signUp: {
      method: 'POST',
      path: '/sign-up',
      body: CreateUserSchema,
      responses: { 201: AuthResponseSchema, ...commonErrorResponses },
    },
    signIn: {
      method: 'POST',
      path: '/sign-in',
      body: SignInSchema,
      responses: { 200: AuthResponseSchema, ...commonErrorResponses },
    },
    signInWithGoogle: {
      method: 'POST',
      path: '/sign-in-with-google',
      body: SignInWithGoogleSchema,
      responses: { 200: AuthResponseSchema, ...commonErrorResponses },
    },
    signInWithApple: {
      method: 'POST',
      path: '/sign-in-with-apple',
      body: SignInWithAppleSchema,
      responses: { 200: AuthResponseSchema, ...commonErrorResponses },
    },
    resendVerificationEmail: {
      method: 'POST',
      path: '/resend-verification-email',
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
    verifyEmail: {
      method: 'POST',
      path: '/verify-email',
      body: VerifyEmailDataSchema,
      responses: { 200: PublicUserSchema, ...commonErrorResponses },
    },
    deleteUser: {
      method: 'POST',
      path: '/delete-user',
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/auth' satisfies `/${ApiDomain}` },
);
