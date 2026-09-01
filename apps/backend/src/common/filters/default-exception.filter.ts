import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { exceptionToApiError } from '../errors/exception-to-api-error';
import { logApiError, sendApiError } from './utils';

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
    logApiError(this.logger, 'HTTP Error', payload, exception);

    sendApiError(host, payload);
  }

  private handleWsContextError(exception: unknown, host: ArgumentsHost) {
    const payload = exceptionToApiError(exception);
    logApiError(this.logger, 'WS Error', payload, exception);

    host.switchToWs().getClient().emit('error', payload);
  }
}
