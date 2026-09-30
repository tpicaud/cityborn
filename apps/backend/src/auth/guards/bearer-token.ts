import type { IncomingHttpHeaders } from 'node:http';

export function extractBearerToken(
  headers: IncomingHttpHeaders,
): string | undefined {
  const [type, token] = headers.authorization?.split(' ') ?? [];
  return type === 'Bearer' ? token : undefined;
}
