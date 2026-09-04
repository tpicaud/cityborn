import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ClsModule } from 'nestjs-cls';
import { DefaultExceptionFilter } from '../filters/default-exception.filter';
import { HttpWideEventMiddleware } from '../middlewares/http-wide-event.middleware';
import { WideEventService } from './wide-event.service';
import { WsWideEventLifecycle } from './ws-wide-event.lifecycle';

@Global()
@Module({
  imports: [ClsModule.forRoot({ global: true })],
  providers: [
    WideEventService,
    WsWideEventLifecycle,
    HttpWideEventMiddleware,
    DefaultExceptionFilter,
    { provide: APP_FILTER, useExisting: DefaultExceptionFilter },
  ],
  exports: [
    WideEventService,
    WsWideEventLifecycle,
    HttpWideEventMiddleware,
    DefaultExceptionFilter,
  ],
})
export class WideEventModule {}
