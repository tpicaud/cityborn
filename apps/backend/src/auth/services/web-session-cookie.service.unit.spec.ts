import type { AuthResponse, User } from '@cityborn/api';
import { buildUser } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { Response } from 'express';
import type { RuntimeConfig } from '../../config/config.module';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../auth.constants';
import { WebSessionCookieService } from './web-session-cookie.service';

function buildService(
  nodeEnvironment: RuntimeConfig['nodeEnvironment'],
): WebSessionCookieService {
  const runtimeConfig: RuntimeConfig = {
    nodeEnvironment,
    port: 4000,
  };
  return new WebSessionCookieService(runtimeConfig);
}

describe('WebSessionCookieService.setAuthenticationCookies', () => {
  it('sets production authentication cookies as HttpOnly, Secure and SameSite', () => {
    const response: DeepMocked<Response> = createMock<Response>();
    const user: User = buildUser();
    const authentication: AuthResponse = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      user,
    };
    const webSessionCookieService: WebSessionCookieService =
      buildService('production');

    webSessionCookieService.setAuthenticationCookies(response, authentication);

    expect(response.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE_NAME,
      'access-token',
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 15 * 60 * 1000,
      },
    );
    expect(response.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      'refresh-token',
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    );
  });
});

describe('WebSessionCookieService.clearAuthenticationCookies', () => {
  it('clears both cookies with their original attributes', () => {
    const response: DeepMocked<Response> = createMock<Response>();
    const webSessionCookieService: WebSessionCookieService =
      buildService('production');

    webSessionCookieService.clearAuthenticationCookies(response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE_NAME,
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      },
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE_NAME,
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
      },
    );
  });
});
