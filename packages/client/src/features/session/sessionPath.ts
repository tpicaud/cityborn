import {
  ErrorCode,
  getFriendlyErrorMessage,
  type PackId,
  PackIdSchema,
  type Session,
  type SessionId,
  SessionIdSchema,
  SessionMode,
  UserFacingError,
} from '@cityborn/api';
import type { NavigationPath } from '../../platform/navigation';

const sessionPathPattern: RegExp = new RegExp(
  `^/session/(?:${Object.values(SessionMode).join('|')})/([^/]+)$`,
);

type SessionPath = `/session/${SessionMode}/${string}`;

const launchedPackQueryParam: string = 'pack';

export function sessionPath({
  id,
  mode,
}: Pick<Session, 'id' | 'mode'>): SessionPath {
  return `/session/${mode}/${id}`;
}

export function packLaunchSessionPath({
  session,
  packId,
}: {
  session: Pick<Session, 'id' | 'mode'>;
  packId: PackId;
}): NavigationPath {
  return `${sessionPath(session)}?${launchedPackQueryParam}=${encodeURIComponent(packId)}`;
}

export function launchedPackIdFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
): PackId | undefined {
  const launchedPack: string | string[] | undefined =
    searchParams[launchedPackQueryParam];
  if (typeof launchedPack !== 'string' || launchedPack === '') return undefined;
  return PackIdSchema.parse(launchedPack);
}

export function joinableSessionPath(
  session: Pick<Session, 'id' | 'mode'>,
): NavigationPath {
  if (session.mode === SessionMode.SOLO)
    throw new UserFacingError(
      getFriendlyErrorMessage({ code: ErrorCode.SESSION_SOLO_NOT_JOINABLE }),
    );
  return sessionPath(session);
}

export function sessionIdFromSessionPath(path: string): SessionId | null {
  const pathSegment: string | undefined = sessionPathPattern.exec(path)?.[1];
  if (pathSegment === undefined) return null;
  return SessionIdSchema.parse(pathSegment);
}
