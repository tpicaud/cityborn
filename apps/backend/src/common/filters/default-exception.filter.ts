import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
} from '@nestjs/common';
import type { Response } from 'express';
import type { SessionSocket } from '../types/session-socket';
import { WideEventService } from '../wide-event/wide-event.service';

@Catch()
export class DefaultExceptionFilter implements ExceptionFilter {
  constructor(private readonly wideEventService: WideEventService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const payload = this.wideEventService.recordError(exception);
    if (host.getType() === 'http') {
      host
        .switchToHttp()
        .getResponse<Response>()
        .status(payload.statusCode)
        .json(payload);
      return;
    }
    if (host.getType() === 'ws') {
      const acknowledgement = host.getArgByIndex<unknown>(2);
      if (typeof acknowledgement === 'function') {
        acknowledgement({ success: false, error: payload });
        return;
      }
      host.switchToWs().getClient<SessionSocket>().emit('error', payload);
    }
  }
}
