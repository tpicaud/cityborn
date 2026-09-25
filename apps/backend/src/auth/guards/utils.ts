import { ErrorCode, type User, type UserId, UserIdSchema } from '@cityborn/api';
import { UnauthorizedException } from '@nestjs/common';
import { type JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import type { UserService } from '../../user/user.service';

const AuthTokenPayloadSchema = z.object({
  id: UserIdSchema,
  sessionVersion: z.number().int().nonnegative().default(0),
});

export type AuthTokenPayload = z.infer<typeof AuthTokenPayloadSchema>;

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
  sessionVersion: number = 0,
): Promise<User | null> {
  const currentVersion: number | null =
    await userService.findSessionVersion(userId);
  if (currentVersion !== sessionVersion) {
    throw new UnauthorizedException({
      code: ErrorCode.USER_INVALID_TOKEN,
      message: 'Session revoked',
    });
  }
  const fullUser = await userService.findById(userId);
  return fullUser;
}

export async function validateRefreshToken(
  token: string,
  jwtService: JwtService,
  jwt_refresh_secret: string | undefined,
): Promise<AuthTokenPayload> {
  return await validateToken(token, jwtService, jwt_refresh_secret);
}
