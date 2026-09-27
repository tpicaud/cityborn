import { ErrorCode, UserIdSchema } from '@cityborn/api';
import { UnauthorizedException } from '@nestjs/common';
import { type JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import type { AuthSession } from '../../common/types/auth-session';
import { AuthVersionSchema } from '../../common/types/auth-session';
import type { UserService } from '../../user/user.service';

const AuthTokenPayloadSchema = z.object({
  id: UserIdSchema,
  authVersion: AuthVersionSchema.optional().default(0),
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

export async function resolveAuthSession(
  payload: AuthTokenPayload,
  userService: UserService,
): Promise<AuthSession | null> {
  const authSession: AuthSession | null = await userService.findAuthSessionById(
    payload.id,
  );
  if (!authSession) return null;
  if (authSession.authVersion === payload.authVersion) {
    return authSession;
  }

  throw new UnauthorizedException({
    code: ErrorCode.USER_INVALID_TOKEN,
    message: 'Session revoked',
  });
}

export async function validateRefreshToken(
  token: string,
  jwtService: JwtService,
  jwt_refresh_secret: string | undefined,
): Promise<AuthTokenPayload> {
  return await validateToken(token, jwtService, jwt_refresh_secret);
}
