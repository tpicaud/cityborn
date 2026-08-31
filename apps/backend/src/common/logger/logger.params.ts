import type { Params } from 'nestjs-pino';

const isProduction = process.env.NODE_ENV === 'production';

export const loggerModuleParams: Params = {
  pinoHttp: {
    level: process.env.LOG_LEVEL ?? 'info',
    autoLogging: false,
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
  },
};
