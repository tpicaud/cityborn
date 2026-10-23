import type { User } from '@cityborn/api';
import { contract } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { initContract } from '@ts-rest/core';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { VisitorId } from '../../common/decorators/visitor-id.decorator';
import type { AuthSession } from '../../common/types/auth-session';
import {
  CurrentAuthSession,
  CurrentUser,
} from '../current-auth-session.decorator';
import { AuthGuard, BearerAuthGuard } from '../guards/access-token.guard';
import { BearerRefreshGuard } from '../guards/refresh-token.guard';
import { AuthService } from '../services/auth.service';

const c = initContract();

const publicAuthRoutes = c.router({
  signUp: contract.auth.signUp,
  register: contract.auth.register,
  signIn: contract.auth.signIn,
  signInWithGoogle: contract.auth.signInWithGoogle,
  signInWithApple: contract.auth.signInWithApple,
  verifyEmail: contract.auth.verifyEmail,
  renewVerificationEmail: contract.auth.renewVerificationEmail,
  requestPasswordReset: contract.auth.requestPasswordReset,
  resetPassword: contract.auth.resetPassword,
});

const protectedAuthRoutes = c.router({
  me: contract.auth.me,
  deleteUser: contract.auth.deleteUser,
  resendVerificationEmail: contract.auth.resendVerificationEmail,
  updateEmail: contract.auth.updateEmail,
});

const refreshRoutes = c.router({
  refresh: contract.auth.refresh,
});

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @TsRestHandler(publicAuthRoutes)
  async handler(@VisitorId() visitorId?: string) {
    return tsRestHandler(publicAuthRoutes, {
      signUp: async ({ body }) => ({
        status: 201 as const,
        body: await this.authService.signUp(body, visitorId),
      }),
      register: async ({ body }) => {
        await this.authService.register(body, visitorId);
        return { status: 202 as const, body: {} };
      },
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
      renewVerificationEmail: async ({ body }) => {
        await this.authService.renewVerificationEmail(body);
        return { status: 202 as const, body: {} };
      },
      requestPasswordReset: async ({ body }) => {
        await this.authService.requestPasswordReset(body);
        return { status: 202 as const, body: {} };
      },
      resetPassword: async ({ body }) => {
        await this.authService.resetPassword(body);
        return { status: 200 as const, body: {} };
      },
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
      updateEmail: async ({ body }) => ({
        status: 200 as const,
        body: await this.authService.updateEmail(user, body),
      }),
    });
  }

  @TsRestHandler(contract.auth.updatePassword)
  @UseGuards(BearerAuthGuard)
  async updatePasswordHandler(@CurrentUser() user: User) {
    return tsRestHandler(contract.auth.updatePassword, async ({ body }) => ({
      status: 200 as const,
      body: await this.authService.updatePassword(user, body),
    }));
  }

  @TsRestHandler(refreshRoutes)
  @UseGuards(BearerRefreshGuard)
  async refreshHandler(@CurrentAuthSession() authSession: AuthSession) {
    return tsRestHandler(refreshRoutes, {
      refresh: async () => ({
        status: 200 as const,
        body: await this.authService.refresh(authSession),
      }),
    });
  }
}
