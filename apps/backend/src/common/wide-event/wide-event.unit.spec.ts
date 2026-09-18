import { contract } from '@cityborn/api';
import type { AppRoute, AppRouter } from '@ts-rest/core';
import { isAppRoute } from '@ts-rest/core';
import type { WideEventDomain } from './wide-event';
import { deriveHttpDomain } from './wide-event';

function collectContractPaths(router: AppRouter): string[] {
  return Object.values(router).flatMap((entry: AppRoute | AppRouter) =>
    isAppRoute(entry) ? [entry.path] : collectContractPaths(entry),
  );
}

describe('deriveHttpDomain', () => {
  it('maps every contract route to a domain of the API vocabulary', () => {
    const contractPaths: string[] = collectContractPaths(contract);

    const unclassifiedPaths: string[] = contractPaths.filter(
      (path: string) => deriveHttpDomain(path) === 'other',
    );

    expect(contractPaths.length).toBeGreaterThan(0);
    expect(unclassifiedPaths).toEqual([]);
  });

  it('falls back to other for a route outside the contract', () => {
    const domain: WideEventDomain = deriveHttpDomain('/v1/sessions/:id');

    expect(domain).toBe('other');
  });
});
