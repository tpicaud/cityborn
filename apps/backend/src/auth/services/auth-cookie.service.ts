import type { AuthResponse, User } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import * as cookie from 'cookie';
import type { CookieOptions, Response } from 'express';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../../config/config.module';
import { REFRESH_TOKEN_TTL_SECONDS } from './auth-token.service';

export const ACCESS_TOKEN_COOKIE_NAME = 'cityborn_access_token';
export const REFRESH_TOKEN_COOKIE_NAME = 'cityborn_refresh_token';

const ACCESS_TOKEN_COOKIE_PATH = '/';
const REFRESH_TOKEN_COOKIE_PATH = '/auth';

const authenticationCookieMaxAgeMs: number = REFRESH_TOKEN_TTL_SECONDS * 1000;

function readCookie(
  cookieHeader: string | undefined,
  cookieName: string,
): string | undefined {
  if (cookieHeader === undefined) {
    return undefined;
  }
  return cookie.parseCookie(cookieHeader)[cookieName];
}

@Injectable()
export class AuthCookieService {
  private readonly accessTokenCookieOptions: CookieOptions;
  private readonly refreshTokenCookieOptions: CookieOptions;

  constructor(
    @Inject(RUNTIME_CONFIG) private readonly runtimeConfig: RuntimeConfig,
  ) {
    const cookieOptions: CookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.runtimeConfig.nodeEnvironment === 'production',
    };
    this.accessTokenCookieOptions = {
      ...cookieOptions,
      path: ACCESS_TOKEN_COOKIE_PATH,
    };
    this.refreshTokenCookieOptions = {
      ...cookieOptions,
      path: REFRESH_TOKEN_COOKIE_PATH,
    };
  }

  readAccessToken(cookieHeader: string | undefined): string | undefined {
    return readCookie(cookieHeader, ACCESS_TOKEN_COOKIE_NAME);
  }

  readRefreshToken(cookieHeader: string | undefined): string | undefined {
    return readCookie(cookieHeader, REFRESH_TOKEN_COOKIE_NAME);
  }

  hasAuthenticationCookie(cookieHeader: string | undefined): boolean {
    return (
      this.readAccessToken(cookieHeader) !== undefined ||
      this.readRefreshToken(cookieHeader) !== undefined
    );
  }

  establishSession(response: Response, authentication: AuthResponse): User {
    response.cookie(ACCESS_TOKEN_COOKIE_NAME, authentication.access_token, {
      ...this.accessTokenCookieOptions,
      maxAge: authenticationCookieMaxAgeMs,
    });
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, authentication.refresh_token, {
      ...this.refreshTokenCookieOptions,
      maxAge: authenticationCookieMaxAgeMs,
    });
    return authentication.user;
  }

  clearSession(response: Response): void {
    response.clearCookie(
      ACCESS_TOKEN_COOKIE_NAME,
      this.accessTokenCookieOptions,
    );
    response.clearCookie(
      REFRESH_TOKEN_COOKIE_NAME,
      this.refreshTokenCookieOptions,
    );
  }
}
