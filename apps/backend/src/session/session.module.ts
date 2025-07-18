import { Module } from '@nestjs/common';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { RedisHTTPModule } from 'src/redisHTTP/redisHTTP.module';
import { SessionGateway } from './session.gateway';

@Module({
  imports: [RedisHTTPModule],
  controllers: [SessionController],
  providers: [SessionService, SessionGateway],
  exports: [SessionService]
})
export class SessionModule {}
