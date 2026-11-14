import { ErrorCode } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { HttpStatus } from '@nestjs/common';
import type { AuthConfig } from '../../config/config.module';
import type { AppleIdTokenClaims } from './apple-id-token';
import type {
  GoogleIdentityClient,
  GoogleIdTokenPayload,
} from './google-client.provider';
import {
  type GoogleIdentity,
  IdentityTokenService,
  type ProviderIdentity,
} from './identity-token.service';

let mockAppleIdTokenClaims: AppleIdTokenClaims | null = null;

function mockVerifyAppleIdToken(): Promise<AppleIdTokenClaims | null> {
  return Promise.resolve(mockAppleIdTokenClaims);
}

jest.mock('./apple-id-token', () => ({
  verifyAppleIdToken: mockVerifyAppleIdToken,
}));

function buildIdentityTokenService() {
  const googleClient: DeepMocked<GoogleIdentityClient> =
    createMock<GoogleIdentityClient>();
  const authConfig: AuthConfig = {
    jwtAccessSecret: 'access-secret',
    jwtRefreshSecret: 'refresh-secret',
    googleClientId: 'google-client',
    appleAppId: 'cityborn-app',
  };
  const identityTokenService: IdentityTokenService = new IdentityTokenService(
    googleClient,
    authConfig,
  );
  return { identityTokenService, googleClient };
}

describe('IdentityTokenService.verifyGoogleIdToken', () => {
  it.each([
    ['alice@Gmail.com', undefined, true],
    ['alice@cityborn.test', 'cityborn.test', true],
    ['alice@cityborn.test', undefined, false],
  ])(
    'classifies the authority of Google over %s with hosted domain %s',
    async (email: string, hd:
      | string
      | undefined, isEmailAuthoritative: boolean) => {
      const {
        identityTokenService,
        googleClient,
      }: ReturnType<typeof buildIdentityTokenService> =
        buildIdentityTokenService();
      googleClient.verifyIdToken.mockResolvedValue({
        sub: 'google-user-1',
        email,
        email_verified: true,
        hd,
      });

      const identity: GoogleIdentity =
        await identityTokenService.verifyGoogleIdToken('google-token');

      expect(identity).toEqual({
        provider: 'google',
        providerUserId: 'google-user-1',
        verifiedEmail: email,
        isEmailAuthoritative,
        name: undefined,
      });
    },
  );

  it.each([
    ['without payload', null],
    ['without email', { sub: 'google-user-1', email_verified: true }],
    [
      'without subject',
      { sub: '', email: 'alice@gmail.com', email_verified: true },
    ],
  ])(
    'rejects a token %s with 401',
    async (_label: string, payload: GoogleIdTokenPayload | null) => {
      const {
        identityTokenService,
        googleClient,
      }: ReturnType<typeof buildIdentityTokenService> =
        buildIdentityTokenService();
      googleClient.verifyIdToken.mockResolvedValue(payload);

      await expect(
        identityTokenService.verifyGoogleIdToken('google-token'),
      ).rejects.toMatchObject({
        status: HttpStatus.UNAUTHORIZED,
        response: { code: ErrorCode.USER_INVALID_TOKEN },
      });
    },
  );

  it('rejects an unverified Google email with 401', async () => {
    const {
      identityTokenService,
      googleClient,
    }: ReturnType<typeof buildIdentityTokenService> =
      buildIdentityTokenService();
    googleClient.verifyIdToken.mockResolvedValue({
      sub: 'google-user-1',
      email: 'alice@gmail.com',
      email_verified: false,
    });

    await expect(
      identityTokenService.verifyGoogleIdToken('google-token'),
    ).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      response: { code: ErrorCode.USER_GOOGLE_EMAIL_NOT_VERIFIED },
    });
  });
});

describe('IdentityTokenService.verifyAppleIdToken', () => {
  it.each([
    ['alice@icloud.com', true, true],
    ['alice@ME.com', true, true],
    ['alice@mac.com', true, true],
    ['alice@privaterelay.appleid.com', true, true],
    ['alice@cityborn.test', true, false],
    ['alice@icloud.com', false, false],
  ])(
    'classifies the authority of Apple over %s verified %s',
    async (email: string, emailVerified: boolean, isEmailAuthoritative: boolean) => {
      const {
        identityTokenService,
      }: ReturnType<typeof buildIdentityTokenService> =
        buildIdentityTokenService();
      mockAppleIdTokenClaims = {
        sub: 'apple-user-1',
        email,
        email_verified: emailVerified,
      };

      const identity: ProviderIdentity =
        await identityTokenService.verifyAppleIdToken('apple-token');

      expect(identity).toEqual({
        provider: 'apple',
        providerUserId: 'apple-user-1',
        verifiedEmail: emailVerified ? email : undefined,
        isEmailAuthoritative,
      });
    },
  );

  it('rejects an invalid token with 401', async () => {
    const {
      identityTokenService,
    }: ReturnType<typeof buildIdentityTokenService> =
      buildIdentityTokenService();
    mockAppleIdTokenClaims = null;

    await expect(
      identityTokenService.verifyAppleIdToken('apple-token'),
    ).rejects.toMatchObject({
      status: HttpStatus.UNAUTHORIZED,
      response: { code: ErrorCode.USER_INVALID_TOKEN },
    });
  });
});
