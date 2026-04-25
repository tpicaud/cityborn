import { contract } from '@cityborn/api';
import type { User } from '@cityborn/types';
import { Controller, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import { VisitorId } from 'src/common/decorators/visitor-id.decorator';
import { CurrentUser } from 'src/user/user.decorator';
import { AuthService } from './auth.service';
import { AuthGuard } from './guards/auth.guard';
import { RefreshGuard } from './guards/refresh.guard';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @TsRestHandler(contract.auth.signUp)
  async signUp(@VisitorId() visitorId?: string) {
    return tsRestHandler(contract.auth.signUp, async ({ body }) => {
      return { status: 201 as const, body: await this.authService.signUp(body, visitorId) };
    });
  }

  @TsRestHandler(contract.auth.signIn)
  async signIn(@VisitorId() visitorId?: string) {
    return tsRestHandler(contract.auth.signIn, async ({ body }) => {
      return { status: 200 as const, body: await this.authService.signIn(body, visitorId) };
    });
  }

  @TsRestHandler(contract.auth.signInWithGoogle)
  async signInWithGoogle(@VisitorId() visitorId?: string) {
    return tsRestHandler(contract.auth.signInWithGoogle, async ({ body }) => {
      return { status: 200 as const, body: await this.authService.signInWithGoogle(body, visitorId) };
    });
  }

  @TsRestHandler(contract.auth.signInWithApple)
  async signInWithApple(@VisitorId() visitorId?: string) {
    return tsRestHandler(contract.auth.signInWithApple, async ({ body }) => {
      return { status: 200 as const, body: await this.authService.signInWithApple(body, visitorId) };
    });
  }

  @TsRestHandler(contract.auth.refresh)
  @UseGuards(RefreshGuard)
  async refresh(@CurrentUser() user: User) {
    return tsRestHandler(contract.auth.refresh, async () => {
      const identifier = user.username || user.email;
      return { status: 200 as const, body: await this.authService.refresh(identifier) };
    });
  }

  @TsRestHandler(contract.auth.me)
  @UseGuards(AuthGuard)
  async getProfile(@CurrentUser() user: User) {
    return tsRestHandler(contract.auth.me, async () => {
      const identifier = user.username || user.email;
      return { status: 200 as const, body: await this.authService.getProfile(identifier) };
    });
  }

  @TsRestHandler(contract.auth.deleteUser)
  @UseGuards(AuthGuard)
  async deleteUser(@CurrentUser() user?: User) {
    return tsRestHandler(contract.auth.deleteUser, async () => {
      await this.authService.deleteUser(user);
      return { status: 200 as const, body: {} };
    });
  }
}
