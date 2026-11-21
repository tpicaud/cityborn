import type { PlayerId, Session, SessionId } from '@cityborn/api';

export const SESSION_REPOSITORY = Symbol('SESSION_REPOSITORY');

export type StoredSession = {
  session: Session;
  reconnectTokenHashes: Partial<Record<PlayerId, string>>;
  roundDeadline: number | null;
};

export interface SessionRepository {
  find(id: SessionId): Promise<StoredSession | null>;
  save(storedSession: StoredSession): Promise<void>;
  listActiveIds(): Promise<SessionId[]>;
}
