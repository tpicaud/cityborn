jest.mock('nanoid', () => ({ nanoid: jest.fn(() => 'request-id') }));

import { contract } from '@cityborn/api';
import { globSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { deriveHttpDomain, deriveWsDomain } from './wide-event';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function collectHttpPaths(value: unknown): string[] {
  if (!isRecord(value)) {
    return [];
  }
  if (typeof value.method === 'string' && typeof value.path === 'string') {
    return [value.path];
  }
  return Object.values(value).flatMap(collectHttpPaths);
}

function collectWsEventNames(): string[] {
  const gatewayPaths = globSync(join(__dirname, '../../**/*.gateway.ts'));
  return gatewayPaths.flatMap((gatewayPath) => {
    const source = readFileSync(gatewayPath, 'utf8');
    return source
      .split('@SubscribeMessage(')
      .slice(1)
      .flatMap((decoratorSuffix) => {
        const trimmedSuffix = decoratorSuffix.trimStart();
        const quote = trimmedSuffix[0];
        if (quote !== String.fromCharCode(39) && quote !== String.fromCharCode(34)) {
          return [];
        }
        const eventName = trimmedSuffix.slice(1).split(quote, 1)[0];
        return eventName ? [eventName] : [];
      });
  });
}

describe('wide event domain coverage', () => {
  it('recognizes every public HTTP contract route', () => {
    const unmappedPaths = collectHttpPaths(contract).filter(
      (path) => deriveHttpDomain(path) === 'other',
    );

    expect(unmappedPaths).toEqual([]);
  });

  it('recognizes every gateway message', () => {
    const eventNames = collectWsEventNames();
    const unmappedEventNames = eventNames.filter(
      (eventName) => deriveWsDomain(eventName) === 'other',
    );

    expect(eventNames).not.toEqual([]);
    expect(unmappedEventNames).toEqual([]);
  });
});
