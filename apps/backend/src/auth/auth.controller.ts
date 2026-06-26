import { contract, User } from '@cityborn/api';
import { Controller, UseGuards } from '@nestjs/common';
import { initContract } from '@ts-rest/core';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { VisitorId } from '../common/decorators/visitor-id.decorator';
import { CurrentUser } from '../user/user.decorator';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RefreshGuard } from './guards/refresh.guard';

const c = initContract(); // TODO delete to use only shared contract

const publicAuthRoutes = c.router({
  signUp: contract.auth.signUp,
  signIn: contract.auth.signIn,
  signInWithGoogle: contract.auth.signInWithGoogle,
  signInWithApple: contract.auth.signInWithApple,
});

const protectedAuthRoutes = c.router({
  me: contract.auth.me,
  deleteUser: contract.auth.deleteUser,
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
}
