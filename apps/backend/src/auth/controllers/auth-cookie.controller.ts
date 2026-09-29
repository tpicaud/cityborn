import type { User } from '@cityborn/api';
import { contract } from '@cityborn/api';
import { Controller, Res, UseGuards } from '@nestjs/common';
import { TsRestHandler, tsRestHandler } from '@ts-rest/nest';
import type { Response } from 'express';
import { VisitorId } from '../../common/decorators/visitor-id.decorator';
import type { AuthSession } from '../../common/types/auth-session';
import { CurrentAuthSession, CurrentUser } from '../../user/user.decorator';
import { AuthGuard } from '../guards/access-token.guard';
import { CookieRefreshGuard } from '../guards/refresh-token.guard';
import { AuthService } from '../services/auth.service';
import { AuthCookieService } from '../services/auth-cookie.service';

@Controller()
export class AuthCookieController {
  constructor(
    private readonly authService: AuthService,
    private readonly authCookieService: AuthCookieService,
  ) {}

  @TsRestHandler(contract.auth.cookie.signUp)
  async signUpHandler(
    @Res({ passthrough: true }) response: Response,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(contract.auth.cookie.signUp, async ({ body }) => ({
      status: 201 as const,
      body: this.authCookieService.establishSession(
        response,
        await this.authService.signUp(body, visitorId),
      ),
    }));
  }

  @TsRestHandler(contract.auth.cookie.signIn)
  async signInHandler(
    @Res({ passthrough: true }) response: Response,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(contract.auth.cookie.signIn, async ({ body }) => ({
      status: 200 as const,
      body: this.authCookieService.establishSession(
        response,
        await this.authService.signIn(body, visitorId),
      ),
    }));
  }

  @TsRestHandler(contract.auth.cookie.signInWithGoogle)
  async signInWithGoogleHandler(
    @Res({ passthrough: true }) response: Response,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(
      contract.auth.cookie.signInWithGoogle,
      async ({ body }) => ({
        status: 200 as const,
        body: this.authCookieService.establishSession(
          response,
          await this.authService.signInWithGoogle(body, visitorId),
        ),
      }),
    );
  }

  @TsRestHandler(contract.auth.cookie.signInWithApple)
  async signInWithAppleHandler(
    @Res({ passthrough: true }) response: Response,
    @VisitorId() visitorId?: string,
  ) {
    return tsRestHandler(
      contract.auth.cookie.signInWithApple,
      async ({ body }) => ({
        status: 200 as const,
        body: this.authCookieService.establishSession(
          response,
          await this.authService.signInWithApple(body, visitorId),
        ),
      }),
    );
  }

  @TsRestHandler(contract.auth.cookie.refresh)
  @UseGuards(CookieRefreshGuard)
  async refreshHandler(
    @CurrentAuthSession() authSession: AuthSession,
    @Res({ passthrough: true }) response: Response,
  ) {
    return tsRestHandler(contract.auth.cookie.refresh, async () => ({
      status: 200 as const,
      body: this.authCookieService.establishSession(
        response,
        await this.authService.refresh(authSession),
      ),
    }));
  }

  @TsRestHandler(contract.auth.cookie.updatePassword)
  @UseGuards(AuthGuard)
  async updatePasswordHandler(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) response: Response,
  ) {
    return tsRestHandler(
      contract.auth.cookie.updatePassword,
      async ({ body }) => ({
        status: 200 as const,
        body: this.authCookieService.establishSession(
          response,
          await this.authService.updatePassword(user, body),
        ),
      }),
    );
  }

  @TsRestHandler(contract.auth.signOut)
  async signOutHandler(@Res({ passthrough: true }) response: Response) {
    return tsRestHandler(contract.auth.signOut, async () => {
      this.authCookieService.clearSession(response);
      return { status: 200 as const, body: {} };
    });
  }
}
