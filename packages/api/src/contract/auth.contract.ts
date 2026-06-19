import { initContract } from '@ts-rest/core';
import { commonErrorResponses } from '../schemas/api-error.schema.js';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
} from '../schemas/common.schema.js';
import {
  AuthResponseSchema,
  CreateUserSchema,
  SignInSchema,
  SignInWithAppleSchema,
  SignInWithGoogleSchema,
  UserSchema,
} from '../schemas/user.schema.js';

const c = initContract();

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
    deleteUser: {
      method: 'POST',
      path: '/delete-user',
      body: emptyRequestBodySchema,
      responses: { 200: emptyResponseSchema, ...commonErrorResponses },
    },
  },
  { pathPrefix: '/auth' },
);
