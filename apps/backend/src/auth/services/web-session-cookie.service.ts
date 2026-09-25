import type { AuthResponse } from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import type { CookieOptions, Response } from 'express';
import { RUNTIME_CONFIG, type RuntimeConfig } from '../../config/config.module';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../auth.constants';

const accessTokenMaxAgeMs = 15 * 60 * 1000;
const refreshTokenMaxAgeMs = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class WebSessionCookieService {
  private readonly cookieOptions: CookieOptions;

  constructor(
    @Inject(RUNTIME_CONFIG) private readonly runtimeConfig: RuntimeConfig,
  ) {
    this.cookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.runtimeConfig.nodeEnvironment === 'production',
      path: '/',
    };
  }

  setAuthenticationCookies(
    response: Response,
    authentication: AuthResponse,
  ): void {
    response.cookie(ACCESS_TOKEN_COOKIE_NAME, authentication.access_token, {
      ...this.cookieOptions,
      maxAge: accessTokenMaxAgeMs,
    });
    response.cookie(REFRESH_TOKEN_COOKIE_NAME, authentication.refresh_token, {
      ...this.cookieOptions,
      maxAge: refreshTokenMaxAgeMs,
    });
  }

  clearAuthenticationCookies(response: Response): void {
    response.clearCookie(ACCESS_TOKEN_COOKIE_NAME, this.cookieOptions);
    response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, this.cookieOptions);
  }
}
