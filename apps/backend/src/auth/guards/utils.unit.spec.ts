import { buildUser, ErrorCode, type User } from '@cityborn/api';
import { createMock, type DeepMocked } from '@golevelup/ts-jest';
import { JwtService } from '@nestjs/jwt';
import type { UserService } from '../../user/user.service';
import { resolveFullUser, validateAccessToken } from './utils';

describe('resolveFullUser', () => {
  it('rejects a revoked session version', async () => {
    const user: User = buildUser();
    const userService: DeepMocked<UserService> = createMock<UserService>();
    userService.findSessionVersion.mockResolvedValue(1);

    await expect(
      resolveFullUser(user.id, userService, 0),
    ).rejects.toMatchObject({
      response: { code: ErrorCode.USER_INVALID_TOKEN },
    });

    expect(userService.findById).not.toHaveBeenCalled();
  });
});

describe('validateAccessToken', () => {
  it('accepts pre-migration JWTs as session version zero', async () => {
    const user: User = buildUser();
    const jwtService: JwtService = new JwtService();
    const token: string = await jwtService.signAsync(
      { id: user.id },
      { secret: 'secret' },
    );

    expect(await validateAccessToken(token, jwtService, 'secret')).toEqual({
      id: user.id,
      sessionVersion: 0,
    });
  });
});
