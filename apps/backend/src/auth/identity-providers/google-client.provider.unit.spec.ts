import { generateKeyPairSync, type KeyObject } from 'node:crypto';
import { ErrorCode } from '@cityborn/api';
import { createMock } from '@golevelup/ts-jest';
import { Test, type TestingModule } from '@nestjs/testing';
import { OAuth2Client } from 'google-auth-library';
import { sign } from 'jsonwebtoken';
import { AUTH_CONFIG } from '../../config/config.module';
import {
  GOOGLE_IDENTITY_CLIENT,
  GoogleClientProvider,
  type GoogleIdentityClient,
} from './google-client.provider';

const {
  privateKey,
  publicKey,
}: { privateKey: KeyObject; publicKey: KeyObject } = generateKeyPairSync(
  'rsa',
  { modulusLength: 2048 },
);
const certificate: string = publicKey
  .export({ type: 'spki', format: 'pem' })
  .toString();
let testingModule: TestingModule;
let client: GoogleIdentityClient;

beforeEach(async () => {
  jest
    .spyOn(OAuth2Client.prototype, 'getFederatedSignonCertsAsync')
    .mockResolvedValue(
      createMock<
        Awaited<ReturnType<OAuth2Client['getFederatedSignonCertsAsync']>>
      >({ certs: { 'test-key': certificate } }),
    );
  testingModule = await Test.createTestingModule({
    providers: [
      GoogleClientProvider,
      { provide: AUTH_CONFIG, useValue: { googleClientId: 'google-client' } },
    ],
  }).compile();
  client = testingModule.get(GOOGLE_IDENTITY_CLIENT);
});

afterEach(async () => {
  await testingModule.close();
});

describe('GoogleIdentityClient.verifyIdToken', () => {
  it('verifies a Google signature and audience', async () => {
    const idToken: string = sign(
      { sub: 'google-user', email: 'alice@gmail.com', email_verified: true },
      privateKey,
      {
        algorithm: 'RS256',
        keyid: 'test-key',
        audience: 'google-client',
        issuer: 'https://accounts.google.com',
        expiresIn: '1h',
      },
    );

    const ticket: Awaited<ReturnType<GoogleIdentityClient['verifyIdToken']>> =
      await client.verifyIdToken({
        idToken,
        audience: 'google-client',
      });

    expect(ticket.getPayload()).toMatchObject({ sub: 'google-user' });
  });

  it.each([
    {
      audience: 'other-client',
      issuer: 'https://accounts.google.com',
      expiresIn: 3600,
    },
    {
      audience: 'google-client',
      issuer: 'https://attacker.test',
      expiresIn: 3600,
    },
    {
      audience: 'google-client',
      issuer: 'https://accounts.google.com',
      expiresIn: -3600,
    },
  ])(
    'rejects invalid claims with 401: %j',
    async ({ audience, issuer, expiresIn }) => {
      const idToken: string = sign({ sub: 'google-user' }, privateKey, {
        algorithm: 'RS256',
        keyid: 'test-key',
        audience,
        issuer,
        expiresIn,
      });

      await expect(
        client.verifyIdToken({ idToken, audience: 'google-client' }),
      ).rejects.toMatchObject({
        status: 401,
        response: { code: ErrorCode.USER_INVALID_TOKEN },
      });
    },
  );

  it('rejects an invalid signature with 401', async () => {
    const {
      privateKey: otherKey,
    }: { privateKey: KeyObject; publicKey: KeyObject } = generateKeyPairSync(
      'rsa',
      { modulusLength: 2048 },
    );
    const idToken: string = sign({ sub: 'google-user' }, otherKey, {
      algorithm: 'RS256',
      keyid: 'test-key',
      audience: 'google-client',
      issuer: 'https://accounts.google.com',
      expiresIn: '1h',
    });

    await expect(
      client.verifyIdToken({ idToken, audience: 'google-client' }),
    ).rejects.toMatchObject({ status: 401 });
  });

  it('preserves certificate infrastructure failures', async () => {
    const outage: Error = new Error('Certificate endpoint unavailable');
    jest
      .spyOn(OAuth2Client.prototype, 'getFederatedSignonCertsAsync')
      .mockRejectedValue(outage);

    await expect(
      client.verifyIdToken({ idToken: 'token', audience: 'google-client' }),
    ).rejects.toBe(outage);
  });
});
