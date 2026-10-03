import type { IncomingHttpHeaders } from 'node:http';
import { buildUser, ErrorCode, type User } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { AuthSession } from '../../common/types/auth-session';
import type { WideEventService } from '../../common/wide-event/wide-event.service';
import type { HttpConfig } from '../../config/config.module';
import type { AuthRequest } from '../auth-request';
import type { AuthCookieService } from '../services/auth-cookie.service';
import type { AuthTokenService } from '../services/auth-token.service';
import { AdminGuard } from './access-token.guard';

const backOfficeOrigin: string = 'https://admin.cityborn.test';
const frontendOrigin: string = 'https://cityborn.test';

type AdminGuardScenarioInput = {
  user: User;
  headers: IncomingHttpHeaders;
};

type AdminGuardScenario = {
  guard: CanActivate;
  context: DeepMocked<ExecutionContext>;
  request: AuthRequest;
};

function buildAdminGuardScenario({
  user,
  headers,
}: AdminGuardScenarioInput): AdminGuardScenario {
  const authSession: AuthSession = { user, authVersion: 0 };
  const authTokenService: DeepMocked<AuthTokenService> =
    createMock<AuthTokenService>();
  authTokenService.verifyAccessToken.mockResolvedValue({
    id: user.id,
    authVersion: 0,
  });
  authTokenService.resolveAuthSession.mockResolvedValue(authSession);
  const authCookieService: DeepMocked<AuthCookieService> =
    createMock<AuthCookieService>();
  authCookieService.readAccessToken.mockImplementation(
    (cookieHeader: string | undefined) =>
      cookieHeader === undefined ? undefined : 'cookie-access-token',
  );
  const httpConfig: HttpConfig = {
    corsOrigins: [frontendOrigin, backOfficeOrigin],
    backOfficeOrigin,
    frontendUrl: frontendOrigin,
  };
  const request: AuthRequest = createMock<AuthRequest>({
    headers,
    authSession: undefined,
  });
  const context: DeepMocked<ExecutionContext> = createMock<ExecutionContext>();
  context.switchToHttp().getRequest.mockReturnValue(request);
  const guard: CanActivate = new AdminGuard(
    authTokenService,
    authCookieService,
    createMock<WideEventService>(),
    httpConfig,
  );
  return { guard, context, request };
}

describe('AdminGuard.canActivate', () => {
  it('lets an admin through with its auth session', async () => {
    const admin: User = buildUser({ role: 'admin' });
    const { guard, context, request }: AdminGuardScenario =
      buildAdminGuardScenario({
        user: admin,
        headers: { authorization: 'Bearer access-token' },
      });

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(request.authSession?.user.id).toBe(admin.id);
  });

  it('rejects a player with a forbidden admin role error', async () => {
    const player: User = buildUser({ role: 'player' });
    const { guard, context }: AdminGuardScenario = buildAdminGuardScenario({
      user: player,
      headers: { authorization: 'Bearer access-token' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      expect.objectContaining({
        status: 403,
        response: expect.objectContaining({ code: ErrorCode.USER_NOT_ADMIN }),
      }),
    );
  });

  it('rejects an anonymous request as unauthenticated', async () => {
    const admin: User = buildUser({ role: 'admin' });
    const { guard, context }: AdminGuardScenario = buildAdminGuardScenario({
      user: admin,
      headers: { origin: backOfficeOrigin },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      expect.objectContaining({
        status: 401,
        response: expect.objectContaining({
          code: ErrorCode.USER_TOKEN_MISSING,
        }),
      }),
    );
  });

  it('lets an admin cookie session through from the back-office origin', async () => {
    const admin: User = buildUser({ role: 'admin' });
    const { guard, context }: AdminGuardScenario = buildAdminGuardScenario({
      user: admin,
      headers: { cookie: 'session', origin: backOfficeOrigin },
    });

    await expect(guard.canActivate(context)).resolves.toBe(true);
  });

  it('rejects an admin cookie session from another allowed origin', async () => {
    const admin: User = buildUser({ role: 'admin' });
    const { guard, context }: AdminGuardScenario = buildAdminGuardScenario({
      user: admin,
      headers: { cookie: 'session', origin: frontendOrigin },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      expect.objectContaining({
        status: 403,
        response: expect.objectContaining({
          code: ErrorCode.CSRF_ORIGIN_FORBIDDEN,
        }),
      }),
    );
  });

  it('rejects an admin cookie session without origin', async () => {
    const admin: User = buildUser({ role: 'admin' });
    const { guard, context }: AdminGuardScenario = buildAdminGuardScenario({
      user: admin,
      headers: { cookie: 'session' },
    });

    await expect(guard.canActivate(context)).rejects.toThrow(
      expect.objectContaining({
        status: 403,
        response: expect.objectContaining({
          code: ErrorCode.CSRF_ORIGIN_FORBIDDEN,
        }),
      }),
    );
  });
});
