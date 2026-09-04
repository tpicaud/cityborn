import {
  Global,
  type MiddlewareConsumer,
  Module,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import pino from 'pino';
import { loggerBaseOptions } from '../logger/logger.params';
import { HttpWideEventMiddleware } from '../middlewares/http-wide-event.middleware';
import { WIDE_EVENT_LOGGER } from './wide-event';
import { WideEventService } from './wide-event.service';
import { WsWideEventLifecycle } from './ws-wide-event.lifecycle';

@Global()
@Module({
  imports: [ClsModule.forRoot({ global: true })],
  providers: [
    WideEventService,
    WsWideEventLifecycle,
    HttpWideEventMiddleware,
    {
      provide: WIDE_EVENT_LOGGER,
      useFactory: () => pino(loggerBaseOptions).child({ context: 'WideEvent' }),
    },
  ],
  exports: [WideEventService, WsWideEventLifecycle],
})
export class WideEventModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(HttpWideEventMiddleware)
      .forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }
}
