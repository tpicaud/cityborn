import { UserIdSchema } from '@cityborn/api';
import { type JwtService } from '@nestjs/jwt';
import { z } from 'zod';

const AuthTokenPayloadSchema = z.object({
  id: UserIdSchema,
  authVersion: z.number().int().nonnegative().optional().default(0),
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

export async function validateRefreshToken(
  token: string,
  jwtService: JwtService,
  jwt_refresh_secret: string | undefined,
): Promise<AuthTokenPayload> {
  return await validateToken(token, jwtService, jwt_refresh_secret);
}
