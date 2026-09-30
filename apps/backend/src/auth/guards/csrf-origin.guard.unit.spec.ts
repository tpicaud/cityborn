import { contract, ErrorCode } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import { type ExecutionContext, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { type AppRoute, initContract } from '@ts-rest/core';
import { TsRestAppRouteMetadataKey } from '@ts-rest/nest';
import type { Request } from 'express';
import type { HttpConfig, RuntimeConfig } from '../../config/config.module';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  AuthCookieService,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../services/auth-cookie.service';
import { CsrfOriginGuard } from './csrf-origin.guard';

const httpConfig: HttpConfig = {
  corsOrigins: ['https://cityborn.test', 'https://admin.cityborn.test'],
  frontendUrl: 'https://cityborn.test',
};

const runtimeConfig: RuntimeConfig = {
  nodeEnvironment: 'production',
  port: 4000,
};

interface RequestInput {
  method: string;
  path: string;
  headers: Request['headers'];
  appRoute?: AppRoute;
}

function buildHandler(appRoute: AppRoute | undefined): () => void {
  const handler: () => void = (): void => {};
  if (appRoute === undefined) {
    return handler;
  }
  SetMetadata(TsRestAppRouteMetadataKey, { appRoute, routeKey: null })(handler);
  return handler;
}

function buildContext({
  method,
  path,
  headers,
  appRoute,
}: RequestInput): DeepMocked<ExecutionContext> {
  const request: DeepMocked<Request> = createMock<Request>({
    method,
    path,
    headers,
  });
  const context: DeepMocked<ExecutionContext> = createMock<ExecutionContext>();
  context.switchToHttp().getRequest.mockReturnValue(request);
  context.getHandler.mockReturnValue(buildHandler(appRoute));
  return context;
}

function buildGuard(): CsrfOriginGuard {
  return new CsrfOriginGuard(
    httpConfig,
    new Reflector(),
    new AuthCookieService(runtimeConfig),
  );
}

function expectCsrfRejection(context: ExecutionContext): void {
  expect(() => buildGuard().canActivate(context)).toThrow(
    expect.objectContaining({
      response: expect.objectContaining({
        code: ErrorCode.CSRF_ORIGIN_FORBIDDEN,
      }),
    }),
  );
}

describe('CsrfOriginGuard.canActivate', () => {
  it('allows safe requests authenticated by cookies', () => {
    const context: DeepMocked<ExecutionContext> = buildContext({
      method: 'GET',
      path: '/auth/me',
      headers: { cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token` },
      appRoute: contract.auth.me,
    });

    expect(buildGuard().canActivate(context)).toBe(true);
  });

  it('allows bearer mutations without origin', () => {
    const context: DeepMocked<ExecutionContext> = buildContext({
      method: 'POST',
      path: '/session',
      headers: { authorization: 'Bearer access-token' },
    });

    expect(buildGuard().canActivate(context)).toBe(true);
  });

  it('allows bearer sign-in without origin', () => {
    const context: DeepMocked<ExecutionContext> = buildContext({
      method: 'POST',
      path: '/auth/sign-in',
      headers: {},
      appRoute: contract.auth.signIn,
    });

    expect(buildGuard().canActivate(context)).toBe(true);
  });

  it('allows cookie mutations from an authorized origin', () => {
    const context: DeepMocked<ExecutionContext> = buildContext({
      method: 'POST',
      path: '/session',
      headers: {
        cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token`,
        origin: 'https://cityborn.test',
      },
    });

    expect(buildGuard().canActivate(context)).toBe(true);
  });

  it.each([
    ['a missing origin', undefined],
    ['an unauthorized origin', 'https://attacker.test'],
  ])('rejects cookie mutations from %s', (_label, origin) => {
    const headers: Request['headers'] = {
      cookie: `${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`,
    };
    if (origin !== undefined) {
      headers.origin = origin;
    }

    expectCsrfRejection(
      buildContext({
        method: 'POST',
        path: '/auth/cookie/refresh',
        headers,
        appRoute: contract.auth.cookie.refresh,
      }),
    );
  });

  it.each([
    '/auth/cookie/sign-in',
    '/auth/cookie/sign-in/',
    '/AUTH/COOKIE/SIGN-IN',
  ])('rejects cookie sign-in reached through %s without origin', (path) => {
    expectCsrfRejection(
      buildContext({
        method: 'POST',
        path,
        headers: {},
        appRoute: contract.auth.cookie.signIn,
      }),
    );
  });

  it('rejects a cookie route regrouped by a controller router without origin', () => {
    const regroupedCookieSignIn: AppRoute = initContract().router({
      signIn: contract.auth.cookie.signIn,
    }).signIn;

    expectCsrfRejection(
      buildContext({
        method: 'POST',
        path: '/auth/cookie/sign-in',
        headers: {},
        appRoute: regroupedCookieSignIn,
      }),
    );
  });

  it('rejects mutations without cookies from an unauthorized origin', () => {
    expectCsrfRejection(
      buildContext({
        method: 'POST',
        path: '/auth/sign-out',
        headers: { origin: 'https://attacker.test' },
        appRoute: contract.auth.signOut,
      }),
    );
  });
});
