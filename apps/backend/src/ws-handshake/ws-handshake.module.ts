import { Module } from '@nestjs/common';
import { RateLimitModule } from '../rate-limit/rate-limit.module';
import { AuthenticatedSocketService } from './authenticated-socket.service';
import { WsHandshakeMiddleware } from './ws-handshake.middleware';

@Module({
  imports: [RateLimitModule],
  providers: [AuthenticatedSocketService, WsHandshakeMiddleware],
  exports: [AuthenticatedSocketService, WsHandshakeMiddleware],
})
export class WsHandshakeModule {}
