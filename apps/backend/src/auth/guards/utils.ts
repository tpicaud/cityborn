import { ErrorCode, UserIdSchema } from '@cityborn/api';
import { UnauthorizedException } from '@nestjs/common';
import { type JwtService } from '@nestjs/jwt';
import { z } from 'zod';
import type { AuthenticationContext } from '../../common/types/authentication';
import { SessionVersionSchema } from '../../common/types/authentication';
import type { UserService } from '../../user/user.service';

const AuthTokenPayloadSchema = z.object({
  id: UserIdSchema,
  sessionVersion: SessionVersionSchema.optional().default(0),
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

export async function resolveAuthenticationContext(
  payload: AuthTokenPayload,
  userService: UserService,
): Promise<AuthenticationContext | null> {
  const authentication: AuthenticationContext | null =
    await userService.findAuthenticationContextById(payload.id);
  if (!authentication) return null;
  if (authentication.sessionVersion === payload.sessionVersion) {
    return authentication;
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
