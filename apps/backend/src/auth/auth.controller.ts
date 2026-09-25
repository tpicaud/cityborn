import type { AuthResponse, User } from '@cityborn/api';
import { contract } from '@cityborn/api';
import { Controller, Res, UseGuards } from '@nestjs/common';
import { initContract } from '@ts-rest/core';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Response } from 'express';
import { VisitorId } from '../common/decorators/visitor-id.decorator';
import { CurrentUser } from '../user/user.decorator';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { WebSessionCookieService } from './services/web-session-cookie.service';

const c = initContract();

const publicAuthRoutes = c.router({
  signUp: contract.auth.signUp,
  signIn: contract.auth.signIn,
  signInWithGoogle: contract.auth.signInWithGoogle,
  signInWithApple: contract.auth.signInWithApple,
  verifyEmail: contract.auth.verifyEmail,
});

const protectedAuthRoutes = c.router({
  me: contract.auth.me,
  deleteUser: contract.auth.deleteUser,
  resendVerificationEmail: contract.auth.resendVerificationEmail,
});

const refreshRoutes = c.router({
  refresh: contract.auth.refresh,
});

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly webSessionCookieService: WebSessionCookieService,
  ) {}

  @TsRestHandler(publicAuthRoutes)
  async handler(@VisitorId() visitorId?: string) {
    return tsRestHandler(publicAuthRoutes, {
      signUp: async ({ body }) => ({
        status: 201 as const,
        body: await this.authService.signUp(body, visitorId),
      }),
      signIn: async ({ body }) => ({
        status: 200 as const,
        body: await this.authService.signIn(body, visitorId),
      }),
      signInWithGoogle: async ({ body }) => ({
        status: 200 as const,
        body: await this.authService.signInWithGoogle(body, visitorId),
      }),
      signInWithApple: async ({ body }) => ({
        status: 200 as const,
        body: await this.authService.signInWithApple(body, visitorId),
      }),
      verifyEmail: async ({ body }) => ({
        status: 200 as const,
        body: await this.authService.verifyEmail(body),
      }),
    });
  }

  @TsRestHandler(protectedAuthRoutes)
  @UseGuards(AuthGuard)
  async protectedHandler(@CurrentUser() user: User) {
    return tsRestHandler(protectedAuthRoutes, {
      me: async () => ({
        status: 200 as const,
        body: await this.authService.getProfile(user.username || user.email),
      }),
      deleteUser: async () => {
        await this.authService.deleteUser(user);
        return { status: 200 as const, body: {} };
      },
      resendVerificationEmail: async () => {
        await this.authService.resendVerificationEmail(user);
        return { status: 200 as const, body: {} };
      },
    });
  }

  @TsRestHandler(refreshRoutes)
  @UseGuards(RefreshGuard)
  async refreshHandler(@CurrentUser() user: User) {
    return tsRestHandler(refreshRoutes, {
      refresh: async () => ({
        status: 200 as const,
        body: await this.authService.refresh(user.username || user.email),
      }),
    });
  }

  @TsRestHandler(contract.auth.webSignUp)
  async webSignUpHandler(
    @Res({ passthrough: true }) response: Response,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(contract.auth.webSignUp, async ({ body }) => ({
      status: 201 as const,
      body: this.establishWebSession(
        response,
        await this.authService.signUp(body, visitorId),
      ),
    }));
  }

  @TsRestHandler(contract.auth.webSignIn)
  async webSignInHandler(
    @Res({ passthrough: true }) response: Response,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(contract.auth.webSignIn, async ({ body }) => ({
      status: 200 as const,
      body: this.establishWebSession(
        response,
        await this.authService.signIn(body, visitorId),
      ),
    }));
  }

  @TsRestHandler(contract.auth.webSignInWithGoogle)
  async webSignInWithGoogleHandler(
    @Res({ passthrough: true }) response: Response,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(
      contract.auth.webSignInWithGoogle,
      async ({ body }) => ({
        status: 200 as const,
        body: this.establishWebSession(
          response,
          await this.authService.signInWithGoogle(body, visitorId),
        ),
      }),
    );
  }

  @TsRestHandler(contract.auth.webSignInWithApple)
  async webSignInWithAppleHandler(
    @Res({ passthrough: true }) response: Response,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(
      contract.auth.webSignInWithApple,
      async ({ body }) => ({
        status: 200 as const,
        body: this.establishWebSession(
          response,
          await this.authService.signInWithApple(body, visitorId),
        ),
      }),
    );
  }

  @TsRestHandler(contract.auth.webMe)
  @UseGuards(AuthGuard)
  async webMeHandler(@CurrentUser() user: User) {
    return tsRestHandler(contract.auth.webMe, async () => ({
      status: 200 as const,
      body: await this.authService.getProfile(user.username || user.email),
    }));
  }

  @TsRestHandler(contract.auth.webRefresh)
  @UseGuards(RefreshGuard)
  async webRefreshHandler(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return tsRestHandler(contract.auth.webRefresh, async () => ({
      status: 200 as const,
      body: this.establishWebSession(
        response,
        await this.authService.refresh(user.username || user.email),
      ),
    }));
  }

  @TsRestHandler(contract.auth.webSignOut)
  async webSignOutHandler(@Res({ passthrough: true }) response: Response) {
    return tsRestHandler(contract.auth.webSignOut, async () => {
      this.webSessionCookieService.clearAuthenticationCookies(response);
      return { status: 200 as const, body: {} };
    });
  }

  private establishWebSession(
    response: Response,
    authentication: AuthResponse,
  ): User {
    this.webSessionCookieService.setAuthenticationCookies(
      response,
      authentication,
    );
    return authentication.user;
  }
}
