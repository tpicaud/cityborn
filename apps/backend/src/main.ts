import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { RequestValidationErrorFilter } from './common/filters/request-validation-error.filter';
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
  // Nest traite les filtres globaux dans l'ordre inverse de leur
  // enregistrement (le dernier gagne en cas de match) : le catch-all
  // doit donc être enregistré avant le filtre spécifique pour que
  // RequestValidationErrorFilter l'emporte sur RequestValidationError.
  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new RequestValidationErrorFilter(),
  );
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
