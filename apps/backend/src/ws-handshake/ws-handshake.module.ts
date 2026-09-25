import { Module } from '@nestjs/common';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { WsHandshakeMiddleware } from './ws-handshake.middleware';

@Module({
  imports: [RateLimitModule],
  providers: [WsHandshakeMiddleware],
  exports: [WsHandshakeMiddleware],
})
export class WsHandshakeModule {}
