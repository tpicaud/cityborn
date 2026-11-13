import {
  AuthResponseSchema,
  buildUser,
  type ConfirmGoogleEmail,
  contract,
  ErrorCode,
  type GoogleEmailChallenge,
  GoogleEmailChallengeSchema,
  type User,
  UserSchema,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import {
  GOOGLE_IDENTITY_CLIENT,
  type GoogleIdentityClient,
} from '../../src/auth/identity-providers/google-client.provider';
import {
  type AuthTokenPair,
  AuthTokenService,
} from '../../src/auth/services/auth-token.service';
import { MailService } from '../../src/mail/mail.service';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../src/user/repositories/user.repository';
import { createTestApp } from '../support/createTestApp';

let app: NestExpressApplication;
let userRepository: UserRepository;
const googleClient: DeepMocked<GoogleIdentityClient> =
  createMock<GoogleIdentityClient>();
const mailService: DeepMocked<MailService> = createMock<MailService>();
const origin: string = 'http://localhost:3000';

beforeAll(async () => {
  app = await createTestApp((builder) => {
    builder.overrideProvider(GOOGLE_IDENTITY_CLIENT).useValue(googleClient);
    builder.overrideProvider(MailService).useValue(mailService);
  });
  userRepository = app.get(USER_REPOSITORY);
});
beforeEach(() => {
  googleClient.verifyIdToken.mockResolvedValue({
    getPayload: () => ({
      sub: 'google-subject',
      email: 'alice@gmail.com',
      email_verified: true,
    }),
  });
  mailService.sendMail.mockReset().mockResolvedValue(undefined);
});
afterAll(async () => {
  await app?.close();
});

function emailedCode(): string {
  const code: string | undefined =
    mailService.sendMail.mock.lastCall?.[0].text?.match(/\b\d{6}\b/)?.[0];
  if (!code) throw new Error('Missing confirmation code');
  return code;
}

describe('Google authentication over bearer HTTP', () => {
  it('associates an existing account only after email confirmation and rejects replay', async () => {
    const userData: User = buildUser({
      email: 'alice@gmail.com',
      isVerified: true,
    });
    const user: User = await userRepository.create({
      email: userData.email,
      username: userData.username,
      type: 'email',
      password: 'existing-hash',
      isVerified: true,
    });

    const refused: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signInWithGoogle.path)
      .send({ idToken: 'google-token' })
      .expect(401);
    expect(refused.body.code).toBe(ErrorCode.USER_GOOGLE_EMAIL_PROOF_REQUIRED);
    expect(refused.body).not.toHaveProperty('access_token');
    const requested: request.Response = await request(app.getHttpServer())
      .post(contract.auth.requestGoogleEmail.path)
      .send({ idToken: 'google-token' })
      .expect(200);
    const challenge: GoogleEmailChallenge = GoogleEmailChallengeSchema.parse(
      requested.body,
    );
    expect(requested.body).not.toHaveProperty('access_token');
    const confirmed: request.Response = await request(app.getHttpServer())
      .post(contract.auth.confirmGoogleEmail.path)
      .send({ challengeId: challenge.challengeId, code: emailedCode() })
      .expect(200);

    expect(AuthResponseSchema.parse(confirmed.body).user).toMatchObject({
      id: user.id,
      type: 'email',
    });
    expect(confirmed.headers['set-cookie']).toBeUndefined();
    expect(
      (await userRepository.findCredentialsById(user.id))?.passwordHash,
    ).toBe('existing-hash');
    await request(app.getHttpServer())
      .post(contract.auth.confirmGoogleEmail.path)
      .send({ challengeId: challenge.challengeId, code: emailedCode() })
      .expect(401);
    const reconnected: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signInWithGoogle.path)
      .send({ idToken: 'google-token' })
      .expect(200);
    expect(AuthResponseSchema.parse(reconnected.body).user.id).toBe(user.id);
  });
});

describe('Google authentication over cookie HTTP', () => {
  it('keeps cookies absent until proof succeeds and enforces the origin guard', async () => {
    const userData: User = buildUser({
      email: 'alice@gmail.com',
      isVerified: false,
    });
    const user: User = await userRepository.create({
      email: userData.email,
      username: userData.username,
      type: 'email',
      password: 'old-hash',
      isVerified: false,
    });
    const formerTokens: AuthTokenPair = await app
      .get(AuthTokenService)
      .issueTokenPair({ user, authVersion: 0 });
    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${formerTokens.access_token}`)
      .expect(200);
    const refused: request.Response = await request(app.getHttpServer())
      .post(contract.auth.cookie.signInWithGoogle.path)
      .set('Origin', origin)
      .send({ idToken: 'google-token' })
      .expect(401);
    expect(refused.headers['set-cookie']).toBeUndefined();
    const requested: request.Response = await request(app.getHttpServer())
      .post(contract.auth.requestGoogleEmail.path)
      .send({ idToken: 'google-token' })
      .expect(200);
    const challenge: GoogleEmailChallenge = GoogleEmailChallengeSchema.parse(
      requested.body,
    );
    const confirmation: ConfirmGoogleEmail = {
      challengeId: challenge.challengeId,
      code: emailedCode(),
    };
    await request(app.getHttpServer())
      .post(contract.auth.cookie.confirmGoogleEmail.path)
      .set('Origin', 'https://attacker.test')
      .send(confirmation)
      .expect(403);
    await request(app.getHttpServer())
      .post(contract.auth.cookie.confirmGoogleEmail.path)
      .set('Origin', origin)
      .send({ ...confirmation, code: '12' })
      .expect(400);

    const confirmed: request.Response = await request(app.getHttpServer())
      .post(contract.auth.cookie.confirmGoogleEmail.path)
      .set('Origin', origin)
      .send(confirmation)
      .expect(200);

    expect(UserSchema.parse(confirmed.body)).toMatchObject({
      id: user.id,
      isVerified: true,
      type: 'google',
    });
    expect(confirmed.body).not.toHaveProperty('access_token');
    expect(confirmed.headers['set-cookie']).toHaveLength(2);
    expect(
      (await userRepository.findCredentialsById(user.id))?.passwordHash,
    ).toBeNull();
    expect(
      (await userRepository.findAuthSessionById(user.id))?.authVersion,
    ).toBe(1);
    const replayed: request.Response = await request(app.getHttpServer())
      .post(contract.auth.cookie.confirmGoogleEmail.path)
      .set('Origin', origin)
      .send(confirmation)
      .expect(401);
    expect(replayed.headers['set-cookie']).toBeUndefined();
    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${formerTokens.access_token}`)
      .expect(401);
    await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${formerTokens.refresh_token}`)
      .send({})
      .expect(401);
  });
});
