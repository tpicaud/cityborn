import { Global, Module } from '@nestjs/common';
import { type BackendConfig, backendConfig } from './backend.config';

export type RuntimeConfig = BackendConfig['runtime'];
export type AuthConfig = BackendConfig['auth'];
export type HttpConfig = BackendConfig['http'];
export type MailConfig = BackendConfig['mail'];
export type PersistenceConfig = BackendConfig['persistence'];
export type RedisConfig = BackendConfig['redis'];

export const RUNTIME_CONFIG: symbol = Symbol('RUNTIME_CONFIG');
export const AUTH_CONFIG: symbol = Symbol('AUTH_CONFIG');
export const HTTP_CONFIG: symbol = Symbol('HTTP_CONFIG');
export const MAIL_CONFIG: symbol = Symbol('MAIL_CONFIG');
export const PERSISTENCE_CONFIG: symbol = Symbol('PERSISTENCE_CONFIG');
export const REDIS_CONFIG: symbol = Symbol('REDIS_CONFIG');

@Global()
@Module({
  providers: [
    { provide: RUNTIME_CONFIG, useValue: backendConfig.runtime },
    { provide: AUTH_CONFIG, useValue: backendConfig.auth },
    { provide: HTTP_CONFIG, useValue: backendConfig.http },
    { provide: MAIL_CONFIG, useValue: backendConfig.mail },
    { provide: PERSISTENCE_CONFIG, useValue: backendConfig.persistence },
    { provide: REDIS_CONFIG, useValue: backendConfig.redis },
  ],
  exports: [
    RUNTIME_CONFIG,
    AUTH_CONFIG,
    HTTP_CONFIG,
    MAIL_CONFIG,
    PERSISTENCE_CONFIG,
    REDIS_CONFIG,
  ],
})
export class BackendConfigModule {}
