import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { RedisIoAdapter } from './redis/redis.adapter';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { VisitorIdInterceptor } from './common/interceptors/visitor-id.interceptor';
import * as compression from 'compression';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const cors = process.env.CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'];
  app.enableCors({
    origin: cors,
    credentials: true,
  });

  // use cookies
  app.use(cookieParser());

  // use validation pipe for dto
  app.useGlobalPipes(new ValidationPipe());

  // use custom exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // use interceptors
  app.useGlobalInterceptors(new VisitorIdInterceptor());

  // use redis adapter
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

  // Logger simple de toutes les requêtes
  // app.use((req, res, next) => {
  //   //console.log(req.headers)
  //   //console.log(req)
  //   console.log(`${req.method} ${req.url}`);
  //   next();
  // });

  await app.listen(process.env.PORT ?? 4000, process.env.HOST ?? '0.0.0.0');
}
bootstrap();
