import { ErrorCode } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { HttpConfig } from '../../config/config.module';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../auth.constants';
import { CookieCsrfGuard } from './cookie-csrf.guard';

const httpConfig: HttpConfig = {
  corsOrigins: ['https://cityborn.test', 'https://admin.cityborn.test'],
  frontendUrl: 'https://cityborn.test',
};

function buildContext(
  method: string,
  headers: Request['headers'],
): DeepMocked<ExecutionContext> {
  const request: DeepMocked<Request> = createMock<Request>({
    method,
    headers,
  });
  const context: DeepMocked<ExecutionContext> = createMock<ExecutionContext>();
  context.switchToHttp().getRequest.mockReturnValue(request);
  return context;
}

describe('CookieCsrfGuard.canActivate', () => {
  it('allows safe requests authenticated by cookies', () => {
    const cookieCsrfGuard: CookieCsrfGuard = new CookieCsrfGuard(httpConfig);
    const context: DeepMocked<ExecutionContext> = buildContext('GET', {
      cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token`,
    });

    expect(cookieCsrfGuard.canActivate(context)).toBe(true);
  });

  it('allows bearer mutations without cookies', () => {
    const cookieCsrfGuard: CookieCsrfGuard = new CookieCsrfGuard(httpConfig);
    const context: DeepMocked<ExecutionContext> = buildContext('POST', {
      authorization: 'Bearer access-token',
    });

    expect(cookieCsrfGuard.canActivate(context)).toBe(true);
  });

  it('allows cookie mutations from an authorized origin', () => {
    const cookieCsrfGuard: CookieCsrfGuard = new CookieCsrfGuard(httpConfig);
    const context: DeepMocked<ExecutionContext> = buildContext('POST', {
      cookie: `${ACCESS_TOKEN_COOKIE_NAME}=access-token`,
      origin: 'https://cityborn.test',
    });

    expect(cookieCsrfGuard.canActivate(context)).toBe(true);
  });

  it.each([
    ['a missing origin', undefined],
    ['an unauthorized origin', 'https://attacker.test'],
  ])('rejects cookie mutations from %s', (_label, origin) => {
    const cookieCsrfGuard: CookieCsrfGuard = new CookieCsrfGuard(httpConfig);
    const headers: Request['headers'] = {
      cookie: `${REFRESH_TOKEN_COOKIE_NAME}=refresh-token`,
    };
    if (origin !== undefined) {
      headers.origin = origin;
    }
    const context: DeepMocked<ExecutionContext> = buildContext('POST', headers);

    expect(() => cookieCsrfGuard.canActivate(context)).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          code: ErrorCode.CSRF_ORIGIN_FORBIDDEN,
        }),
      }),
    );
  });
});
