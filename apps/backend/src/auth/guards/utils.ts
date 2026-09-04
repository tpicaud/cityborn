import { type User } from '@cityborn/api';
import { type JwtService } from '@nestjs/jwt';
import { UserMapper } from '../../user/user.mapper';
import type { UserService } from '../../user/user.service';

export async function validateAccessToken(
  token: string,
  jwtService: JwtService,
  jwt_access_secret: string | undefined,
) {
  return await jwtService.verifyAsync(token, {
    secret: jwt_access_secret,
  });
}

export async function resolveFullUser(
  userId: string,
  userService: UserService,
): Promise<User | null> {
  const fullUser = await userService.findById(userId);
  return fullUser ? UserMapper.toUser(fullUser) : null;
}

export async function validateRefreshToken(
  token: string,
  jwtService: JwtService,
  jwt_refresh_secret: string | undefined,
) {
  return await jwtService.verifyAsync(token, {
    secret: jwt_refresh_secret,
  });
}
