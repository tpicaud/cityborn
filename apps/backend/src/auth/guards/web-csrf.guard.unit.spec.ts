import { ErrorCode } from '@cityborn/api';
import type { DeepMocked } from '@golevelup/ts-jest';
import { createMock } from '@golevelup/ts-jest';
import type { ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { HttpConfig } from '../../config/config.module';
import { WebCsrfGuard } from './web-csrf.guard';

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

describe('WebCsrfGuard.canActivate', () => {
  it('allows safe requests authenticated by cookies', () => {
    const webCsrfGuard: WebCsrfGuard = new WebCsrfGuard(httpConfig);
    const context: DeepMocked<ExecutionContext> = buildContext('GET', {
      cookie: 'access_token=access-token',
    });

    expect(webCsrfGuard.canActivate(context)).toBe(true);
  });

  it('allows bearer mutations without cookies', () => {
    const webCsrfGuard: WebCsrfGuard = new WebCsrfGuard(httpConfig);
    const context: DeepMocked<ExecutionContext> = buildContext('POST', {
      authorization: 'Bearer access-token',
    });

    expect(webCsrfGuard.canActivate(context)).toBe(true);
  });

  it('allows cookie mutations from an authorized origin', () => {
    const webCsrfGuard: WebCsrfGuard = new WebCsrfGuard(httpConfig);
    const context: DeepMocked<ExecutionContext> = buildContext('POST', {
      cookie: 'access_token=access-token',
      origin: 'https://cityborn.test',
    });

    expect(webCsrfGuard.canActivate(context)).toBe(true);
  });

  it.each([
    ['a missing origin', undefined],
    ['an unauthorized origin', 'https://attacker.test'],
  ])('rejects cookie mutations from %s', (_label, origin) => {
    const webCsrfGuard: WebCsrfGuard = new WebCsrfGuard(httpConfig);
    const headers: Request['headers'] = {
      cookie: 'refresh_token=refresh-token',
    };
    if (origin !== undefined) {
      headers.origin = origin;
    }
    const context: DeepMocked<ExecutionContext> = buildContext('POST', headers);

    expect(() => webCsrfGuard.canActivate(context)).toThrow(
      expect.objectContaining({
        response: expect.objectContaining({
          code: ErrorCode.CSRF_ORIGIN_FORBIDDEN,
        }),
      }),
    );
  });
});
