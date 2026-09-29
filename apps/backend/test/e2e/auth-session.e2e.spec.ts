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
import { JwtService } from '@nestjs/jwt';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import type TestAgent from 'supertest/lib/agent';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../../src/auth/services/auth-cookie.service';
import { AUTH_CONFIG, type AuthConfig } from '../../src/config/config.module';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '../../src/user/repositories/user.repository';
import { createTestApp } from '../support/createTestApp';

function responseCookies(header: string | string[] | undefined): string[] {
  if (header === undefined) {
    return [];
  }
  return Array.isArray(header) ? header : [header];
}

describe('Authentication transports', () => {
  let app: NestExpressApplication;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let authConfig: AuthConfig;

  beforeAll(async () => {
    app = await createTestApp();
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

  it('runs the cookie sign-in, current user, refresh and sign-out flow with HttpOnly cookies', async () => {
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
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);

    const signInResponse: request.Response = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password })
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
});
