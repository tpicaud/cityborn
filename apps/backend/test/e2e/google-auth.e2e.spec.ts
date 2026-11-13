import {
  type AuthResponse,
  AuthResponseSchema,
  buildUser,
  contract,
  type User,
  UserSchema,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { hash } from 'bcrypt';
import request from 'supertest';
import {
  GOOGLE_IDENTITY_CLIENT,
  type GoogleIdentityClient,
  type GoogleIdentityPayload,
} from '../../src/auth/identity-providers/google-client.provider';
import { MailService } from '../../src/mail/mail.service';
import type { SendMailOptions } from '../../src/mail/providers/mail.provider';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../support/createTestApp';

let app: NestExpressApplication;
let prisma: PrismaService;
let code: string;
const mail: DeepMocked<MailService> = createMock<MailService>();
const google: DeepMocked<GoogleIdentityClient> =
  createMock<GoogleIdentityClient>();
let payload: GoogleIdentityPayload;

beforeAll(async () => {
  app = await createTestApp((builder) => {
    builder.overrideProvider(MailService).useValue(mail);
    builder.overrideProvider(GOOGLE_IDENTITY_CLIENT).useValue(google);
  });
  prisma = app.get(PrismaService);
});
beforeEach(() => {
  payload = {
    sub: 'google-1',
    email: 'alice@gmail.com',
    email_verified: true,
    exp: Math.floor(Date.now() / 1000) + 3600,
  };
  google.verifyIdToken.mockImplementation(async () => ({
    getPayload: () => payload,
  }));
  mail.sendMail.mockImplementation(
    async (options: SendMailOptions): Promise<void> => {
      const match: RegExpMatchArray | null =
        options.text?.match(/\b\d{8}\b/) ?? null;
      if (!match) throw new Error('Missing email code');
      code = match[0];
    },
  );
});
afterAll(async () => {
  await app?.close();
});

describe('Google authentication over HTTP', () => {
  it('confirms ownership before reclaiming an account and revokes its earlier sessions', async () => {
    const user: User = buildUser({
      email: 'alice@gmail.com',
      isVerified: false,
    });
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        type: 'email',
        password: await hash('Password1', 4),
        isVerified: false,
      },
    });
    await prisma.emailVerificationToken.create({
      data: {
        token: 'old-verification',
        email: user.email,
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: 'old-reset',
        userId: user.id,
        expiresAt: new Date(Date.now() + 3600000),
      },
    });
    const oldSignIn: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password: 'Password1' })
      .expect(200);
    const oldSession: AuthResponse = AuthResponseSchema.parse(oldSignIn.body);

    await request(app.getHttpServer())
      .post(contract.auth.signInWithGoogle.path)
      .send({ idToken: 'google-token' })
      .expect(401);
    await request(app.getHttpServer())
      .post(contract.auth.requestGoogleEmailVerification.path)
      .send({ idToken: 'google-token' })
      .expect(200)
      .expect({ required: true });
    await request(app.getHttpServer())
      .post(contract.auth.cookie.signInWithGoogle.path)
      .set('Origin', 'http://localhost:3000')
      .send({ idToken: 'google-token', emailVerificationCode: '00000000' })
      .expect(401);
    const signedIn: request.Response = await request(app.getHttpServer())
      .post(contract.auth.cookie.signInWithGoogle.path)
      .set('Origin', 'http://localhost:3000')
      .send({ idToken: 'google-token', emailVerificationCode: code })
      .expect(200);

    expect(UserSchema.parse(signedIn.body)).toMatchObject({
      id: user.id,
      isVerified: true,
      type: 'google',
    });
    expect(signedIn.headers['set-cookie']).toBeDefined();
    expect(
      await prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
    ).toMatchObject({ googleId: 'google-1', password: null, authVersion: 1 });
    expect(await prisma.emailVerificationToken.count()).toBe(0);
    expect(await prisma.passwordResetToken.count()).toBe(0);
    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${oldSession.access_token}`)
      .expect(401);
    await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${oldSession.refresh_token}`)
      .send({})
      .expect(401);
  });

  it('never selects a different account by username', async () => {
    const user: User = buildUser({ email: 'other@external.test' });
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: 'alice@gmail.com',
        type: 'email',
        isVerified: true,
      },
    });

    const signedIn: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signInWithGoogle.path)
      .send({ idToken: 'google-token' })
      .expect(200);

    const auth: AuthResponse = AuthResponseSchema.parse(signedIn.body);
    expect(auth.user.id).not.toBe(user.id);
    expect(auth.user.username).toMatch(/^joueur\d{4}$/);
    expect(auth.user.email).toBe('alice@gmail.com');
    expect(await prisma.user.count()).toBe(2);
  });
});
