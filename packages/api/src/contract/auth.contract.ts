import { initContract } from '@ts-rest/core';
import { z } from 'zod';
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
  refresh: {
    method: 'POST',
    path: '/auth/refresh',
    body: z.object({}),
    responses: {
      200: z.object({ access_token: z.string(), refresh_token: z.string() }),
    },
  },
  me: {
    method: 'GET',
    path: '/auth/me',
    responses: { 200: z.object({ user: PublicUserSchema }) },
  },
  deleteUser: {
    method: 'POST',
    path: '/auth/delete-user',
    body: z.object({}),
    responses: { 200: z.object({}) },
  },
});
