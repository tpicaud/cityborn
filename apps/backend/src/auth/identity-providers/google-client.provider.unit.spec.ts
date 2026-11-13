import { generateKeyPairSync, type KeyObject } from 'node:crypto';
import { ErrorCode } from '@cityborn/api';
import { OAuth2Client } from 'google-auth-library';
import { CertificateFormat } from 'google-auth-library/build/src/auth/oauth2client';
import { type SignOptions, sign } from 'jsonwebtoken';
import type { AuthConfig } from '../../config/config.module';
import { GoogleClientProvider } from './google-client.provider';

const keys: { publicKey: KeyObject; privateKey: KeyObject } =
  generateKeyPairSync('rsa', {
    modulusLength: 2048,
  });
const publicKey: string = keys.publicKey
  .export({ type: 'spki', format: 'pem' })
  .toString();
const privateKey: string = keys.privateKey
  .export({ type: 'pkcs8', format: 'pem' })
  .toString();
const authConfig: AuthConfig = {
  googleClientId: 'google-client',
  appleAppId: 'apple-app',
  jwtAccessSecret: 'access',
  jwtRefreshSecret: 'refresh',
};
const client: GoogleClientProvider = new GoogleClientProvider(authConfig);

beforeEach(() => {
  jest
    .spyOn(OAuth2Client.prototype, 'getFederatedSignonCertsAsync')
    .mockResolvedValue({
      certs: { 'test-key': publicKey },
      format: CertificateFormat.PEM,
    });
});
afterEach(() => jest.restoreAllMocks());

function token(options: SignOptions = {}): string {
  return sign(
    { sub: 'google-subject', email: 'alice@gmail.com', email_verified: true },
    privateKey,
    {
      algorithm: 'RS256',
      keyid: 'test-key',
      audience: 'google-client',
      issuer: 'https://accounts.google.com',
      expiresIn: 600,
      ...options,
    },
  );
}

describe('GoogleClientProvider.verifyIdToken', () => {
  it('validates a signed Google token for the configured audience', async () => {
    const ticket: Awaited<ReturnType<GoogleClientProvider['verifyIdToken']>> =
      await client.verifyIdToken({
        idToken: token(),
        audience: 'google-client',
      });

    expect(ticket.getPayload()).toMatchObject({ sub: 'google-subject' });
  });

  it.each([
    ['audience', { audience: 'another-app' }],
    ['issuer', { issuer: 'https://attacker.test' }],
    ['expiration', { expiresIn: -600 }],
  ])('rejects an invalid %s in 401', async (_label, options) => {
    await expect(
      client.verifyIdToken({
        idToken: token(options),
        audience: 'google-client',
      }),
    ).rejects.toMatchObject({
      status: 401,
      response: { code: ErrorCode.USER_INVALID_CREDENTIALS },
    });
  });

  it('rejects an invalid signature in 401 without exposing the token', async () => {
    const idToken: string = `${token().split('.').slice(0, 2).join('.')}.invalid`;

    await expect(
      client.verifyIdToken({ idToken, audience: 'google-client' }),
    ).rejects.toMatchObject({
      status: 401,
      response: { message: 'Jeton Google invalide ou expiré' },
    });
  });

  it('preserves certificate infrastructure failures', async () => {
    const outage: Error = new Error('certificate service unavailable');
    jest
      .spyOn(OAuth2Client.prototype, 'getFederatedSignonCertsAsync')
      .mockRejectedValue(outage);

    await expect(
      client.verifyIdToken({ idToken: token(), audience: 'google-client' }),
    ).rejects.toBe(outage);
  });
});
