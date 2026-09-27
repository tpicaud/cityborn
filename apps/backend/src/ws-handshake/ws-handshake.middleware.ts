import {
  type ApiError,
  ErrorCode,
  type VisitorId,
  VisitorIdSchema,
} from '@cityborn/api';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  type AuthTokenPayload,
  resolveAuthenticationContext,
  validateAccessToken,
} from '../auth/guards/utils';
import { userAuthenticationRoom } from '../auth/session-revocation.service';
import { extractAccessTokenFromWsClient } from '../auth/utils';
import type { AppSocket } from '../common/types/app-socket';
import type { AuthenticationContext } from '../common/types/authentication';
import { firstHeaderValue } from '../common/wide-event/wide-event';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { WsWideEventLifecycle } from '../common/wide-event/ws-wide-event.lifecycle';
import { AUTH_CONFIG, type AuthConfig } from '../config/config.module';
import { RateLimitService } from '../rate-limit/rate-limit.service';
import { resolveClientIpFromHeaders } from '../rate-limit/resolve-client-ip';
import { UserService } from '../user/user.service';

export class WsHandshakeError extends Error {
  constructor(readonly data: ApiError) {
    super(data.message);
    this.name = 'WsHandshakeError';
  }
}

export type WsHandshakeNext = (error?: WsHandshakeError) => void;

function parseVisitorId(
  value: string | string[] | undefined,
): VisitorId | undefined {
  return VisitorIdSchema.safeParse(firstHeaderValue(value)).data;
}

@Injectable()
export class WsHandshakeMiddleware {
  constructor(
    @Inject(AUTH_CONFIG) private readonly authConfig: AuthConfig,
    private readonly jwtService: JwtService,
    private readonly userService: UserService,
    private readonly rateLimitService: RateLimitService,
    private readonly wideEventService: WideEventService,
    private readonly wsWideEventLifecycle: WsWideEventLifecycle,
  ) {}

  use(socket: AppSocket, next: WsHandshakeNext): void {
    socket.data = {
      authentication: { status: 'anonymous' },
      visitorId: parseVisitorId(socket.handshake.query['x-visitor-id']),
    };

    this.wsWideEventLifecycle
      .runConnection(socket, () => this.handshake(socket))
      .then(
        (rejection: ApiError | null) =>
          next(rejection ? new WsHandshakeError(rejection) : undefined),
        (error: unknown) =>
          next(
            new WsHandshakeError(
              this.wideEventService.recordError(error, 'ws.connection'),
            ),
          ),
      );
  }

  private async handshake(socket: AppSocket): Promise<ApiError | null> {
    const rateLimitRejection: ApiError | null =
      await this.consumeConnectionRateLimit(socket);
    if (rateLimitRejection) return rateLimitRejection;

    return this.authenticate(socket);
  }

  private async consumeConnectionRateLimit(
    socket: AppSocket,
  ): Promise<ApiError | null> {
    try {
      await this.rateLimitService.consumeWsConnection(
        resolveClientIpFromHeaders(
          socket.handshake.headers,
          socket.handshake.address,
        ),
      );
      return null;
    } catch (error) {
      return this.wideEventService.recordError(error, 'ws.connection');
    }
  }

  private async authenticate(socket: AppSocket): Promise<ApiError | null> {
    const token: string | undefined = extractAccessTokenFromWsClient(socket);
    if (!token) return null;

    let payload: AuthTokenPayload;
    try {
      payload = await validateAccessToken(
        token,
        this.jwtService,
        this.authConfig.jwtAccessSecret,
      );
    } catch (error) {
      this.wideEventService.recordError(error, 'ws.connection_auth');
      return null;
    }

    socket.data.authentication = {
      status: 'pending',
      userId: payload.id,
      sessionVersion: payload.sessionVersion,
    };
    await socket.join(userAuthenticationRoom(payload.id));

    try {
      const authentication: AuthenticationContext | null =
        await resolveAuthenticationContext(payload, this.userService);
      if (!authentication) {
        throw new UnauthorizedException({
          code: ErrorCode.USER_NOT_FOUND,
          message: 'User not found',
        });
      }

      socket.data.authentication = {
        status: 'authenticated',
        ...authentication,
      };
      return null;
    } catch (error) {
      return this.wideEventService.recordError(error, 'ws.connection_auth');
    }
  }
}
