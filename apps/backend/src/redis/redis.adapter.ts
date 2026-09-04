import type { INestApplicationContext } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { MessageMappingProperties } from '@nestjs/websockets';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import type { Observable } from 'rxjs';
import type { Server, ServerOptions } from 'socket.io';
import type { SessionSocket } from '../common/types/session-socket';
import { WsWideEventLifecycle } from '../common/wide-event/ws-wide-event.lifecycle';

export class RedisIoAdapter extends IoAdapter {
  private constructor(
    app: INestApplicationContext,
    private readonly adapterConstructor: ReturnType<typeof createAdapter>,
    private readonly wsWideEventLifecycle: WsWideEventLifecycle,
  ) {
    super(app);
  }

  static async create(app: INestApplicationContext): Promise<RedisIoAdapter> {
    const logger = new Logger(RedisIoAdapter.name);
    const pubClient = createClient({ url: process.env.REDIS_URL });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    pubClient.on('error', (err) => {
      logger.error('Redis Pub Error:', err);
    });
    subClient.on('error', (err) => {
      logger.error('Redis Sub Error:', err);
    });

    return new RedisIoAdapter(
      app,
      createAdapter(pubClient, subClient),
      app.get(WsWideEventLifecycle),
    );
  }

  bindMessageHandlers(
    client: SessionSocket,
    handlers: MessageMappingProperties[],
    transform: (data: unknown) => Observable<unknown>,
  ): void {
    const wrappedHandlers = handlers.map((handler) => ({
      ...handler,
      callback: (...args: unknown[]) =>
        this.wsWideEventLifecycle.run(
          client,
          handler.message,
          async () => await handler.callback(...args),
        ),
    }));
    super.bindMessageHandlers(client, wrappedHandlers, transform);
  }

  createIOServer(port: number, options?: ServerOptions): Server {
    const server: Server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
        credentials: true,
      },
    });
    server.adapter(this.adapterConstructor);
    return server;
  }
}
