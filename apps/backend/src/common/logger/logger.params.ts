import { nanoid } from 'nanoid';
import { ClsServiceManager } from 'nestjs-cls';
import type { Params } from 'nestjs-pino';
import type { LoggerOptions } from 'pino';
import type { WideEventClsStore } from '../wide-event/wide-event.service';

const isProduction = process.env.NODE_ENV === 'production';

export const loggerBaseOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? 'info',
  redact: [
    'req.headers.authorization',
    'req.headers.cookie',
    '*.password',
    '*.token',
    '*.refreshToken',
  ],
  mixin: () => {
    const cls = ClsServiceManager.getClsService<WideEventClsStore>();
    const requestId = cls.get('wideEvent')?.requestId;
    return requestId ? { requestId } : {};
  },
  transport: isProduction
    ? undefined
    : { target: 'pino-pretty', options: { singleLine: true } },
};

export const loggerModuleParams: Params = {
  pinoHttp: {
    ...loggerBaseOptions,
    autoLogging: false,
    genReqId: () => nanoid(),
  },
};
