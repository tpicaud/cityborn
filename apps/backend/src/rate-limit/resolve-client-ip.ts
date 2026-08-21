import type { IncomingHttpHeaders } from 'node:http';

export function resolveClientIpFromHeaders(
  headers: IncomingHttpHeaders,
  fallbackAddress: string,
): string {
  const forwardedFor = headers['x-forwarded-for'];
  const rawValue = Array.isArray(forwardedFor)
    ? forwardedFor.join(',')
    : forwardedFor;
  const trustedHop = rawValue?.split(',').at(-1)?.trim();

  return trustedHop && trustedHop.length > 0 ? trustedHop : fallbackAddress;
}
