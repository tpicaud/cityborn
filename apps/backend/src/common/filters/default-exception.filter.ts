import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';
import {
  exceptionToApiError,
  toWideEventErrorFields,
} from '../errors/exception-to-api-error';
import { enrichWideEventFromCls } from '../wide-event/wide-event.service';
import { logWsApiError, sendApiError } from './utils';

@Catch()
export class DefaultExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DefaultExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctxType = host.getType<'http' | 'ws'>();

    if (ctxType === 'http') {
      this.handleHttpContextError(exception, host);
    } else if (ctxType === 'ws') {
      this.handleWsContextError(exception, host);
    } else {
      this.logger.error(`Unknown error context: ${host.getType()}`);
    }
  }

  private handleHttpContextError(exception: unknown, host: ArgumentsHost) {
    const payload = exceptionToApiError(exception);
    enrichWideEventFromCls(toWideEventErrorFields(payload, exception));

    sendApiError(host, payload);
  }

  private handleWsContextError(exception: unknown, host: ArgumentsHost) {
    const payload = exceptionToApiError(exception);
    const enriched = enrichWideEventFromCls({
      statusCode: payload.statusCode,
      ...toWideEventErrorFields(payload, exception),
    });
    if (!enriched) {
      logWsApiError(this.logger, 'WS Error', payload, exception);
    }

    host.switchToWs().getClient().emit('error', payload);
  }
}
