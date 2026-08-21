import type { IncomingHttpHeaders } from 'node:http';

export function resolveClientIpFromHeaders(
  headers: IncomingHttpHeaders,
  fallbackAddress: string,
): string {
  const forwardedFor = headers['x-forwarded-for'];
  const firstForwarded = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0];
  const ip = firstForwarded?.trim();

  return ip && ip.length > 0 ? ip : fallbackAddress;
}
