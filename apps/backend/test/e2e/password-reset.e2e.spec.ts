import {
  AuthResponseSchema,
  buildUser,
  contract,
  ErrorCode,
  PASSWORD_RESET_REQUEST_MESSAGE,
  sessionWsEvent,
  type User,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { hash } from 'bcrypt';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import { MailService } from '../../src/mail/mail.service';
import type { SendMailOptions } from '../../src/mail/providers/mail.provider';
import { PrismaService } from '../../src/prisma/prisma.service';
import { createTestApp } from '../support/createTestApp';

describe('Password reset over HTTP and WebSocket', () => {
  let app: NestExpressApplication;
  let client: Socket | undefined;
  const mailService: DeepMocked<MailService> = createMock<MailService>();

  beforeAll(async () => {
    mailService.sendMail.mockResolvedValue(undefined);
    app = await createTestApp((builder) =>
      builder.overrideProvider(MailService).useValue(mailService),
    );
    await app.listen(0);
  });
  afterEach(() => {
    client?.disconnect();
  });
  afterAll(async () => {
    await app?.close();
  });

  it('changes a password without verification or automatic sign-in and revokes existing sessions', async () => {
    const user: User = buildUser({ isVerified: false });
    const prisma: PrismaService = app.get(PrismaService);
    await prisma.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        type: 'email',
        password: await hash('OldPass1', 10),
      },
    });
    const signInResponse = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password: 'OldPass1' })
      .expect(200);
    const session = AuthResponseSchema.parse(signInResponse.body);
    client = io(await app.getUrl(), {
      transports: ['websocket'],
      auth: { access_token: session.access_token },
    });
    const socket: Socket = client;
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', resolve);
      socket.once('connect_error', reject);
    });
    await new Promise<unknown>((resolve) =>
      socket.emit(
        sessionWsEvent.reconnect,
        { sessionID: 'missing', playerID: user.username },
        resolve,
      ),
    );
    const mail: Promise<SendMailOptions> = new Promise((resolve) => {
      mailService.sendMail.mockImplementationOnce(
        async (options: SendMailOptions) => {
          resolve(options);
        },
      );
    });

    await request(app.getHttpServer())
      .post(contract.auth.requestPasswordReset.path)
      .send({ email: user.email })
      .expect(200)
      .expect({ message: PASSWORD_RESET_REQUEST_MESSAGE });
    const options: SendMailOptions = await mail;
    const link: string = options.text?.match(/https?:\/\/[^\s]+/)?.[0] ?? '';
    const token: string =
      new URLSearchParams(new URL(link).hash.slice(1)).get('token') ?? '';
    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${session.access_token}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(contract.auth.validatePasswordResetToken.path)
      .send({ token })
      .expect(200);
    await request(app.getHttpServer())
      .post(contract.auth.validatePasswordResetToken.path)
      .send({ token })
      .expect(200);
    const disconnected: Promise<string> = new Promise((resolve) =>
      socket.once('disconnect', resolve),
    );
    await request(app.getHttpServer())
      .post(contract.auth.resetPassword.path)
      .send({ token, password: 'NewPass1', confirmPassword: 'NewPass1' })
      .expect(200)
      .expect({});

    expect(await disconnected).toBe('io server disconnect');
    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${session.access_token}`)
      .expect(401);
    await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${session.refresh_token}`)
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password: 'OldPass1' })
      .expect(401);
    const newSignIn = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password: 'NewPass1' })
      .expect(200);
    const newSession = AuthResponseSchema.parse(newSignIn.body);
    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${newSession.access_token}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${newSession.refresh_token}`)
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .post(contract.auth.resetPassword.path)
      .send({ token, password: 'AgainPass1', confirmPassword: 'AgainPass1' })
      .expect(401);
    expect(newSession.user.isVerified).toBe(false);
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Votre mot de passe Cityborn a été modifié',
      }),
    );
  });

  it.each([
    { password: 'short', confirmPassword: 'short' },
    { password: 'lowercase1', confirmPassword: 'lowercase1' },
    { password: 'NoDigits', confirmPassword: 'NoDigits' },
    { password: `A1${'a'.repeat(31)}`, confirmPassword: `A1${'a'.repeat(31)}` },
    { password: 'ValidPass1', confirmPassword: 'Different1' },
  ])(
    'rejects invalid password input before consuming a token',
    async (passwords) => {
      const response = await request(app.getHttpServer())
        .post(contract.auth.resetPassword.path)
        .send({ token: 'a'.repeat(64), ...passwords })
        .expect(400);

      expect(response.body).toMatchObject({ code: ErrorCode.BAD_REQUEST });
    },
  );

  it('applies the per-IP limit without disclosing unknown addresses', async () => {
    for (let index: number = 0; index < 5; index++) {
      await request(app.getHttpServer())
        .post(contract.auth.requestPasswordReset.path)
        .set('X-Forwarded-For', '192.0.2.1')
        .send({ email: 'missing@cityborn.test' })
        .expect(200)
        .expect({ message: PASSWORD_RESET_REQUEST_MESSAGE });
    }
    await request(app.getHttpServer())
      .post(contract.auth.requestPasswordReset.path)
      .set('X-Forwarded-For', '192.0.2.1')
      .send({ email: 'missing@cityborn.test' })
      .expect(429);
    await request(app.getHttpServer())
      .post(contract.auth.requestPasswordReset.path)
      .set('X-Forwarded-For', '192.0.2.2')
      .send({ email: 'missing@cityborn.test' })
      .expect(200);
  });
});
