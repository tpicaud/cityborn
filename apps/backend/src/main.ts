import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './redis/redis.adapter';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const cors = process.env.CORS_ORIGIN ?? '*'
  app.enableCors({
    origin: [cors],
    credentials: true
  })

  app.use(cookieParser());

  app.useGlobalPipes(new ValidationPipe());

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
  app.useWebSocketAdapter(redisIoAdapter);

  // Logger simple de toutes les requêtes
  // app.use((req, res, next) => {
  //   console.log(`${req.method} ${req.url}`);
  //   next();
  // });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
