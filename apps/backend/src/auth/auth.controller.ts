import { contract, PASSWORD_RESET_REQUEST_MESSAGE, User } from '@cityborn/api';
import { Controller, Req, UseGuards } from '@nestjs/common';
import { initContract } from '@ts-rest/core';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Request } from 'express';
import { VisitorId } from '../common/decorators/visitor-id.decorator';
import { CurrentUser } from '../user/user.decorator';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { PasswordResetService } from './services/password-reset.service';

const c = initContract(); // TODO delete to use only shared contract

const publicAuthRoutes = c.router({
  requestPasswordReset: contract.auth.requestPasswordReset,
  resetPassword: contract.auth.resetPassword,
  validatePasswordResetToken: contract.auth.validatePasswordResetToken,
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
    private readonly passwordResetService: PasswordResetService,
  ) {}

  @TsRestHandler(publicAuthRoutes)
  async handler(@Req() request: Request, @VisitorId() visitorId?: string) {
    return tsRestHandler(publicAuthRoutes, {
      requestPasswordReset: async ({ body }) => {
        await this.passwordResetService.request(
          body.email,
          request.ip ?? request.socket.remoteAddress ?? 'unknown',
        );
        return {
          status: 200 as const,
          body: { message: PASSWORD_RESET_REQUEST_MESSAGE },
        };
      },
      resetPassword: async ({ body }) => {
        await this.passwordResetService.reset(body);
        return { status: 200 as const, body: {} };
      },
      validatePasswordResetToken: async ({ body }) => {
        await this.passwordResetService.validateToken(body.token);
        return { status: 200 as const, body: {} };
      },
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
  async refreshHandler(@CurrentUser() user: User, @Req() request: Request) {
    return tsRestHandler(refreshRoutes, {
      refresh: async () => ({
        status: 200 as const,
        body: await this.authService.refresh(
          user.username || user.email,
          request.sessionVersion,
        ),
      }),
    });
  }
}
