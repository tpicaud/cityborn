import type { INestApplicationContext } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import type { Server, ServerOptions } from 'socket.io';

export class RedisIoAdapter extends IoAdapter {
  private constructor(
    app: INestApplicationContext,
    private readonly adapterConstructor: ReturnType<typeof createAdapter>,
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

    return new RedisIoAdapter(app, createAdapter(pubClient, subClient));
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
