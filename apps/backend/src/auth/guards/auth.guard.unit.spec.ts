import { buildUser, ErrorCode, type User } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { ExecutionContext } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import type { WideEventService } from '../../common/wide-event/wide-event.service';
import type { AuthConfig } from '../../config/config.module';
import type { UserService } from '../../user/user.service';
import { AuthGuard } from './auth.guard';

function buildAuthGuard() {
  const jwtService: DeepMocked<JwtService> = createMock<JwtService>();
  const userService: DeepMocked<UserService> = createMock<UserService>();
  const wideEventService: DeepMocked<WideEventService> =
    createMock<WideEventService>();
  const authConfig: AuthConfig = {
    jwtAccessSecret: 'access-secret',
    jwtRefreshSecret: 'refresh-secret',
    googleClientId: 'google-client',
    appleAppId: 'cityborn-app',
    adminDashboardToken: 'admin-token',
  };
  const authGuard: AuthGuard = new AuthGuard(
    jwtService,
    authConfig,
    userService,
    wideEventService,
  );
  const request: DeepMocked<Request> = createMock<Request>({
    headers: { authorization: 'Bearer access-token' },
  });
  const executionContext: DeepMocked<ExecutionContext> =
    createMock<ExecutionContext>();
  executionContext.switchToHttp().getRequest.mockReturnValue(request);

  return {
    authGuard,
    executionContext,
    jwtService,
    request,
    userService,
    wideEventService,
  };
}

describe('AuthGuard.canActivate', () => {
  it('accepts a legacy token while the authentication version is unchanged', async () => {
    const {
      authGuard,
      executionContext,
      jwtService,
      request,
      userService,
    }: ReturnType<typeof buildAuthGuard> = buildAuthGuard();
    const user: User = buildUser();
    jwtService.verifyAsync.mockResolvedValue({ id: user.id });
    userService.findAuthenticationStateById.mockResolvedValue({
      user,
      authVersion: 0,
    });

    await expect(authGuard.canActivate(executionContext)).resolves.toBe(true);
    expect(request.user).toEqual(user);
  });

  it('rejects a token issued before the password change', async () => {
    const {
      authGuard,
      executionContext,
      jwtService,
      userService,
    }: ReturnType<typeof buildAuthGuard> = buildAuthGuard();
    const user: User = buildUser();
    jwtService.verifyAsync.mockResolvedValue({
      id: user.id,
      authVersion: 1,
    });
    userService.findAuthenticationStateById.mockResolvedValue({
      user,
      authVersion: 2,
    });

    await expect(authGuard.canActivate(executionContext)).rejects.toMatchObject(
      {
        response: { code: ErrorCode.USER_INVALID_TOKEN },
      },
    );
  });
});
