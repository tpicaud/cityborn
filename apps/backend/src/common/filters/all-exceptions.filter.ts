import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpStatus,
    Logger,
    HttpException,
} from '@nestjs/common';
import { ErrorCode, ErrorPayload } from '@cityborn/errors';
import { WsException } from '@nestjs/websockets';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        const ctxType = host.getType<'http' | 'ws'>();

        if (ctxType === 'http') {
            this.handleHttpContextError(exception, host);
        } else if (ctxType === 'ws') {
            this.handleWsContextError(exception, host);
        } else {
            this.logger.error(`Unknown error context: ${host.getType()}`);
        }
    }

    private handleHttpContextError(exception: any, host: ArgumentsHost) {
        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        const error: any = exception instanceof HttpException
            ? exception.getResponse()
            : null;

        const payload: ErrorPayload = {
            statusCode: status,
            code: error?.code ?? ErrorCode.UNKNOWN_ERROR,
            message: error?.message ?? exception.message ?? 'Unexpected error',
        };

        if (payload.code === ErrorCode.UNKNOWN_ERROR) {
            this.logger.error(`HTTP Error: ${payload.code} - ${payload.message}`, exception.stack);
        } else {
            this.logger.warn(`HTTP Error: ${payload.code} - ${payload.message}`);
        }

        const ctx = host.switchToHttp();
        const response = ctx.getResponse();

        response.status(payload.statusCode).json({
            ...payload,
            //timestamp: new Date().toISOString(),
        });
    }

    private handleWsContextError(exception: any, host: ArgumentsHost) {
        const client = host.switchToWs().getClient();
        let payload: ErrorPayload;

        if (exception instanceof WsException) {
            const error: any = exception.getError();
            payload = {
                statusCode: error?.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
                code: error?.code ?? ErrorCode.UNKNOWN_ERROR,
                message: error?.message ?? 'Unexpected error',
            };
        } else if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const error: any = exception.getResponse();
            payload = {
                statusCode: status,
                code: error?.code ?? ErrorCode.UNKNOWN_ERROR,
                message: error?.message ?? 'Unexpected error',
            };
        } else {
            payload = {
                statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
                code: ErrorCode.UNKNOWN_ERROR,
                message: exception.message ?? 'Unexpected error',
            };
        }

        if (payload.code === ErrorCode.UNKNOWN_ERROR) {
            this.logger.error(`WS Error: ${payload.code} - ${payload.message}`, exception.stack);
        } else {
            this.logger.warn(`WS Error: ${payload.code} - ${payload.message}`);
        }

        client.emit('error', {
            ...payload,
            //timestamp: new Date().toISOString(),
        });
    }
}
