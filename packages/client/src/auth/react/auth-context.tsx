'use client';

import type { User } from '@cityborn/api';
import {
  createContext,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
  useCallback,
  useContext,
  useState,
} from 'react';
import type { AuthGateway } from '../../ports/gateways';

interface AuthContextType {
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  initialValue,
  authGateway,
  children,
}: {
  initialValue: User | null;
  authGateway: AuthGateway;
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(initialValue);

  const refreshUser = useCallback(async () => {
    try {
      setUser(await authGateway.getCurrentUser());
    } catch {
      setUser(null);
    }
  }, [authGateway]);

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
