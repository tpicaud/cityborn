import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import pino from 'pino';
import { HttpWideEventInterceptor } from '../interceptors/http-wide-event.interceptor';
import { WsWideEventInterceptor } from '../interceptors/ws-wide-event.interceptor';
import { loggerBaseOptions } from '../logger/logger.params';
import { createHttpWideEvent, WIDE_EVENT_LOGGER } from './wide-event';
import { WideEventService } from './wide-event.service';

@Global()
@Module({
  imports: [
    ClsModule.forRoot({
      global: true,
      middleware: {
        mount: true,
        setup: (cls, req) => {
          cls.set('wideEvent', createHttpWideEvent(req));
        },
      },
    }),
  ],
  providers: [
    WideEventService,
    {
      provide: WIDE_EVENT_LOGGER,
      useFactory: () => pino(loggerBaseOptions).child({ context: 'WideEvent' }),
    },
    { provide: APP_INTERCEPTOR, useClass: HttpWideEventInterceptor },
    { provide: APP_INTERCEPTOR, useClass: WsWideEventInterceptor },
  ],
  exports: [WideEventService],
})
export class WideEventModule {}
