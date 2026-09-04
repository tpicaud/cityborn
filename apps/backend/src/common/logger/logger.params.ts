import { nanoid } from 'nanoid';
import { ClsServiceManager } from 'nestjs-cls';
import type { Params } from 'nestjs-pino';
import type { LoggerOptions } from 'pino';
import type { WideEventClsStore } from '../wide-event/wide-event.service';

const isProduction = process.env.NODE_ENV === 'production';

function currentRequestId(): string | undefined {
  return ClsServiceManager.getClsService<WideEventClsStore>().get('wideEvent')
    ?.requestId;
}

export const loggerBaseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  mixin: () => {
    const requestId = currentRequestId();
    return requestId ? { requestId } : {};
  },
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    '*.password',
    '*.token',
    '*.refreshToken',
  ],
  transport: isProduction
    ? undefined
    : { target: 'pino-pretty', options: { singleLine: true } },
};

export const loggerModuleParams: Params = {
  pinoHttp: {
    ...loggerBaseOptions,
    autoLogging: false,
    genReqId: () => currentRequestId() ?? nanoid(),
    customProps: (request) => ({ requestId: request.id }),
  },
};
