'use client';

import type { User } from '@cityborn/api';
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import { type DomainApis, useDomainApis } from '../../shared/apiProvider';
import { useError } from '../../shared/errorContext';

type AuthContextType = {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({
  initialValue,
  children,
}: {
  initialValue: User | null;
  children: ReactNode;
}) => {
  const [user, setUser] = useState<User | null>(initialValue);
  const { authApi }: DomainApis = useDomainApis();
  const { invokeError } = useError();

  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const currentUser: User | null = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch (error: unknown) {
      invokeError(error);
    }
  }, [authApi, invokeError]);

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context: AuthContextType | undefined = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
