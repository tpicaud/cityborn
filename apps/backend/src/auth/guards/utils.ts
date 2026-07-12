import { ErrorCode, type User } from '@cityborn/api';
import { UnauthorizedException } from '@nestjs/common';
import {
  JsonWebTokenError,
  type JwtService,
  TokenExpiredError,
} from '@nestjs/jwt';
import { UserMapper } from '../../user/user.mapper';
import type { UserService } from '../../user/user.service';

export async function validateAccessToken(
  token: string,
  jwtService: JwtService,
  jwt_access_secret: string | undefined,
) {
  try {
    return await jwtService.verifyAsync(token, {
      secret: jwt_access_secret,
    });
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
      });
    } else {
      console.error(err);
      // autre erreur inattendue
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_TOKEN,
        message: 'Invalid token',
      });
    }
  }
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
  try {
    return await jwtService.verifyAsync(token, {
      secret: jwt_refresh_secret,
    });
  } catch (err) {
    if (err instanceof TokenExpiredError) {
      throw new UnauthorizedException({
        code: ErrorCode.TOKEN_EXPIRED,
        message: 'Token expired',
      });
    } else if (err instanceof JsonWebTokenError) {
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_TOKEN,
        message: 'Invalid token',
      });
    } else {
      // autre erreur inattendue
      throw new UnauthorizedException({
        code: ErrorCode.USER_INVALID_TOKEN,
        message: 'Invalid token',
      });
    }
  }
}
