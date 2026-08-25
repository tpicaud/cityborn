import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { RequestValidationErrorFilter } from './common/filters/request-validation-error.filter';
import { VisitorIdInterceptor } from './common/interceptors/visitor-id.interceptor';
import { apiVersionHeaderMiddleware } from './common/middlewares/api-version-header.middleware';
import { RedisIoAdapter } from './redis/redis.adapter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(apiVersionHeaderMiddleware);

  app.set('trust proxy', 1);

  const cors = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'];
  app.enableCors({
    origin: cors,
    credentials: true,
  });

  app.use(cookieParser());

  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new PrismaExceptionFilter(),
    new RequestValidationErrorFilter(),
  );
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
