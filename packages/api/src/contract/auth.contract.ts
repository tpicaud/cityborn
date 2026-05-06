import { initContract } from '@ts-rest/core';
import { z } from 'zod';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
} from '../schemas/common.schema.js';
import {
  AuthResponseSchema,
  CreateUserSchema,
  PublicUserSchema,
  SignInSchema,
  SignInWithAppleSchema,
  SignInWithGoogleSchema,
} from '../schemas/user.schema.js';

const c = initContract();

export const authContract = c.router({
  me: {
    method: 'GET',
    path: '/auth/me',
    responses: { 200: PublicUserSchema },
  },
  refresh: {
    method: 'POST',
    path: '/auth/refresh',
    body: emptyRequestBodySchema,
    responses: {
      200: AuthResponseSchema,
    },
  },
  signUp: {
    method: 'POST',
    path: '/auth/sign-up',
    body: CreateUserSchema,
    responses: { 201: AuthResponseSchema },
  },
  signIn: {
    method: 'POST',
    path: '/auth/sign-in',
    body: SignInSchema,
    responses: { 200: AuthResponseSchema },
  },
  signInWithGoogle: {
    method: 'POST',
    path: '/auth/sign-in-with-google',
    body: SignInWithGoogleSchema,
    responses: { 200: AuthResponseSchema },
  },
  signInWithApple: {
    method: 'POST',
    path: '/auth/sign-in-with-apple',
    body: SignInWithAppleSchema,
    responses: { 200: AuthResponseSchema },
  },
  deleteUser: {
    method: 'POST',
    path: '/auth/delete-user',
    body: emptyRequestBodySchema,
    responses: { 204: emptyResponseSchema },
  },
});
