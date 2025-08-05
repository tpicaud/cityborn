import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './redis/redis.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const cors = process.env.CORS_ORIGIN ?? '*'
  app.enableCors({
    origin: [cors]
  })

  app.useGlobalPipes(new ValidationPipe());

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
