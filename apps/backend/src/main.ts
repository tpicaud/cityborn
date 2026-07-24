import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { VisitorIdInterceptor } from './common/interceptors/visitor-id.interceptor';
import { RedisIoAdapter } from './redis/redis.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const cors = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'];
  app.enableCors({
    origin: cors,
    credentials: true,
  });

  app.use(cookieParser());
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(new VisitorIdInterceptor());

  const redisIoAdapter = new RedisIoAdapter(app);
  await redisIoAdapter.connectToRedis();
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
