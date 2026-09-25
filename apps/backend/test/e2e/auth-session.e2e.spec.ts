import {
  ApiErrorSchema,
  AuthResponseSchema,
  buildUser,
  contract,
  ErrorCode,
  type User,
  UserSchema,
} from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
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

  beforeAll(async () => {
    app = await createTestApp();
    userRepository = app.get(USER_REPOSITORY);
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

  it('runs the web sign-in, current user, refresh and sign-out flow with HttpOnly cookies', async () => {
    const password = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);
    const origin = 'http://localhost:3000';
    const webAgent = request.agent(app.getHttpServer());

    const signInResponse = await webAgent
      .post(contract.auth.webSignIn.path)
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
        expect.stringContaining('access_token='),
        expect.stringContaining('refresh_token='),
      ]),
    );
    expect(
      signInCookies.every(
        (cookie: string): boolean =>
          cookie.includes('HttpOnly') && cookie.includes('SameSite=Lax'),
      ),
    ).toBe(true);

    const currentUserResponse = await webAgent
      .get(contract.auth.webMe.path)
      .expect(200);
    const currentUser: User = UserSchema.parse(currentUserResponse.body);
    expect(currentUser.id).toBe(user.id);

    const refreshResponse = await webAgent
      .post(contract.auth.webRefresh.path)
      .set('Origin', origin)
      .send({})
      .expect(200);
    const refreshedUser: User = UserSchema.parse(refreshResponse.body);
    const refreshedCookies: string[] = responseCookies(
      refreshResponse.headers['set-cookie'],
    );
    expect(refreshedUser.id).toBe(user.id);
    expect(refreshedCookies).toHaveLength(2);

    const signOutResponse = await webAgent
      .post(contract.auth.webSignOut.path)
      .set('Origin', origin)
      .send({})
      .expect(200);
    const clearedCookies: string[] = responseCookies(
      signOutResponse.headers['set-cookie'],
    );
    expect(clearedCookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining('access_token=;'),
        expect.stringContaining('refresh_token=;'),
      ]),
    );

    await webAgent.get(contract.auth.webMe.path).expect(401);
  });

  it('rejects a cookie-authenticated mutation without an allowed origin', async () => {
    const password = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);
    const webAgent = request.agent(app.getHttpServer());

    await webAgent
      .post(contract.auth.webSignIn.path)
      .set('Origin', 'http://localhost:3000')
      .send({ identifier: user.email, password })
      .expect(200);

    const response = await webAgent
      .post(contract.auth.webRefresh.path)
      .send({})
      .expect(403);
    const error = ApiErrorSchema.parse(response.body);
    expect(error.code).toBe(ErrorCode.CSRF_ORIGIN_FORBIDDEN);
  });

  it('keeps the legacy mobile bearer contract without setting cookies', async () => {
    const password = 'Password1';
    const userData: User = buildUser();
    const user: User = await persistEmailUser(userData, password);

    const signInResponse = await request(app.getHttpServer())
      .post(contract.auth.signIn.path)
      .send({ identifier: user.email, password })
      .expect(200);
    const authentication = AuthResponseSchema.parse(signInResponse.body);
    expect(signInResponse.headers['set-cookie']).toBeUndefined();

    const currentUserResponse = await request(app.getHttpServer())
      .get(contract.auth.me.path)
      .set('Authorization', `Bearer ${authentication.access_token}`)
      .expect(200);
    const currentUser: User = UserSchema.parse(currentUserResponse.body);
    expect(currentUser.id).toBe(user.id);
  });
});
