import { type SessionId, SessionIdSchema } from '@cityborn/api';
import type { NavigationPath } from '../../platform/navigation';

export const soloSessionPath: NavigationPath = '/session/solo';

const multiSessionPathPrefix = '/session/multi/';

export function multiSessionPath(sessionID: SessionId): NavigationPath {
  return `${multiSessionPathPrefix}${sessionID}`;
}

export function sessionIdFromMultiSessionPath(path: string): SessionId | null {
  if (!path.startsWith(multiSessionPathPrefix)) return null;
  const pathSegment: string = path.slice(multiSessionPathPrefix.length);
  if (pathSegment === '' || pathSegment.includes('/')) return null;
  return SessionIdSchema.parse(pathSegment);
}
