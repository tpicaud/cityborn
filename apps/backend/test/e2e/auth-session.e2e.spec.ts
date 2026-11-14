import {
  type ApiError,
  ApiErrorSchema,
  type AuthResponse,
  AuthResponseSchema,
  buildUser,
  contract,
  ErrorCode,
  type User,
  UserSchema,
} from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import { IdentityTokenService } from '../../src/auth/identity-providers/identity-token.service';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../../src/auth/services/auth-cookie.service';
import { AUTH_CONFIG, type AuthConfig } from '../../src/config/config.module';
import { MailService } from '../../src/mail/mail.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../src/user/repositories/user.repository';
import { createTestApp } from '../support/createTestApp';

type EmailAuthenticationMethod = 'google' | 'apple' | 'password' | 'signup';

function responseCookies(header: string | string[] | undefined): string[] {
  if (header === undefined) {
    return [];
  }
  return Array.isArray(header) ? header : [header];
}

describe('Authentication transports', () => {
  let app: NestExpressApplication;
  const identityTokenService: DeepMocked<IdentityTokenService> =
    createMock<IdentityTokenService>();
  const mailService: DeepMocked<MailService> = createMock<MailService>();
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let authConfig: AuthConfig;

  beforeAll(async () => {
    app = await createTestApp((builder) =>
      builder
        .overrideProvider(IdentityTokenService)
        .useValue(identityTokenService)
        .overrideProvider(MailService)
        .useValue(mailService),
    );
    userRepository = app.get(USER_REPOSITORY);
    jwtService = app.get(JwtService);
    authConfig = app.get<AuthConfig>(AUTH_CONFIG);
  });

  afterAll(async () => {
    await app?.close();
  });

  async function persistEmailUser(user: User, password: string): Promise<User> {
    const passwordHash: string = await bcrypt.hash(password, 4);
    return await userRepository.create({
      email: user.email,
      username: user.username,
      type: 'email',
      password: passwordHash,
      isVerified: user.isVerified,
    });
  }

  it.each(['google', 'apple'])(
    'matches a legacy mixed-case account during %s sign-in',
    async (provider: string) => {
      const user: User = buildUser({
        email: 'Alice@Example.com',
        isVerified: true,
      });
      const prismaService: PrismaService = app.get(PrismaService);
      await prismaService.user.create({
        data: {
          id: user.id,
          type: user.type,
          email: user.email,
          username: user.username,
          isVerified: true,
        },
      });
      identityTokenService.verifyGoogleIdToken.mockResolvedValue({
        email: 'ALICE@EXAMPLE.COM',
        name: 'Alice',
      });
      identityTokenService.verifyAppleIdToken.mockResolvedValue({
        appleUserId: 'new-apple-id',
        verifiedEmail: 'ALICE@EXAMPLE.COM',
      });
      const path: string =
        provider === 'google'
          ? contract.auth.signInWithGoogle.path
          : contract.auth.signInWithApple.path;
      const body: object =
        provider === 'google'
          ? { idToken: 'google-token' }
          : {
              identity_token: 'apple-token',
              apple_user_id: 'new-apple-id',
              details: {
                email: 'alice@example.com',
                given_name: 'Alice',
                family_name: 'Example',
              },
            };

      const response: request.Response = await request(app.getHttpServer())
        .post(path)
        .send(body)
        .expect(200);
      const authResponse: AuthResponse = AuthResponseSchema.parse(
        response.body,
      );

      expect(authResponse.user.id).toBe(user.id);
      expect(authResponse.user.email).toBe('Alice@Example.com');
      expect(await prismaService.user.count()).toBe(1);
    },
  );

  it.each<EmailAuthenticationMethod>(['google', 'apple', 'password', 'signup'])(
    'refuses legacy email collisions during %s authentication without selecting an account',
    async (provider: EmailAuthenticationMethod) => {
      const prismaService: PrismaService = app.get(PrismaService);
      await prismaService.user.create({
        data: {
          type: 'email',
          email: 'Alice@Example.com',
          username: 'ALICE@EXAMPLE.COM',
          password: await bcrypt.hash('Password1', 4),
        },
      });
      await prismaService.user.create({
        data: {
          type: 'email',
          email: 'alice@example.com',
          username: 'second',
          password: await bcrypt.hash('Password1', 4),
        },
      });
      identityTokenService.verifyGoogleIdToken.mockResolvedValue({
        email: 'ALICE@EXAMPLE.COM',
        name: 'Alice',
      });
      identityTokenService.verifyAppleIdToken.mockResolvedValue({
        appleUserId: 'new-apple-id',
        verifiedEmail: 'ALICE@EXAMPLE.COM',
      });
      const paths: Record<EmailAuthenticationMethod, string> = {
        google: contract.auth.signInWithGoogle.path,
        apple: contract.auth.signInWithApple.path,
        password: contract.auth.signIn.path,
        signup: contract.auth.signUp.path,
      };
      const bodies: Record<EmailAuthenticationMethod, object> = {
        google: { idToken: 'google-token' },
        apple: {
          identity_token: 'apple-token',
          apple_user_id: 'new-apple-id',
          details: {
            email: 'alice@example.com',
            given_name: 'Alice',
            family_name: 'Example',
          },
        },
        password: { identifier: 'ALICE@EXAMPLE.COM', password: 'Password1' },
        signup: {
          email: 'ALICE@EXAMPLE.COM',
          username: 'newuser',
          password: 'Password1',
          confirmPassword: 'Password1',
        },
      };

      const response: request.Response = await request(app.getHttpServer())
        .post(paths[provider])
        .send(bodies[provider])
        .expect(409);
      const error: ApiError = ApiErrorSchema.parse(response.body);

      expect(error.code).toBe(ErrorCode.USER_EMAIL_ALREADY_TAKEN);
      expect(await prismaService.user.count()).toBe(2);
      expect(
        await prismaService.user.count({ where: { isVerified: true } }),
      ).toBe(0);
      expect(
        await prismaService.user.count({ where: { appleId: { not: null } } }),
      ).toBe(0);
      expect(mailService.sendMail).not.toHaveBeenCalled();
    },
  );

  it('rejects a signup using the case variant of a legacy email', async () => {
    const prismaService: PrismaService = app.get(PrismaService);
    await prismaService.user.create({
      data: { email: 'Alice@Example.com', username: 'alice' },
    });

    await request(app.getHttpServer())
      .post(contract.auth.signUp.path)
      .send({
        email: 'alice@example.com',
        username: 'other',
        password: 'Password1',
        confirmPassword: 'Password1',
      })
      .expect(409);

    expect(await prismaService.user.count()).toBe(1);
  });

  it('runs the cookie sign-in, current user, refresh and sign-out flow with HttpOnly cookies', async () => {
    const password: string = 'Password1';
    await persistEmailUser(
      buildUser({ email: 'alice@ex.com', username: 'emailowner' }),
      'OtherPassword1',
    );
    const userData: User = buildUser({
      email: 'other@ex.com',
      username: 'ALICE@EX.COM',
    });
    const user: User = await persistEmailUser(userData, password);
    const origin: string = 'http://localhost:3000';
    const webAgent: TestAgent = request.agent(app.getHttpServer());

    const signInResponse: request.Response = await webAgent
      .post(contract.auth.cookie.signIn.path)
      .set('Origin', origin)
      .send({ identifier: user.email, password })
      .expect(200);

    const signInBody: User = UserSchema.parse(signInResponse.body);
    const signInCookies: string[] = responseCookies(
      signInResponse.headers['set-cookie'],
    );
    expect(signInBody.id).toBe(user.id);
    expect(signInResponse.body).not.toHaveProperty('access_token');
    expect(signInResponse.body).not.toHaveProperty('refresh_token');
    expect(signInCookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${ACCESS_TOKEN_COOKIE_NAME}=`),
        expect.stringContaining(`${REFRESH_TOKEN_COOKIE_NAME}=`),
      ]),
    );
    expect(
      signInCookies.every(
        (cookie: string): boolean =>
          cookie.includes('HttpOnly') && cookie.includes('SameSite=Lax'),
      ),
    ).toBe(true);

    const currentUserResponse: request.Response = await webAgent
      .get(contract.auth.me.path)
      .expect(200);
    const currentUser: User = UserSchema.parse(currentUserResponse.body);
    expect(currentUser.id).toBe(user.id);

    const refreshResponse: request.Response = await webAgent
      .post(contract.auth.cookie.refresh.path)
      .set('Origin', origin)
      .send({})
      .expect(200);
    const refreshedUser: User = UserSchema.parse(refreshResponse.body);
    const refreshedCookies: string[] = responseCookies(
      refreshResponse.headers['set-cookie'],
    );
    expect(refreshedUser.id).toBe(user.id);
    expect(refreshedCookies).toHaveLength(2);

    const signOutResponse: request.Response = await webAgent
      .post(contract.auth.signOut.path)
      .set('Origin', origin)
      .send({})
      .expect(200);
    const clearedCookies: string[] = responseCookies(
      signOutResponse.headers['set-cookie'],
    );
    expect(clearedCookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${ACCESS_TOKEN_COOKIE_NAME}=;`),
        expect.stringContaining(`${REFRESH_TOKEN_COOKIE_NAME}=;`),
      ]),
    );

    await webAgent.get(contract.auth.me.path).expect(401);
  });

  it('rejects a cookie-authenticated mutation without an allowed origin', async () => {
    const password: string = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);
    const webAgent: TestAgent = request.agent(app.getHttpServer());

    await webAgent
      .post(contract.auth.cookie.signIn.path)
      .set('Origin', 'http://localhost:3000')
      .send({ identifier: user.email, password })
      .expect(200);

    const response: request.Response = await webAgent
      .post(contract.auth.cookie.refresh.path)
      .send({})
      .expect(403);
    const error: ApiError = ApiErrorSchema.parse(response.body);
    expect(error.code).toBe(ErrorCode.CSRF_ORIGIN_FORBIDDEN);
  });

  it('rejects a cookie sign-in from an unauthorized origin', async () => {
    const password: string = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);

    const response: request.Response = await request(app.getHttpServer())
      .post(contract.auth.cookie.signIn.path)
      .set('Origin', 'https://attacker.test')
      .send({ identifier: user.email, password })
      .expect(403);
    const error: ApiError = ApiErrorSchema.parse(response.body);
    expect(error.code).toBe(ErrorCode.CSRF_ORIGIN_FORBIDDEN);
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('rejects a cookie sign-in without origin whatever its request path spelling', async () => {
    const password: string = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);

    const response: request.Response = await request(app.getHttpServer())
      .post(`${contract.auth.cookie.signIn.path}/`)
      .type('form')
      .send({ identifier: user.email, password })
      .expect(403);
    const error: ApiError = ApiErrorSchema.parse(response.body);
    expect(error.code).toBe(ErrorCode.CSRF_ORIGIN_FORBIDDEN);
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('rejects a sign-out from an unauthorized origin without clearing cookies', async () => {
    const response: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signOut.path)
      .set('Origin', 'https://attacker.test')
      .type('form')
      .send({})
      .expect(403);
    const error: ApiError = ApiErrorSchema.parse(response.body);
    expect(error.code).toBe(ErrorCode.CSRF_ORIGIN_FORBIDDEN);
    expect(response.headers['set-cookie']).toBeUndefined();
  });

  it('reports an expired cookie access token as expired so the browser can refresh', async () => {
    const password: string = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);
    const expiredAccessToken: string = await jwtService.signAsync(
      { id: user.id, authVersion: 0 },
      { secret: authConfig.jwtAccessSecret, expiresIn: -60 },
    );

    const response: request.Response = await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Cookie', `${ACCESS_TOKEN_COOKIE_NAME}=${expiredAccessToken}`)
      .expect(401);
    const error: ApiError = ApiErrorSchema.parse(response.body);
    expect(error.code).toBe(ErrorCode.TOKEN_EXPIRED);
  });

  it('never exposes cookie tokens through the bearer refresh route', async () => {
    const password: string = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);
    const origin: string = 'http://localhost:3000';
    const webAgent: TestAgent = request.agent(app.getHttpServer());

    await webAgent
      .post(contract.auth.cookie.signIn.path)
      .set('Origin', origin)
      .send({ identifier: user.email, password })
      .expect(200);

    const response: request.Response = await webAgent
      .post(contract.auth.refresh.path)
      .set('Origin', origin)
      .send({})
      .expect(401);
    expect(response.body).not.toHaveProperty('access_token');
    expect(response.body).not.toHaveProperty('refresh_token');
  });

  it('rotates cookies on a cookie password update and keeps the browser session', async () => {
    const password: string = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);
    const origin: string = 'http://localhost:3000';
    const webAgent: TestAgent = request.agent(app.getHttpServer());

    await webAgent
      .post(contract.auth.cookie.signIn.path)
      .set('Origin', origin)
      .send({ identifier: user.email, password })
      .expect(200);

    const updatePasswordResponse: request.Response = await webAgent
      .patch(contract.auth.cookie.updatePassword.path)
      .set('Origin', origin)
      .send({ currentPassword: password, newPassword: 'Password2' })
      .expect(200);
    const updatedUser: User = UserSchema.parse(updatePasswordResponse.body);
    const rotatedCookies: string[] = responseCookies(
      updatePasswordResponse.headers['set-cookie'],
    );
    expect(updatedUser.id).toBe(user.id);
    expect(updatePasswordResponse.body).not.toHaveProperty('access_token');
    expect(updatePasswordResponse.body).not.toHaveProperty('refresh_token');
    expect(rotatedCookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${ACCESS_TOKEN_COOKIE_NAME}=`),
        expect.stringContaining(`${REFRESH_TOKEN_COOKIE_NAME}=`),
      ]),
    );

    await webAgent.get(contract.auth.me.path).expect(200);
    await webAgent
      .post(contract.auth.cookie.refresh.path)
      .set('Origin', origin)
      .send({})
      .expect(200);
  });

  it('never exposes cookie tokens through the bearer password route', async () => {
    const password: string = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);
    const origin: string = 'http://localhost:3000';
    const webAgent: TestAgent = request.agent(app.getHttpServer());

    await webAgent
      .post(contract.auth.cookie.signIn.path)
      .set('Origin', origin)
      .send({ identifier: user.email, password })
      .expect(200);

    const response: request.Response = await webAgent
      .patch(contract.auth.updatePassword.path)
      .set('Origin', origin)
      .send({ currentPassword: password, newPassword: 'Password2' })
      .expect(401);
    expect(response.body).not.toHaveProperty('access_token');
    expect(response.body).not.toHaveProperty('refresh_token');
  });

  it('keeps the legacy mobile bearer contract without setting cookies', async () => {
    const password: string = 'Password1';
    await persistEmailUser(
      buildUser({ email: 'other@ex.com', username: 'ALICE@EX.COM' }),
      'OtherPassword1',
    );
    const userData: User = buildUser({
      email: 'alice@ex.com',
      username: 'emailowner',
    });
    const user: User = await persistEmailUser(userData, password);

    const signInResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email.toUpperCase(), password })
      .expect(200);
    const authentication: AuthResponse = AuthResponseSchema.parse(
      signInResponse.body,
    );
    expect(signInResponse.headers['set-cookie']).toBeUndefined();

    const currentUserResponse: request.Response = await request(
      app.getHttpServer(),
    )
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${authentication.access_token}`)
      .expect(200);
    const currentUser: User = UserSchema.parse(currentUserResponse.body);
    expect(currentUser.id).toBe(user.id);
  });

  it('rotates the bearer refresh token and rejects a reused one', async () => {
    const password: string = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);
    const signInResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password })
      .expect(200);
    const authentication: AuthResponse = AuthResponseSchema.parse(
      signInResponse.body,
    );

    const refreshResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${authentication.refresh_token}`)
      .send({})
      .expect(200);
    const rotatedAuthentication: AuthResponse = AuthResponseSchema.parse(
      refreshResponse.body,
    );

    expect(rotatedAuthentication.refresh_token).not.toBe(
      authentication.refresh_token,
    );
    const reuseResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${authentication.refresh_token}`)
      .send({})
      .expect(401);
    expect(ApiErrorSchema.parse(reuseResponse.body).code).toBe(
      ErrorCode.USER_INVALID_TOKEN,
    );
    await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${rotatedAuthentication.refresh_token}`)
      .send({})
      .expect(200);
  });

  it('revokes the bearer refresh token on sign-out', async () => {
    const password: string = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);
    const signInResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password })
      .expect(200);
    const authentication: AuthResponse = AuthResponseSchema.parse(
      signInResponse.body,
    );

    await request(app.getHttpServer())
      .post(contract.auth.signOut.path)
      .set('Authorization', `Bearer ${authentication.refresh_token}`)
      .send({})
      .expect(200);

    const refreshResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.refresh.path)
      .set('Authorization', `Bearer ${authentication.refresh_token}`)
      .send({})
      .expect(401);
    expect(ApiErrorSchema.parse(refreshResponse.body).code).toBe(
      ErrorCode.USER_INVALID_TOKEN,
    );
  });

  it('revokes the cookie refresh token on sign-out', async () => {
    const password: string = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);
    const origin: string = 'http://localhost:3000';
    const webAgent: TestAgent = request.agent(app.getHttpServer());
    const signInResponse: request.Response = await webAgent
      .post(contract.auth.cookie.signIn.path)
      .set('Origin', origin)
      .send({ identifier: user.email, password })
      .expect(200);
    const refreshTokenCookie: string | undefined = responseCookies(
      signInResponse.headers['set-cookie'],
    )
      .find((cookie: string): boolean =>
        cookie.startsWith(`${REFRESH_TOKEN_COOKIE_NAME}=`),
      )
      ?.split(';')[0];
    expect(refreshTokenCookie).toBeDefined();

    await webAgent
      .post(contract.auth.signOut.path)
      .set('Origin', origin)
      .send({})
      .expect(200);

    const refreshResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.cookie.refresh.path)
      .set('Origin', origin)
      .set('Cookie', refreshTokenCookie ?? '')
      .send({})
      .expect(401);
    expect(ApiErrorSchema.parse(refreshResponse.body).code).toBe(
      ErrorCode.USER_INVALID_TOKEN,
    );
  });

  it('blocks password sign-in after repeated failures on the same account', async () => {
    const password: string = 'Password1';
    const user: User = await persistEmailUser(buildUser(), password);
    const failedAttemptCount: number = 10;

    await Promise.all(
      Array.from({ length: failedAttemptCount }, () =>
        request(app.getHttpServer())
          .post(contract.auth.signIn.path)
          .send({ identifier: user.email, password: 'WrongPassword1' })
          .expect(401),
      ),
    );

    const blockedResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.username, password })
      .expect(429);
    expect(ApiErrorSchema.parse(blockedResponse.body).code).toBe(
      ErrorCode.RATE_LIMIT_EXCEEDED,
    );
  });
});
