import type { Params } from 'nestjs-pino';
import type { LoggerOptions } from 'pino';

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
  transport: isProduction
    ? undefined
    : { target: 'pino-pretty', options: { singleLine: true } },
};

export const loggerModuleParams: Params = {
  pinoHttp: {
    ...loggerBaseOptions,
    autoLogging: false,
  },
};
