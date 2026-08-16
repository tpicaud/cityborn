import type { User } from '@cityborn/api';
import type { DefaultEventsMap, Socket } from 'socket.io';

export interface SessionSocketData {
  user?: User | null;
  visitorId?: string | string[];
}

export type SessionSocket = Socket<
  DefaultEventsMap,
  DefaultEventsMap,
  DefaultEventsMap,
  SessionSocketData
>;
