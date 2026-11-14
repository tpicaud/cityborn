import { LoginTicket, OAuth2Client } from 'google-auth-library';
import { CertificateFormat } from 'google-auth-library/build/src/auth/oauth2client';
import type { AuthConfig } from '../../config/config.module';
import {
  createGoogleIdentityClient,
  type GoogleIdentityClient,
  type GoogleIdTokenPayload,
} from './google-client.provider';

const authConfig: AuthConfig = {
  jwtAccessSecret: 'access-secret',
  jwtRefreshSecret: 'refresh-secret',
  googleClientId: 'google-client',
  appleAppId: 'cityborn-app',
};

beforeEach(() => {
  jest
    .spyOn(OAuth2Client.prototype, 'getFederatedSignonCertsAsync')
    .mockResolvedValue({
      certs: { 'key-1': 'public-key' },
      format: CertificateFormat.PEM,
    });
});

describe('GoogleIdentityClient.verifyIdToken', () => {
  it('returns the claims of a token signed by Google for the configured audience', async () => {
    const verifySignedJwt: jest.SpyInstance = jest
      .spyOn(OAuth2Client.prototype, 'verifySignedJwtWithCertsAsync')
      .mockResolvedValue(
        new LoginTicket('envelope', {
          iss: 'https://accounts.google.com',
          aud: 'google-client',
          iat: 0,
          exp: 600,
          sub: 'google-user-1',
          email: 'alice@gmail.com',
        }),
      );
    const client: GoogleIdentityClient = createGoogleIdentityClient(authConfig);

    const payload: GoogleIdTokenPayload | null =
      await client.verifyIdToken('google-token');

    expect(payload).toMatchObject({
      sub: 'google-user-1',
      email: 'alice@gmail.com',
    });
    expect(verifySignedJwt).toHaveBeenCalledWith(
      'google-token',
      { 'key-1': 'public-key' },
      'google-client',
      ['accounts.google.com', 'https://accounts.google.com'],
    );
  });

  it('returns null for a token rejected by Google verification', async () => {
    jest
      .spyOn(OAuth2Client.prototype, 'verifySignedJwtWithCertsAsync')
      .mockRejectedValue(new Error('Token used too late'));
    const client: GoogleIdentityClient = createGoogleIdentityClient(authConfig);

    const payload: GoogleIdTokenPayload | null =
      await client.verifyIdToken('google-token');

    expect(payload).toBeNull();
  });

  it('propagates a failure to fetch Google certificates', async () => {
    const outage: Error = new Error('certificates unavailable');
    jest
      .spyOn(OAuth2Client.prototype, 'getFederatedSignonCertsAsync')
      .mockRejectedValue(outage);
    const client: GoogleIdentityClient = createGoogleIdentityClient(authConfig);

    await expect(client.verifyIdToken('google-token')).rejects.toBe(outage);
  });
});
