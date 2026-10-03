import { buildUser, ErrorCode, type User } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { AuthSession } from '../../common/types/auth-session';
import type { WideEventService } from '../../common/wide-event/wide-event.service';
import type { AuthRequest } from '../auth-request';
import type { AuthCookieService } from '../services/auth-cookie.service';
import type { AuthTokenService } from '../services/auth-token.service';
import { AdminGuard } from './access-token.guard';

type AdminGuardScenario = {
  guard: CanActivate;
  context: DeepMocked<ExecutionContext>;
  request: AuthRequest;
};

function buildAdminGuardScenario(user: User): AdminGuardScenario {
  const authSession: AuthSession = { user, authVersion: 0 };
  const authTokenService: DeepMocked<AuthTokenService> =
    createMock<AuthTokenService>();
  authTokenService.verifyAccessToken.mockResolvedValue({
    id: user.id,
    authVersion: 0,
  });
  authTokenService.resolveAuthSession.mockResolvedValue(authSession);
  const request: AuthRequest = createMock<AuthRequest>({
    headers: { authorization: 'Bearer access-token' },
    authSession: undefined,
  });
  const context: DeepMocked<ExecutionContext> = createMock<ExecutionContext>();
  context.switchToHttp().getRequest.mockReturnValue(request);
  const guard: CanActivate = new AdminGuard(
    authTokenService,
    createMock<AuthCookieService>(),
    createMock<WideEventService>(),
  );
  return { guard, context, request };
}

describe('AdminGuard.canActivate', () => {
  it('lets an admin through with its auth session', async () => {
    const admin: User = buildUser({ role: 'admin' });
    const { guard, context, request }: AdminGuardScenario =
      buildAdminGuardScenario(admin);

    await expect(guard.canActivate(context)).resolves.toBe(true);

    expect(request.authSession?.user.id).toBe(admin.id);
  });

  it('rejects a player with a forbidden admin role error', async () => {
    const player: User = buildUser({ role: 'player' });
    const { guard, context }: AdminGuardScenario =
      buildAdminGuardScenario(player);

    await expect(guard.canActivate(context)).rejects.toThrow(
      expect.objectContaining({
        status: 403,
        response: expect.objectContaining({ code: ErrorCode.USER_NOT_ADMIN }),
      }),
    );
  });
});
