import { Global, Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { WideEventInterceptor } from '../interceptors/wide-event.interceptor';
import { createHttpWideEvent } from './wide-event';
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
    { provide: APP_INTERCEPTOR, useClass: WideEventInterceptor },
  ],
  exports: [WideEventService],
})
export class WideEventModule {}
