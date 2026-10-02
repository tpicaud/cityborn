import type { IncomingHttpHeaders } from 'node:http';
import type { User } from '@cityborn/api';
import { contract } from '@cityborn/api';
import { Controller, Headers, UseGuards } from '@nestjs/common';
import { initContract } from '@ts-rest/core';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Response } from 'express';
import { HttpResponse } from '../../common/decorators/http-response.decorator';
import { VisitorId } from '../../common/decorators/visitor-id.decorator';
import type { AuthSession } from '../../common/types/auth-session';
import {
  CurrentAuthSession,
  CurrentUser,
} from '../current-auth-session.decorator';
import { AuthGuard } from '../guards/access-token.guard';
import { extractBearerToken } from '../guards/bearer-token';
import { CookieRefreshGuard } from '../guards/refresh-token.guard';
import { AuthService } from '../services/auth.service';
import { AuthCookieService } from '../services/auth-cookie.service';
import { AuthTokenService } from '../services/auth-token.service';

const c = initContract();

const publicCookieAuthRoutes = c.router({
  signUp: contract.auth.cookie.signUp,
  signIn: contract.auth.cookie.signIn,
  signInWithGoogle: contract.auth.cookie.signInWithGoogle,
  signInWithApple: contract.auth.cookie.signInWithApple,
  signOut: contract.auth.signOut,
});

const protectedCookieAuthRoutes = c.router({
  updatePassword: contract.auth.cookie.updatePassword,
});

const cookieRefreshRoutes = c.router({
  refresh: contract.auth.cookie.refresh,
});

@Controller()
export class AuthCookieController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
    private readonly authTokenService: AuthTokenService,
  ) {}

  @TsRestHandler(publicCookieAuthRoutes)
  async handler(
    @HttpResponse() response: Response,
    @Headers() headers: IncomingHttpHeaders,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(publicCookieAuthRoutes, {
      signUp: async ({ body }) => ({
        status: 201 as const,
        body: this.authCookieService.establishSession(
          response,
          await this.authService.signUp(body, visitorId),
        ),
      }),
      signIn: async ({ body }) => ({
        status: 200 as const,
        body: this.authCookieService.establishSession(
          response,
          await this.authService.signIn(body, visitorId),
        ),
      }),
      signInWithGoogle: async ({ body }) => ({
        status: 200 as const,
        body: this.authCookieService.establishSession(
          response,
          await this.authService.signInWithGoogle(body, visitorId),
        ),
      }),
      signInWithApple: async ({ body }) => ({
        status: 200 as const,
        body: this.authCookieService.establishSession(
          response,
          await this.authService.signInWithApple(body, visitorId),
        ),
      }),
      signOut: async () => {
        const presentedRefreshTokens: string[] = [
          this.authCookieService.readRefreshToken(headers.cookie),
          extractBearerToken(headers),
        ].filter(
          (refreshToken: string | undefined): refreshToken is string =>
            refreshToken !== undefined,
        );
        await Promise.all(
          presentedRefreshTokens.map((refreshToken: string) =>
            this.authTokenService.revokeRefreshToken(refreshToken),
          ),
        );
        this.authCookieService.clearSession(response);
        return { status: 200 as const, body: {} };
      },
    });
  }

  @TsRestHandler(protectedCookieAuthRoutes)
  @UseGuards(AuthGuard)
  async protectedHandler(
    @CurrentUser() user: User,
    @HttpResponse() response: Response,
  ) {
    return tsRestHandler(protectedCookieAuthRoutes, {
      updatePassword: async ({ body }) => ({
        status: 200 as const,
        body: this.authCookieService.establishSession(
          response,
          await this.authService.updatePassword(user, body),
        ),
      }),
    });
  }

  @TsRestHandler(cookieRefreshRoutes)
  @UseGuards(CookieRefreshGuard)
  async refreshHandler(
    @CurrentAuthSession() authSession: AuthSession,
    @HttpResponse() response: Response,
  ) {
    return tsRestHandler(cookieRefreshRoutes, {
      refresh: async () => ({
        status: 200 as const,
        body: this.authCookieService.establishSession(
          response,
          await this.authService.refresh(authSession),
        ),
      }),
    });
  }
}
