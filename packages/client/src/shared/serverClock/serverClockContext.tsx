'use client';

import {
  type Context,
  createContext,
  type ReactNode,
  useContext,
  useState,
} from 'react';
import { createServerClock, type ServerClock } from './serverClock';

const ServerClockContext: Context<ServerClock | undefined> = createContext<
  ServerClock | undefined
>(undefined);

export function ServerClockProvider({ children }: { children: ReactNode }) {
  const [serverClock] = useState<ServerClock>(createServerClock);

  return (
    <ServerClockContext.Provider value={serverClock}>
      {children}
    </ServerClockContext.Provider>
  );
}

export function useServerClock(): ServerClock {
  const serverClock: ServerClock | undefined = useContext(ServerClockContext);
  if (!serverClock)
    throw new Error('useServerClock must be used within a WsProvider');
  return serverClock;
}
