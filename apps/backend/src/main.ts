import { installFrenchZodErrorMap } from '@cityborn/api';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { VisitorIdInterceptor } from './common/interceptors/visitor-id.interceptor';
import { apiVersionHeaderMiddleware } from './common/middlewares/api-version-header.middleware';
import { HttpWideEventMiddleware } from './common/middlewares/http-wide-event.middleware';
import { RedisIoAdapter } from './redis/redis.adapter';

async function bootstrap() {
  installFrenchZodErrorMap();

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));
  app.flushLogs();

  const httpWideEventMiddleware = app.get(HttpWideEventMiddleware);
  app.use(httpWideEventMiddleware.use.bind(httpWideEventMiddleware));
  app.use(apiVersionHeaderMiddleware);

  app.set('trust proxy', 1);

  const cors = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'];
  app.enableCors({
    origin: cors,
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalInterceptors(new VisitorIdInterceptor());

  const redisIoAdapter = await RedisIoAdapter.create(app);
  app.useWebSocketAdapter(redisIoAdapter);

  app.use(bodyParser.json({ limit: '10mb' }));
  app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
  app.use(
    compression({
      level: 6,
      threshold: 0,
    }),
  );

  await app.listen(process.env.PORT ?? 3001, '0.0.0.0');
}

bootstrap();
