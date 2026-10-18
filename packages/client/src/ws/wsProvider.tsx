'use client';

import { createContext, type ReactNode, useContext } from 'react';
import type { SocketFactory } from './socketFactory';

type WsProviderProps = {
  createSocket: SocketFactory;
  children: ReactNode;
};

const SocketFactoryContext = createContext<SocketFactory | undefined>(
  undefined,
);

export function WsProvider({ createSocket, children }: WsProviderProps) {
  return (
    <SocketFactoryContext.Provider value={createSocket}>
      {children}
    </SocketFactoryContext.Provider>
  );
}

export function useSocketFactory(): SocketFactory {
  const createSocket: SocketFactory | undefined =
    useContext(SocketFactoryContext);
  if (!createSocket) {
    throw new Error('useSocketFactory must be used within a WsProvider');
  }
  return createSocket;
}
