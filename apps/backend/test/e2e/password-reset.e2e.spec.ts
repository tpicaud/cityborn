import { createHash } from 'node:crypto';
import {
  type AuthResponse,
  AuthResponseSchema,
  buildUser,
  contract,
  ErrorCode,
  PASSWORD_RESET_REQUEST_MESSAGE,
  type User,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { hash } from 'bcrypt';
import { io, type Socket } from 'socket.io-client';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import { MailService } from '../../src/mail/mail.service';
import type { SendMailOptions } from '../../src/mail/providers/mail.provider';
import { PrismaService } from '../../src/prisma/prisma.service';
import { SessionGateway } from '../../src/session/session.gateway';
import { createTestApp } from '../support/createTestApp';

describe('Password reset over HTTP and WebSocket', () => {
  let app: NestExpressApplication;
  let client: Socket | undefined;
  let connectedSocketId: string | undefined;
  const mailService: DeepMocked<MailService> = createMock<MailService>();

  async function waitForServerDisconnection(
    socketId: string,
    remainingAttempts: number,
  ): Promise<void> {
    const sessionGateway: SessionGateway = app.get(SessionGateway);
    if (!sessionGateway.io.sockets.sockets.has(socketId)) return;
    if (remainingAttempts === 0) {
      throw new Error(`Socket ${socketId} did not disconnect cleanly`);
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 10));
    await waitForServerDisconnection(socketId, remainingAttempts - 1);
  }

  beforeAll(async () => {
    mailService.sendMail.mockResolvedValue(undefined);
    app = await createTestApp((builder) =>
      builder.overrideProvider(MailService).useValue(mailService),
    );
    await app.listen(0);
  });
  afterEach(async () => {
    client?.disconnect();
    try {
      if (connectedSocketId)
        await waitForServerDisconnection(connectedSocketId, 100);
    } finally {
      client = undefined;
      connectedSocketId = undefined;
    }
  });
  afterAll(async () => {
    await app?.close();
  });

  it('changes a password without verification or automatic sign-in and revokes existing sessions', async () => {
    const user: User = buildUser({ isVerified: false });
    const prismaService: PrismaService = app.get(PrismaService);
    await prismaService.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        type: 'email',
        password: await hash('OldPass1', 10),
        isVerified: user.isVerified,
      },
    });
    const signInResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password: 'OldPass1' })
      .expect(200);
    const authResponse: AuthResponse = AuthResponseSchema.parse(
      signInResponse.body,
    );
    const webAgent: TestAgent = request.agent(app.getHttpServer());
    await webAgent
      .post(contract.auth.cookie.signIn.path)
      .set('Origin', 'http://localhost:3000')
      .send({ identifier: user.email, password: 'OldPass1' })
      .expect(200);
    await webAgent.get(contract.auth.me.path).expect(200);
    client = io(await app.getUrl(), {
      transports: ['websocket'],
      auth: { access_token: authResponse.access_token },
    });
    const socket: Socket = client;
    await new Promise<void>((resolve, reject) => {
      socket.once('connect', () => {
        connectedSocketId = socket.id;
        resolve();
      });
      socket.once('connect_error', reject);
    });
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
      .set('Authorization', `Bearer ${authResponse.access_token}`)
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
    const resetResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.resetPassword.path)
      .send({ token, password: 'NewPass1', confirmPassword: 'NewPass1' })
      .expect(200)
      .expect({});

    expect(await disconnected).toBe('io server disconnect');
    expect(resetResponse.headers['set-cookie']).toBeUndefined();
    expect(
      await prismaService.user.findUnique({ where: { id: user.id } }),
    ).toMatchObject({ authVersion: 1, isVerified: false });
    await webAgent.get(contract.auth.me.path).expect(401);
    await webAgent
      .post(contract.auth.cookie.refresh.path)
      .set('Origin', 'http://localhost:3000')
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${authResponse.access_token}`)
      .expect(401);
    await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${authResponse.refresh_token}`)
      .send({})
      .expect(401);
    await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password: 'OldPass1' })
      .expect(401);
    const newSignIn: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password: 'NewPass1' })
      .expect(200);
    const newAuthResponse: AuthResponse = AuthResponseSchema.parse(
      newSignIn.body,
    );
    await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${newAuthResponse.access_token}`)
      .expect(200);
    await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${newAuthResponse.refresh_token}`)
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .post(contract.auth.resetPassword.path)
      .send({ token, password: 'AgainPass1', confirmPassword: 'AgainPass1' })
      .expect(401);
    expect(newAuthResponse.user.isVerified).toBe(false);
    expect(mailService.sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: 'Votre mot de passe Cityborn a été modifié',
      }),
    );
  });

  it('rejects mismatched passwords without consuming a valid token', async () => {
    const user: User = buildUser({ isVerified: false });
    const prismaService: PrismaService = app.get(PrismaService);
    const resetToken: string = 'a'.repeat(64);
    const tokenHash: string = createHash('sha256')
      .update(resetToken)
      .digest('hex');
    await prismaService.user.create({
      data: {
        id: user.id,
        email: user.email,
        username: user.username,
        type: 'email',
        password: await hash('OldPass1', 10),
        isVerified: user.isVerified,
      },
    });
    await prismaService.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date('2099-01-01') },
    });

    const response: request.Response = await request(app.getHttpServer())
      .post(contract.auth.resetPassword.path)
      .send({
        token: resetToken,
        password: 'ValidPass1',
        confirmPassword: 'Different1',
      })
      .expect(400);

    expect(response.body).toMatchObject({ code: ErrorCode.BAD_REQUEST });
    await request(app.getHttpServer())
      .post(contract.auth.validatePasswordResetToken.path)
      .send({ token: resetToken })
      .expect(200);
  });

  it('applies the per-IP limit without disclosing unknown addresses', async () => {
    async function requestReset(remaining: number): Promise<void> {
      if (remaining === 0) return;
      await request(app.getHttpServer())
        .post(contract.auth.requestPasswordReset.path)
        .set('X-Forwarded-For', '192.0.2.1')
        .send({ email: 'missing@cityborn.test' })
        .expect(200)
        .expect({ message: PASSWORD_RESET_REQUEST_MESSAGE });
      await requestReset(remaining - 1);
    }
    await requestReset(5);
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
