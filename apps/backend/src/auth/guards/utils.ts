import { type User, type UserId, UserIdSchema } from '@cityborn/api';
import { type JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import { UserMapper } from '../../user/user.mapper';
import type { UserService } from '../../user/user.service';

const AuthTokenPayloadSchema = z.object({
  id: UserIdSchema,
});

type AuthTokenPayload = z.infer<typeof AuthTokenPayloadSchema>;

async function validateToken(
  token: string,
  jwtService: JwtService,
  secret: string | undefined,
): Promise<AuthTokenPayload> {
  const payload: unknown = await jwtService.verifyAsync(token, { secret });
  return AuthTokenPayloadSchema.parse(payload);
}

export async function validateAccessToken(
  token: string,
  jwtService: JwtService,
  jwt_access_secret: string | undefined,
): Promise<AuthTokenPayload> {
  return await validateToken(token, jwtService, jwt_access_secret);
}

export async function resolveFullUser(
  userId: UserId,
  userService: UserService,
): Promise<User | null> {
  const fullUser = await userService.findById(userId);
  return fullUser ? UserMapper.toUser(fullUser) : null;
}

export async function validateRefreshToken(
  token: string,
  jwtService: JwtService,
  jwt_refresh_secret: string | undefined,
): Promise<AuthTokenPayload> {
  return await validateToken(token, jwtService, jwt_refresh_secret);
}
