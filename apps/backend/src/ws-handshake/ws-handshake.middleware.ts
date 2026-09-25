import {
  type ApiError,
  type User,
  type VisitorId,
  VisitorIdSchema,
} from '@cityborn/api';
import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { resolveFullUser, validateAccessToken } from '../auth/guards/utils';
import { extractAccessTokenFromWsClient } from '../auth/utils';
import type { AppSocket } from '../common/types/app-socket';
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
      user: null,
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

    socket.data.user = await this.resolveUser(socket);
    return null;
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

  private async resolveUser(socket: AppSocket): Promise<User | null> {
    const token: string | undefined = extractAccessTokenFromWsClient(socket);
    if (!token) return null;

    try {
      const { id } = await validateAccessToken(
        token,
        this.jwtService,
        this.authConfig.jwtAccessSecret,
      );
      return await resolveFullUser(id, this.userService);
    } catch (error) {
      this.wideEventService.recordError(error, 'ws.connection_auth');
      return null;
    }
  }
}
