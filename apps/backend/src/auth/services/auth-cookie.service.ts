import type { AuthResponse } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../../config/config.module';
import { REFRESH_TOKEN_TTL_SECONDS } from '../auth.constants';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_COOKIE_PATH,
  REFRESH_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_PATH,
} from '../auth-cookies';

const authenticationCookieMaxAgeMs: number = REFRESH_TOKEN_TTL_SECONDS * 1000;

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

  setAuthenticationCookies(
    response: Response,
    authentication: AuthResponse,
  ): void {
    response.cookie(ACCESS_TOKEN_COOKIE_NAME, authentication.access_token, {
      ...this.accessTokenCookieOptions,
      maxAge: authenticationCookieMaxAgeMs,
    });
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, authentication.refresh_token, {
      ...this.refreshTokenCookieOptions,
      maxAge: authenticationCookieMaxAgeMs,
    });
  }

  clearAuthenticationCookies(response: Response): void {
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
