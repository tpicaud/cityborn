import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { MessageMappingProperties } from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { isObservable, type Observable } from 'rxjs';
import type { Server, ServerOptions } from 'socket.io';
import type { SessionSocket } from '../common/types/session-socket';
import { WideEventService } from '../common/wide-event/wide-event.service';
import { WsWideEventLifecycle } from '../common/wide-event/ws-wide-event.lifecycle';
import {
  HTTP_CONFIG,
  type HttpConfig,
  REDIS_CONFIG,
  type RedisConfig,
} from '../config/config.module';

export class RedisIoAdapter extends IoAdapter {
  private constructor(
    app: INestApplicationContext,
    private readonly adapterConstructor: ReturnType<typeof createAdapter>,
    private readonly wsWideEventLifecycle: WsWideEventLifecycle,
    private readonly corsOrigins: string[],
    private readonly closeRedisConnections: () => Promise<void>,
  ) {
    super(app);
  }

  static async create(app: INestApplicationContext): Promise<RedisIoAdapter> {
    const wideEventService = app.get(WideEventService);
    const redisConfig: RedisConfig = app.get(REDIS_CONFIG);
    const httpConfig: HttpConfig = app.get(HTTP_CONFIG);
    const pubClient = createClient({ url: redisConfig.url });
    const subClient = pubClient.duplicate();

    pubClient.on('error', (err) => {
      wideEventService.recordOperationError(err, {
        domain: 'infrastructure',
        operation: 'redis.pub',
      });
    });
    subClient.on('error', (err) => {
      wideEventService.recordOperationError(err, {
        domain: 'infrastructure',
        operation: 'redis.sub',
      });
    });

    let connected = false;
    try {
      await pubClient.connect();
      await subClient.connect();
      connected = true;
    } finally {
      if (!connected) {
        if (pubClient.isOpen) pubClient.destroy();
        if (subClient.isOpen) subClient.destroy();
      }
    }

    return new RedisIoAdapter(
      app,
      createAdapter(pubClient, subClient),
      app.get(WsWideEventLifecycle),
      httpConfig.corsOrigins,
      async () => {
        await Promise.all([
          pubClient.isOpen ? pubClient.close() : undefined,
          subClient.isOpen ? subClient.close() : undefined,
        ]);
      },
    );
  }

  async dispose(): Promise<void> {
    await this.closeRedisConnections();
  }

  bindMessageHandlers(
    client: SessionSocket,
    handlers: MessageMappingProperties[],
    transform: (data: unknown) => Observable<unknown>,
  ): void {
    const wrappedHandlers = handlers.map((handler) => ({
      ...handler,
      callback: (...args: unknown[]) =>
        this.wsWideEventLifecycle.run(client, handler.message, () =>
          transform(handler.callback(...args)),
        ),
    }));
    super.bindMessageHandlers(client, wrappedHandlers, (result: unknown) =>
      isObservable(result) ? result : transform(result),
    );
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: this.corsOrigins,
        credentials: true,
      },
    });
    server.adapter(this.adapterConstructor);
    return server;
  }
}
