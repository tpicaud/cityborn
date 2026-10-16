import { initContract } from '@ts-rest/core';
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
      responses: { 200: UserSchema },
    },
    signUp: {
      method: 'POST',
      path: '/sign-up',
      body: CreateUserSchema,
      responses: { 201: UserSchema },
    },
    signIn: {
      method: 'POST',
      path: '/sign-in',
      body: SignInSchema,
      responses: { 200: UserSchema },
    },
    signInWithGoogle: {
      method: 'POST',
      path: '/sign-in-with-google',
      body: SignInWithGoogleSchema,
      responses: { 200: UserSchema },
    },
    signInWithApple: {
      method: 'POST',
      path: '/sign-in-with-apple',
      body: SignInWithAppleSchema,
      responses: { 200: UserSchema },
    },
    updatePassword: {
      method: 'PATCH',
      path: '/password',
      body: UpdatePasswordSchema,
      responses: { 200: UserSchema },
    },
  },
  { pathPrefix: '/cookie' },
);

export const authContract = c.router(
  {
    me: {
      method: 'GET',
      path: '/me',
      responses: { 200: UserSchema },
    },
    refresh: {
      method: 'POST',
      path: '/refresh',
      body: emptyRequestBodySchema,
      responses: { 200: AuthResponseSchema },
    },
    signUp: {
      method: 'POST',
      path: '/sign-up',
      body: CreateUserSchema,
      responses: { 201: AuthResponseSchema },
    },
    signIn: {
      method: 'POST',
      path: '/sign-in',
      body: SignInSchema,
      responses: { 200: AuthResponseSchema },
    },
    signInWithGoogle: {
      method: 'POST',
      path: '/sign-in-with-google',
      body: SignInWithGoogleSchema,
      responses: { 200: AuthResponseSchema },
    },
    signInWithApple: {
      method: 'POST',
      path: '/sign-in-with-apple',
      body: SignInWithAppleSchema,
      responses: { 200: AuthResponseSchema },
    },
    resendVerificationEmail: {
      method: 'POST',
      path: '/resend-verification-email',
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema },
    },
    verifyEmail: {
      method: 'POST',
      path: '/verify-email',
      body: VerifyEmailDataSchema,
      responses: { 200: PublicUserSchema },
    },
    deleteUser: {
      method: 'POST',
      path: '/delete-user',
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema },
    },
    updatePassword: {
      method: 'PATCH',
      path: '/password',
      body: UpdatePasswordSchema,
      responses: { 200: AuthResponseSchema },
    },
    signOut: {
      method: 'POST',
      path: '/sign-out',
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema },
    },
    cookie: cookieAuthContract,
  },
  { pathPrefix: '/auth' },
);
