import { initContract } from '@ts-rest/core';
import type { ApiDomain } from '../contract/api-domain';
import { commonErrorResponses } from '../errors/api-error.schema';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
} from '../protocol/payload.schema';
import { PublicUserSchema, UserSchema } from '../user/user.schema';
import {
  AuthResponseSchema,
  CreateUserSchema,
  SignInSchema,
  SignInWithAppleSchema,
  SignInWithGoogleSchema,
  UpdatePasswordSchema,
  VerifyEmailDataSchema,
} from './auth.schema';

const c = initContract();

const cookieAuthContract = c.router(
  {
    refresh: {
      method: 'POST',
      path: '/refresh',
      body: emptyRequestBodySchema,
      responses: { 200: UserSchema, ...commonErrorResponses },
    },
    signUp: {
      method: 'POST',
      path: '/sign-up',
      body: CreateUserSchema,
      responses: { 201: UserSchema, ...commonErrorResponses },
    },
    signIn: {
      method: 'POST',
      path: '/sign-in',
      body: SignInSchema,
      responses: { 200: UserSchema, ...commonErrorResponses },
    },
    signInWithGoogle: {
      method: 'POST',
      path: '/sign-in-with-google',
      body: SignInWithGoogleSchema,
      responses: { 200: UserSchema, ...commonErrorResponses },
    },
    signInWithApple: {
      method: 'POST',
      path: '/sign-in-with-apple',
      body: SignInWithAppleSchema,
      responses: { 200: UserSchema, ...commonErrorResponses },
    },
    updatePassword: {
      method: 'PATCH',
      path: '/password',
      body: UpdatePasswordSchema,
      responses: { 200: UserSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/cookie' },
);

export const authContract = c.router(
  {
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
    updatePassword: {
      method: 'PATCH',
      path: '/password',
      body: UpdatePasswordSchema,
      responses: { 200: AuthResponseSchema, ...commonErrorResponses },
    },
    signOut: {
      method: 'POST',
      path: '/sign-out',
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
    cookie: cookieAuthContract,
  },
  { pathPrefix: '/auth' satisfies `/${ApiDomain}` },
);
