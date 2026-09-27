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
import { AuthenticatedSocketService } from './authenticated-socket.service';

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
    private readonly authenticatedSocketService: AuthenticatedSocketService,
    private readonly rateLimitService: RateLimitService,
    private readonly wideEventService: WideEventService,
    private readonly wsWideEventLifecycle: WsWideEventLifecycle,
  ) {}

  use(socket: AppSocket, next: WsHandshakeNext): void {
    socket.data = {
      authentication: { status: 'anonymous' },
      visitorId: parseVisitorId(socket.handshake.query['x-visitor-id']),
    };

    let handshakeContinued: boolean = false;
    const continueHandshake: WsHandshakeNext = (
      error?: WsHandshakeError,
    ): void => {
      handshakeContinued = true;
      next(error);
    };

    void this.wsWideEventLifecycle
      .runConnection(socket, () => this.handshake(socket, continueHandshake))
      .catch((error: unknown) => {
        const rejection: ApiError = this.wideEventService.recordError(
          error,
          'ws.connection',
        );
        if (handshakeContinued) {
          if (socket.connected) socket.disconnect(true);
          return;
        }
        continueHandshake(new WsHandshakeError(rejection));
      });
  }

  private async handshake(
    socket: AppSocket,
    next: WsHandshakeNext,
  ): Promise<void> {
    const rateLimitRejection: ApiError | null =
      await this.consumeConnectionRateLimit(socket);
    if (rateLimitRejection) {
      next(new WsHandshakeError(rateLimitRejection));
      return;
    }

    await this.authenticate(socket, next);
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

  private async authenticate(
    socket: AppSocket,
    next: WsHandshakeNext,
  ): Promise<void> {
    const token: string | undefined = extractAccessTokenFromWsClient(socket);
    if (!token) {
      next();
      return;
    }

    let payload: AuthTokenPayload;
    try {
      payload = await validateAccessToken(
        token,
        this.jwtService,
        this.authConfig.jwtAccessSecret,
      );
    } catch (error) {
      this.wideEventService.recordError(error, 'ws.connection_auth');
      next();
      return;
    }

    socket.data.authentication = {
      status: 'pending',
      userId: payload.id,
      sessionVersion: payload.sessionVersion,
    };
    await this.authenticatedSocketService.joinUserRoom(socket, payload.id);

    try {
      await this.requireAuthentication(payload);
    } catch (error) {
      const rejection: ApiError = this.wideEventService.recordError(
        error,
        'ws.connection_auth',
      );
      next(new WsHandshakeError(rejection));
      return;
    }

    const finalAuthentication: Promise<void> =
      this.finalizeAuthenticationAfterConnection(socket, payload);
    socket.use((_packet, nextPacket) => {
      void finalAuthentication.then(
        () => nextPacket(),
        (error: Error) => nextPacket(error),
      );
    });
    next();

    try {
      await finalAuthentication;
    } catch (error) {
      this.wideEventService.recordError(error, 'ws.connection_auth');
      if (socket.connected) socket.disconnect(true);
    }
  }

  private async finalizeAuthenticationAfterConnection(
    socket: AppSocket,
    payload: AuthTokenPayload,
  ): Promise<void> {
    await new Promise<void>((resolve) => setImmediate(resolve));
    if (!socket.connected) return;

    const authentication: AuthenticationContext =
      await this.requireAuthentication(payload);
    socket.data.authentication = {
      status: 'authenticated',
      ...authentication,
    };
  }

  private async requireAuthentication(
    payload: AuthTokenPayload,
  ): Promise<AuthenticationContext> {
    const authentication: AuthenticationContext | null =
      await resolveAuthenticationContext(payload, this.userService);
    if (authentication) return authentication;

    throw new UnauthorizedException({
      code: ErrorCode.USER_NOT_FOUND,
      message: 'User not found',
    });
  }
}
