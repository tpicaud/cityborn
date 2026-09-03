import {
  Global,
  type MiddlewareConsumer,
  Module,
  type NestModule,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import pino from 'pino';
import { WsWideEventInterceptor } from '../interceptors/ws-wide-event.interceptor';
import { loggerBaseOptions } from '../logger/logger.params';
import { HttpWideEventMiddleware } from './http-wide-event.middleware';
import { WIDE_EVENT_LOGGER } from './wide-event';
import { WideEventService } from './wide-event.service';

@Global()
@Module({
  imports: [ClsModule.forRoot({ global: true })],
  providers: [
    WideEventService,
    HttpWideEventMiddleware,
    {
      provide: WIDE_EVENT_LOGGER,
      useFactory: () => pino(loggerBaseOptions).child({ context: 'WideEvent' }),
    },
    { provide: APP_INTERCEPTOR, useClass: WsWideEventInterceptor },
  ],
  exports: [WideEventService],
})
export class WideEventModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpWideEventMiddleware).forRoutes('*');
  }
}
