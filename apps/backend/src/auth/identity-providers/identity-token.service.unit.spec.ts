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

function buildService(payload: GoogleIdentityPayload): IdentityTokenService {
  const client: DeepMocked<GoogleIdentityClient> =
    createMock<GoogleIdentityClient>();
  client.verifyIdToken.mockResolvedValue({ getPayload: () => payload });
  return new IdentityTokenService(client, createMock<AuthConfig>());
}

const validPayload: GoogleIdentityPayload = {
  sub: 'google-1',
  email: 'alice@gmail.com',
  email_verified: true,
  exp: Math.floor(Date.now() / 1000) + 3600,
};

describe('IdentityTokenService.verifyGoogleIdToken', () => {
  it.each([
    { email: 'alice@gmail.com', hd: undefined, authoritative: true },
    {
      email: 'alice@workspace.test',
      hd: 'workspace.test',
      authoritative: true,
    },
    { email: 'alice@external.test', hd: undefined, authoritative: false },
    { email: 'alice@external.test', hd: '', authoritative: false },
  ])(
    'classifies email authority without requiring a name: %j',
    async ({ email, hd, authoritative }) => {
      const service: IdentityTokenService = buildService({
        ...validPayload,
        email,
        hd,
      });

      const identity: GoogleIdentity =
        await service.verifyGoogleIdToken('token');

      expect(identity).toEqual({
        googleId: 'google-1',
        email,
        name: undefined,
        emailIsAuthoritative: authoritative,
      });
    },
  );

  it.each([
    { sub: '' },
    { email: '' },
    { email_verified: false },
    { exp: Math.floor(Date.now() / 1000) - 1 },
  ])('rejects missing or expired claims: %j', async (claims) => {
    const service: IdentityTokenService = buildService({
      ...validPayload,
      ...claims,
    });

    await expect(service.verifyGoogleIdToken('token')).rejects.toMatchObject({
      status: 401,
    });
  });
});
