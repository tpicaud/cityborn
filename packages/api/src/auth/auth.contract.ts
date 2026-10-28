import { initContract } from '@ts-rest/core';
import {
  emptyRequestBodySchema,
  emptyResponseSchema,
} from '../protocol/payload.schema';
import { PublicUserSchema, UserSchema } from '../user/user.schema';
import {
  AuthResponseSchema,
  CreateUserSchema,
  PasswordResetRequestResponseSchema,
  RequestPasswordResetSchema,
  ResetPasswordSchema,
  SignInSchema,
  SignInWithAppleSchema,
  SignInWithGoogleSchema,
  UpdateEmailSchema,
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
    /**
     * @deprecated Utiliser `auth.register` à la place. Conservé pour les
     * builds web publiées avant l'inscription sans connexion immédiate.
     * @deprecatedSince 2026-10-23
     */
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
    requestPasswordReset: {
      method: 'POST',
      path: '/request-password-reset',
      body: RequestPasswordResetSchema,
      responses: { 200: PasswordResetRequestResponseSchema },
    },
    resetPassword: {
      method: 'POST',
      path: '/reset-password',
      body: ResetPasswordSchema,
      responses: { 200: emptyResponseSchema },
    },
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
    /**
     * @deprecated Utiliser `register` à la place. Conservé pour les builds
     * mobile publiées avant l'inscription sans connexion immédiate.
     * @deprecatedSince 2026-10-23
     */
    signUp: {
      method: 'POST',
      path: '/sign-up',
      body: CreateUserSchema,
      responses: { 201: AuthResponseSchema },
    },
    register: {
      method: 'POST',
      path: '/register',
      body: CreateUserSchema,
      responses: { 202: emptyResponseSchema },
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
    renewVerificationEmail: {
      method: 'POST',
      path: '/renew-verification-email',
      body: VerifyEmailDataSchema,
      responses: { 202: emptyResponseSchema },
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
    updateEmail: {
      method: 'PATCH',
      path: '/email',
      body: UpdateEmailSchema,
      responses: { 200: UserSchema },
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
