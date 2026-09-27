import { buildUser, ErrorCode, type User } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import type { JwtService } from '@nestjs/jwt';
import type { UserService } from '../../user/user.service';
import {
  type AuthTokenPayload,
  resolveAuthenticationContext,
  validateAccessToken,
} from './utils';

describe('Authentication guard utilities', () => {
  describe('validateAccessToken', () => {
    it('treats a historical token without a version as version zero', async () => {
      const user: User = buildUser();
      const jwtService: DeepMocked<JwtService> = createMock<JwtService>();
      jwtService.verifyAsync.mockResolvedValue({ id: user.id });

      const payload: AuthTokenPayload = await validateAccessToken(
        'historical-token',
        jwtService,
        'access-secret',
      );

      expect(payload).toEqual({ id: user.id, sessionVersion: 0 });
    });
  });

  describe('resolveAuthenticationContext', () => {
    it('rejects a token whose version differs from persisted state', async () => {
      const user: User = buildUser();
      const userService: DeepMocked<UserService> = createMock<UserService>();
      userService.findAuthenticationContextById.mockResolvedValue({
        user,
        sessionVersion: 2,
      });

      await expect(
        resolveAuthenticationContext(
          { id: user.id, sessionVersion: 1 },
          userService,
        ),
      ).rejects.toMatchObject({
        response: { code: ErrorCode.USER_INVALID_TOKEN },
      });
    });
  });
});
