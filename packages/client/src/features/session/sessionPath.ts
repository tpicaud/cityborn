import {
  type Session,
  type SessionId,
  SessionIdSchema,
  SessionMode,
} from '@cityborn/api';
import type { NavigationPath } from '../../platform/navigation';

const sessionPathPattern: RegExp = new RegExp(
  `^/session/(?:${Object.values(SessionMode).join('|')})/([^/]+)$`,
);

export function sessionPath({
  id,
  mode,
}: Pick<Session, 'id' | 'mode'>): NavigationPath {
  return `/session/${mode}/${id}`;
}

export function sessionIdFromSessionPath(path: string): SessionId | null {
  const pathSegment: string | undefined = sessionPathPattern.exec(path)?.[1];
  if (pathSegment === undefined) return null;
  return SessionIdSchema.parse(pathSegment);
}
