import { contract, installFrenchZodErrorMap } from '@cityborn/api';
import type { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
import compression from 'compression';
import { Logger } from 'nestjs-pino';
import { VisitorIdInterceptor } from './common/interceptors/visitor-id.interceptor';
import { apiVersionHeaderMiddleware } from './common/middlewares/api-version-header.middleware';
import { HttpWideEventMiddleware } from './common/middlewares/http-wide-event.middleware';
import { backendConfig } from './config/backend.config';
import { RedisIoAdapter } from './redis/redis.adapter';

const DEFAULT_BODY_LIMIT: string = '100kb';
const GEOMETRY_BODY_LIMIT: string = '5mb';
const GEOMETRY_BODY_PATHS: string[] = [
  contract.admin.worldLocation.createWorldLocation.path,
  contract.session.createGame.path,
];

export async function configureApp(app: NestExpressApplication): Promise<void> {
  installFrenchZodErrorMap();

  app.useLogger(app.get(Logger));
  app.flushLogs();

  const httpWideEventMiddleware = app.get(HttpWideEventMiddleware);
  app.use(httpWideEventMiddleware.use.bind(httpWideEventMiddleware));
  app.use(apiVersionHeaderMiddleware);

  app.set('trust proxy', 1);

  app.enableCors({
    origin: backendConfig.http.corsOrigins,
    credentials: true,
  });

  app.useGlobalInterceptors(new VisitorIdInterceptor());

  const redisIoAdapter = await RedisIoAdapter.create(app);
  app.useWebSocketAdapter(redisIoAdapter);

  app.use(GEOMETRY_BODY_PATHS, bodyParser.json({ limit: GEOMETRY_BODY_LIMIT }));
  app.use(bodyParser.json({ limit: DEFAULT_BODY_LIMIT }));
  app.use(bodyParser.urlencoded({ limit: DEFAULT_BODY_LIMIT, extended: true }));
  app.use(
    compression({
      level: 6,
      threshold: 0,
    }),
  );
}
