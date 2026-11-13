import { ErrorCode } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { AuthConfig } from '../../config/config.module';
import type {
  GoogleIdentityClient,
  GoogleIdentityPayload,
} from './google-client.provider';
import {
  type GoogleIdentity,
  IdentityTokenService,
} from './identity-token.service';

const authConfig: AuthConfig = {
  googleClientId: 'google-client',
  appleAppId: 'apple-app',
  jwtAccessSecret: 'access',
  jwtRefreshSecret: 'refresh',
};
const client: DeepMocked<GoogleIdentityClient> =
  createMock<GoogleIdentityClient>();
const service: IdentityTokenService = new IdentityTokenService(
  client,
  authConfig,
);
const validPayload: GoogleIdentityPayload = {
  sub: 'google-subject',
  email: 'Alice@Gmail.com',
  email_verified: true,
};

beforeEach(() => jest.resetAllMocks());

describe('IdentityTokenService.verifyGoogleIdToken', () => {
  it.each([
    ['gmail.com', undefined, true],
    ['example.com', 'example.com', true],
    ['example.com', undefined, false],
  ])(
    'classifies %s with hosted domain %s',
    async (domain, hd, isEmailAuthoritative) => {
      client.verifyIdToken.mockResolvedValue({
        getPayload: () => ({ ...validPayload, email: `Alice@${domain}`, hd }),
      });

      const identity: GoogleIdentity =
        await service.verifyGoogleIdToken('token');

      expect(identity).toEqual({
        subject: 'google-subject',
        email: `alice@${domain}`,
        name: 'joueur',
        isEmailAuthoritative,
      });
      expect(client.verifyIdToken).toHaveBeenCalledWith({
        idToken: 'token',
        audience: 'google-client',
      });
    },
  );

  it.each([
    undefined,
    { ...validPayload, sub: '' },
    { ...validPayload, email: undefined },
  ])('rejects incomplete claims', async (payload) => {
    client.verifyIdToken.mockResolvedValue({ getPayload: () => payload });

    await expect(service.verifyGoogleIdToken('token')).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('rejects an unverified email', async () => {
    client.verifyIdToken.mockResolvedValue({
      getPayload: () => ({ ...validPayload, email_verified: false }),
    });

    await expect(service.verifyGoogleIdToken('token')).rejects.toMatchObject({
      response: { code: ErrorCode.USER_GOOGLE_EMAIL_NOT_VERIFIED },
    });
  });
});
