import { ErrorCode } from '@cityborn/errors';
import { ArgumentsHost, Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { BaseWsExceptionFilter, WsException } from '@nestjs/websockets';

@Catch(WsException)
export class WsExceptionFilter extends BaseWsExceptionFilter {
    private readonly logger = new Logger(WsExceptionFilter.name);

    catch(exception: WsException | HttpException, host: ArgumentsHost) {
        const client = host.switchToWs().getClient();
        let payload: { statusCode: HttpStatus, code: string; message: string };

        if (exception instanceof HttpException) {
            const status = exception.getStatus();
            const error: any = exception.getResponse();

            payload = {
                statusCode: status,
                code: error.code ?? ErrorCode.UNKNOWN_ERROR,
                message: error.message ?? 'Unexpected error'
            };
        } else {
            const error: any = exception.getError();

            payload = {
                statusCode: error.statusCode ?? HttpStatus.INTERNAL_SERVER_ERROR,
                code: error.code ?? ErrorCode.UNKNOWN_ERROR,
                message: error.message ?? 'Unexpected error'
            };
        }

        this.logger.error(`WS Error: ${payload.code} - ${payload.message}`);
        client.emit('error', {
            ...payload,
            timestamp: new Date().toISOString(),
        });
    }
}
