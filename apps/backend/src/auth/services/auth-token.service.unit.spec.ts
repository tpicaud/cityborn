import { buildUser, ErrorCode, type User } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { JwtService } from '@nestjs/jwt';
import type { AuthConfig } from '../../config/config.module';
import type { UserService } from '../../user/user.service';
import { type AuthTokenPayload, AuthTokenService } from './auth-token.service';

function buildAuthTokenService() {
  const jwtService: DeepMocked<JwtService> = createMock<JwtService>();
  const userService: DeepMocked<UserService> = createMock<UserService>();
  const authConfig: AuthConfig = createMock<AuthConfig>({
    jwtAccessSecret: 'access-secret',
  });
  const authTokenService: AuthTokenService = new AuthTokenService(
    jwtService,
    authConfig,
    userService,
  );
  return { authTokenService, jwtService, userService };
}

describe('AuthTokenService', () => {
  describe('verifyAccessToken', () => {
    it('treats a historical token without a version as version zero', async () => {
      const user: User = buildUser();
      const {
        authTokenService,
        jwtService,
      }: ReturnType<typeof buildAuthTokenService> = buildAuthTokenService();
      jwtService.verifyAsync.mockResolvedValue({ id: user.id });

      const payload: AuthTokenPayload =
        await authTokenService.verifyAccessToken('historical-token');

      expect(payload).toEqual({ id: user.id, authVersion: 0 });
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('historical-token', {
        secret: 'access-secret',
      });
    });
  });

  describe('resolveAuthSession', () => {
    it('rejects a token whose version differs from persisted state', async () => {
      const user: User = buildUser();
      const {
        authTokenService,
        userService,
      }: ReturnType<typeof buildAuthTokenService> = buildAuthTokenService();
      userService.findAuthSessionById.mockResolvedValue({
        user,
        authVersion: 2,
      });

      await expect(
        authTokenService.resolveAuthSession({ id: user.id, authVersion: 1 }),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_INVALID_TOKEN },
      });
    });
  });
});
